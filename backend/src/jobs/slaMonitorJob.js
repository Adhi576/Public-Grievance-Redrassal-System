'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Grievance, GrievanceStatusHistory, Escalation, Notification, Department } = require('../models');
const { log } = require('../services/auditService');

/**
 * Job that runs every hour to check for SLA breaches.
 */
const slaMonitorJob = cron.schedule('0 * * * *', async () => {
  console.log('[SLA Monitor] Running SLA check for IN_PROGRESS grievances...');
  
  try {
    const overdueGrievances = await Grievance.findAll({
      where: {
        current_status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] },
        sla_due_date: {
          [Op.lt]: new Date()
        }
      },
      include: [
        { model: Department, as: 'department', attributes: ['head_user_id'] }
      ]
    });

    if (overdueGrievances.length === 0) {
      console.log('[SLA Monitor] No overdue grievances found.');
      return;
    }

    for (const g of overdueGrievances) {
      // Check if already escalated to prevent duplicate escalation for same breach
      const existingEscalation = await Escalation.findOne({
        where: { grievance_id: g.grievance_id, escalated_by_system: true }
      });
      if (existingEscalation) {
        continue; // skip if already escalated by system
      }

      const oldStatus = g.current_status;

      // Transition to ESCALATED
      await g.update({ current_status: 'ESCALATED' });

      // Add to escalation table
      await Escalation.create({
        grievance_id: g.grievance_id,
        escalated_by_system: true,
        escalated_at: new Date(),
        department_head_id: g.department.head_user_id
      });

      // Status history note
      await GrievanceStatusHistory.create({
        grievance_id: g.grievance_id,
        changed_by: null, // System action
        old_status: oldStatus,
        new_status: 'ESCALATED',
        note: `System auto-escalation: SLA due date (${g.sla_due_date}) exceeded.`
      });

      // Notify Department Head
      await Notification.create({
        user_id: g.department.head_user_id,
        message: `ESCALATION: Grievance ${g.grn} has exceeded its SLA. Requires immediate attention.`,
        type: 'escalation',
        grievance_id: g.grievance_id
      });

      await log(null, 'AUTO_ESCALATE', 'grievance', g.grievance_id, null, '127.0.0.1');
    }

    console.log(`[SLA Monitor] Successfully escalated ${overdueGrievances.length} grievance(s).`);
  } catch (error) {
    console.error('[SLA Monitor] Error during SLA check:', error);
  }
}, {
  scheduled: false // Export and let server.js manually start it
});

module.exports = slaMonitorJob;
