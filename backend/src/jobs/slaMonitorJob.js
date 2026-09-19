'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Grievance, GrievanceStatusHistory, Escalation, Notification, Department } = require('../models');
const { log } = require('../services/auditService');

/**
 * Core SLA check logic – extracted so tests can invoke it directly.
 */
async function runSlaCheck() {
  console.log('[SLA Monitor] Running SLA check for ASSIGNED/IN_PROGRESS grievances...');

  const overdueGrievances = await Grievance.findAll({
    where: {
      current_status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] },
      sla_due_date: { [Op.lt]: new Date() },
    },
    include: [
      { model: Department, as: 'department', attributes: ['head_user_id'] },
    ],
  });

  if (overdueGrievances.length === 0) {
    console.log('[SLA Monitor] No overdue grievances found.');
    return 0;
  }

  let escalated = 0;
  for (const g of overdueGrievances) {
    // Prevent duplicate escalation for the same grievance
    const existingEscalation = await Escalation.findOne({
      where: { grievance_id: g.grievance_id, escalated_by_system: true },
    });
    if (existingEscalation) {
      continue;
    }

    const oldStatus = g.current_status;

    await g.update({ current_status: 'ESCALATED' });

    await Escalation.create({
      grievance_id: g.grievance_id,
      escalated_by_system: true,
      escalated_at: new Date(),
      department_head_id: g.department.head_user_id,
    });

    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by: null,
      old_status: oldStatus,
      new_status: 'ESCALATED',
      note: `System auto-escalation: SLA due date (${g.sla_due_date}) exceeded.`,
    });

    await Notification.create({
      user_id: g.department.head_user_id,
      message: `ESCALATION: Grievance ${g.grn} has exceeded its SLA. Requires immediate attention.`,
      type: 'escalation',
      grievance_id: g.grievance_id,
    });

    await log(null, 'AUTO_ESCALATE', 'grievance', g.grievance_id, null, '127.0.0.1');
    escalated++;
  }

  console.log(`[SLA Monitor] Successfully escalated ${escalated} grievance(s).`);
  return escalated;
}

/**
 * Hourly cron job.
 */
const slaMonitorJob = cron.schedule('0 * * * *', async () => {
  try {
    await runSlaCheck();
  } catch (error) {
    console.error('[SLA Monitor] Error during SLA check:', error);
  }
}, {
  scheduled: false, // Started manually in server.js
});

module.exports = slaMonitorJob;
module.exports.runSlaCheck = runSlaCheck;
