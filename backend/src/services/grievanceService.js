'use strict';

const { Grievance, GrievanceStatusHistory, Category, Department, User, Attachment, Resolution, Notification } = require('../models');
const { generateGRN } = require('../utils/grnGenerator');

class GrievanceService {
  /**
   * Helper: check IDOR/ownership access
   */
  static async checkAccess(grievanceId, user) {
    const g = await Grievance.findByPk(grievanceId, {
      include: [
        { model: Department, as: 'department' },
        { model: Category, as: 'category' },
        { model: User, as: 'citizen', attributes: ['name', 'email'] },
        { model: User, as: 'officer', attributes: ['name', 'email'] }
      ]
    });
    if (!g) throw Object.assign(new Error('Grievance not found'), { status: 404 });

    if (user.role === 'citizen' && g.citizen_id !== user.user_id) {
      throw Object.assign(new Error('Forbidden: Not your grievance'), { status: 403 });
    }
    if (user.role === 'officer' && g.officer_id !== user.user_id) {
      throw Object.assign(new Error('Forbidden: Not assigned to you'), { status: 403 });
    }
    if (user.role === 'department_head' && g.department_id !== user.department_id) {
      throw Object.assign(new Error('Forbidden: Not in your department'), { status: 403 });
    }
    return g;
  }

  static async submitGrievance(data, citizenId, files) {
    const { title, description, category_id } = data;
    
    // Auto-route to department based on category
    const cat = await Category.findByPk(category_id);
    if (!cat) throw Object.assign(new Error('Invalid category'), { status: 400 });

    const grn = generateGRN();

    const g = await Grievance.create({
      grn, title, description,
      category_id,
      department_id: cat.department_id,
      citizen_id: citizenId,
      status: 'SUBMITTED'
    });

    // Handle attachments
    if (files && files.length > 0) {
      const attachments = files.map(file => ({
        grievance_id: g.grievance_id,
        file_name: file.originalname,
        stored_name: file.filename,
        file_path: file.path,
        file_type: file.mimetype,
        file_size: file.size,
        attachment_type: 'citizen_document',
        uploaded_by: citizenId
      }));
      await Attachment.bulkCreate(attachments);
    }

    // Status history
    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by: citizenId,
      new_status: 'SUBMITTED',
      note: 'Grievance submitted by citizen'
    });

    // Notify Dept Head
    Notification.create({
      user_id: (await Department.findByPk(cat.department_id)).head_user_id,
      message: `New grievance submitted: ${grn}`,
      type: 'submission',
      grievance_id: g.grievance_id
    });

    return g;
  }

  static async assignOfficer(grievanceId, officerId, deptHeadUser) {
    const g = await this.checkAccess(grievanceId, deptHeadUser);
    
    // Only SUBMITTED or UNDER_REVIEW can be initially assigned
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(g.status)) {
      throw Object.assign(new Error('Grievance is already assigned or in an invalid state for initial assignment'), { status: 400 });
    }

    const dept = await Department.findByPk(g.department_id);
    
    // SLA calculation: assigned_at + sla_days
    const assignedAt = new Date();
    const slaDue = new Date(assignedAt.getTime() + (dept.sla_days * 24 * 60 * 60 * 1000));

    await g.update({
      officer_id: officerId,
      status: 'ASSIGNED',
      assigned_at: assignedAt,
      sla_due_date: slaDue
    });

    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by: deptHeadUser.user_id,
      old_status: 'SUBMITTED',
      new_status: 'ASSIGNED',
      note: `Assigned to officer ID ${officerId}`
    });

    // Notify Officer and Citizen
    Notification.bulkCreate([
      { user_id: officerId, message: `You have been assigned grievance ${g.grn}.`, type: 'assignment', grievance_id: g.grievance_id },
      { user_id: g.citizen_id, message: `Your grievance ${g.grn} has been assigned to an officer.`, type: 'status_change', grievance_id: g.grievance_id }
    ]);

    return g;
  }

  static async reassignOfficer(grievanceId, newOfficerId, reason, deptHeadUser) {
    const g = await this.checkAccess(grievanceId, deptHeadUser);
    const oldOfficerId = g.officer_id;

    if (!oldOfficerId) {
      throw Object.assign(new Error('Cannot reassign an unassigned grievance. Use assignment instead.'), { status: 400 });
    }

    await g.update({ officer_id: newOfficerId });

    // Ensure status is ASSIGNED or IN_PROGRESS, not RESOLVED/CLOSED etc
    if (['RESOLVED', 'PENDING_CITIZEN_VERIFICATION', 'PENDING_CLOSURE_APPROVAL', 'CLOSED'].includes(g.status)) {
       throw Object.assign(new Error('Cannot reassign a resolved or closed grievance.'), { status: 400 });
    }

    const { Reassignment } = require('../models');
    await Reassignment.create({
      grievance_id: g.grievance_id,
      from_officer_id: oldOfficerId,
      to_officer_id: newOfficerId,
      reason: reason,
      reassigned_by: deptHeadUser.user_id
    });

    Notification.bulkCreate([
      { user_id: newOfficerId, message: `You have been reassigned grievance ${g.grn}.`, type: 'assignment', grievance_id: g.grievance_id },
      { user_id: g.citizen_id, message: `The officer for your grievance ${g.grn} has been changed.`, type: 'status_change', grievance_id: g.grievance_id }
    ]);

    return g;
  }

  static async updateStatus(grievanceId, newStatus, note, user) {
    const g = await this.checkAccess(grievanceId, user);
    
    // Status transition validation logic
    const oldStatus = g.status;
    const validTransitions = {
      'SUBMITTED': ['UNDER_REVIEW'],
      'UNDER_REVIEW': ['ASSIGNED'], // mostly handled by assign routine
      'ASSIGNED': ['IN_PROGRESS'],
      'IN_PROGRESS': ['RESOLVED'], // mostly handled by resolve routine
      'ESCALATED': ['IN_PROGRESS'],
      'REOPENED': ['IN_PROGRESS']
    };

    if (!validTransitions[oldStatus] || !validTransitions[oldStatus].includes(newStatus)) {
      throw Object.assign(new Error(`Invalid state transition from ${oldStatus} to ${newStatus}`), { status: 400 });
    }

    await g.update({ status: newStatus });
    
    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by: user.user_id,
      old_status: oldStatus,
      new_status: newStatus,
      note: note || `Status changed to ${newStatus}`
    });

    Notification.create({
      user_id: g.citizen_id,
      message: `Your grievance ${g.grn} status has been updated to ${newStatus}.`,
      type: 'status_change',
      grievance_id: g.grievance_id
    });

    return g;
  }

  static async addRemark(grievanceId, note, officerUser) {
    const g = await this.checkAccess(grievanceId, officerUser);
    
    if (g.status === 'CLOSED') {
      throw Object.assign(new Error('Cannot add remarks to a closed grievance'), { status: 400 });
    }

    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by: officerUser.user_id,
      old_status: g.status,
      new_status: g.status,  // No status change, just a remark over the current status
      note: note
    });

    return g;
  }
}

module.exports = GrievanceService;
