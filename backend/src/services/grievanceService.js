'use strict';

const { Op } = require('sequelize');
const {
  Grievance,
  GrievanceAssignment,
  GrievanceStatusHistory,
  SubCategory,
  Category,
  Department,
  User,
  Attachment,
  Comment,
  Notification,
} = require('../models');
const { generateGRN } = require('../utils/grnGenerator');

// ── Valid status transitions ──────────────────────────────────────────────────
// Officers drive: ASSIGNED → IN_PROGRESS
// System drives escalation
// Dept heads drive: SUBMITTED → UNDER_REVIEW (manual review step)
const VALID_TRANSITIONS = {
  SUBMITTED:                    ['UNDER_REVIEW'],
  UNDER_REVIEW:                 ['ASSIGNED'],     // handled by assignOfficer
  ASSIGNED:                     ['IN_PROGRESS'],
  IN_PROGRESS:                  ['RESOLVED'],     // handled by resolution flow
  ESCALATED:                    ['IN_PROGRESS'],
  REOPENED:                     ['IN_PROGRESS'],
};

class GrievanceService {
  // ── Internal helpers ────────────────────────────────────────────────────────

  /**
   * Returns the standard includes used when loading a grievance for display.
   */
  static _includes() {
    return [
      { model: Department, as: 'department' },
      {
        model: SubCategory, as: 'subCategory',
        include: [{ model: Category, as: 'category' }],
      },
      { model: User, as: 'citizen', attributes: ['user_id', 'name', 'email'] },
    ];
  }

  /**
   * Returns the currently active assignment (unassigned_at IS NULL) for a grievance.
   * Returns null when the grievance is unassigned.
   */
  static async _activeAssignment(grievanceId) {
    return GrievanceAssignment.findOne({
      where: { grievance_id: grievanceId, unassigned_at: null },
      include: [{ model: User, as: 'officer', attributes: ['user_id', 'name', 'email'] }],
    });
  }

  /**
   * Loads a grievance and enforces IDOR access rules:
   *   citizen      → must own the grievance
   *   officer      → must be the currently active assignee
   *   dept_head    → must share the grievance's department
   *   administrator→ unrestricted
   *
   * Throws 404 / 403 with appropriate status codes.
   */
  static async checkAccess(grievanceId, user) {
    const g = await Grievance.findByPk(grievanceId, {
      include: this._includes(),
    });
    if (!g) throw Object.assign(new Error('Grievance not found'), { status: 404 });

    if (user.role === 'citizen' && g.citizen_id !== user.user_id) {
      throw Object.assign(new Error('Forbidden: not your grievance'), { status: 403 });
    }

    if (user.role === 'officer') {
      const active = await this._activeAssignment(grievanceId);
      if (!active || active.officer_id !== user.user_id) {
        throw Object.assign(new Error('Forbidden: not currently assigned to you'), { status: 403 });
      }
    }

    if (user.role === 'department_head' && g.department_id !== user.department_id) {
      throw Object.assign(new Error('Forbidden: not in your department'), { status: 403 });
    }

    return g;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  /**
   * Creates a new grievance.
   * Accepts sub_category_id (required). department_id is auto-derived from
   * SubCategory → Category → Department if not explicitly supplied.
   */
  static async submitGrievance(data, citizenId, files) {
    const {
      title,
      description,
      sub_category_id,
      location,
      priority,
    } = data;

    // Resolve SubCategory → Category → Department
    const subCat = await SubCategory.findByPk(sub_category_id, {
      include: [{ model: Category, as: 'category' }],
    });
    if (!subCat || !subCat.is_active) {
      throw Object.assign(new Error('Invalid or inactive sub-category'), { status: 400 });
    }
    if (!subCat.category || !subCat.category.is_active) {
      throw Object.assign(new Error('Parent category is inactive'), { status: 400 });
    }

    const department_id = subCat.category.department_id;

    const grn = generateGRN();

    const g = await Grievance.create({
      grn,
      title,
      description,
      sub_category_id,
      department_id,
      citizen_id: citizenId,
      location: location || null,
      priority: priority || 'medium',
      current_status: 'SUBMITTED',
    });

    // Attachments
    if (files && files.length > 0) {
      await Attachment.bulkCreate(files.map(file => ({
        grievance_id:    g.grievance_id,
        file_name:       file.originalname,
        stored_name:     file.filename,
        file_path:       file.path,
        file_type:       file.mimetype,
        file_size:       file.size,
        attachment_type: 'citizen_document',
        uploaded_by:     citizenId,
      })));
    }

    // Status history – initial entry
    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by:   citizenId,
      old_status:   null,
      new_status:   'SUBMITTED',
      note:         'Grievance submitted by citizen',
    });

    // Notify department head (fire-and-forget — never crash submission)
    const dept = await Department.findByPk(department_id);
    if (dept && dept.head_user_id) {
      Notification.create({
        user_id:      dept.head_user_id,
        message:      `New grievance submitted: ${grn}`,
        type:         'submission',
        grievance_id: g.grievance_id,
      }).catch(() => {});
    }

    return g;
  }

  // ── Get single / list ───────────────────────────────────────────────────────

  /**
   * Returns a single grievance with full associations for the requesting user.
   * Includes the active assignment so callers know who the current officer is.
   */
  static async getGrievance(grievanceId, user) {
    const g = await this.checkAccess(grievanceId, user);

    const activeAssignment = await this._activeAssignment(grievanceId);
    return { grievance: g, activeAssignment };
  }

  /**
   * Lists grievances visible to the authenticated user.
   *   citizen      → only their own
   *   officer      → only those with an active assignment to them
   *   dept_head    → all in their department
   *   administrator→ all
   *
   * Optional filters: current_status, sub_category_id
   */
  static async listGrievances(user, query = {}) {
    const where = {};
    const { status, sub_category_id, department_id } = query;

    if (status)          where.current_status  = status;
    if (sub_category_id) where.sub_category_id = sub_category_id;
    if (department_id)   where.department_id   = department_id;

    if (user.role === 'citizen') {
      where.citizen_id = user.user_id;
      return Grievance.findAll({ where, include: this._includes(), order: [['created_at', 'DESC']] });
    }

    if (user.role === 'department_head') {
      where.department_id = user.department_id;
      return Grievance.findAll({ where, include: this._includes(), order: [['created_at', 'DESC']] });
    }

    if (user.role === 'officer') {
      // Find grievance IDs currently assigned to this officer
      const activeAssignments = await GrievanceAssignment.findAll({
        where: { officer_id: user.user_id, unassigned_at: null },
        attributes: ['grievance_id'],
      });
      where.grievance_id = { [Op.in]: activeAssignments.map(a => a.grievance_id) };
      return Grievance.findAll({ where, include: this._includes(), order: [['created_at', 'DESC']] });
    }

    // administrator — all
    return Grievance.findAll({ where, include: this._includes(), order: [['created_at', 'DESC']] });
  }

  // ── Assignment ──────────────────────────────────────────────────────────────

  /**
   * Initial assignment of an officer to a grievance.
   * Only allowed when there is NO active assignment and status is SUBMITTED or UNDER_REVIEW.
   */
  static async assignOfficer(grievanceId, officerId, assignerUser) {
    const g = await this.checkAccess(grievanceId, assignerUser);

    const existing = await this._activeAssignment(grievanceId);
    if (existing) {
      throw Object.assign(
        new Error('Grievance already has an active assignment. Use reassign instead.'),
        { status: 400 },
      );
    }

    if (!['SUBMITTED', 'UNDER_REVIEW', 'REOPENED'].includes(g.current_status)) {
      throw Object.assign(
        new Error(`Cannot assign: grievance is in state ${g.current_status}`),
        { status: 400 },
      );
    }

    // Validate officer belongs to the grievance's department
    const officer = await User.findOne({
      where: { user_id: officerId, role: 'officer', department_id: g.department_id, is_active: true },
    });
    if (!officer) {
      throw Object.assign(
        new Error('Officer not found, inactive, wrong role, or not in this department'),
        { status: 400 },
      );
    }

    const assignedAt = new Date();

    // SLA from department.sla_days
    const dept = await Department.findByPk(g.department_id);
    const slaDue = dept && dept.sla_days
      ? new Date(assignedAt.getTime() + dept.sla_days * 24 * 60 * 60 * 1000)
      : null;

    // Create assignment record
    await GrievanceAssignment.create({
      grievance_id: g.grievance_id,
      officer_id:   officerId,
      assigned_by:  assignerUser.user_id,
      assigned_at:  assignedAt,
    });

    // Update grievance fast-access fields (no officer_id column — only timestamps)
    const oldStatus = g.current_status;
    await g.update({
      current_status: 'ASSIGNED',
      assigned_at:    assignedAt,
      sla_due_date:   slaDue,
    });

    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by:   assignerUser.user_id,
      old_status:   oldStatus,
      new_status:   'ASSIGNED',
      note:         `Assigned to officer ID ${officerId}`,
    });

    // Notifications (fire-and-forget)
    Notification.bulkCreate([
      {
        user_id:      officerId,
        message:      `You have been assigned grievance ${g.grn}.`,
        type:         'assignment',
        grievance_id: g.grievance_id,
      },
      {
        user_id:      g.citizen_id,
        message:      `Your grievance ${g.grn} has been assigned to an officer.`,
        type:         'status_change',
        grievance_id: g.grievance_id,
      },
    ]).catch(() => {});

    return g;
  }

  /**
   * Reassigns a grievance to a new officer.
   * Closes the current active assignment (sets unassigned_at) and opens a new one.
   * Preserves full assignment history.
   */
  static async reassignOfficer(grievanceId, newOfficerId, reason, reassignerUser) {
    const g = await this.checkAccess(grievanceId, reassignerUser);

    if (['RESOLVED', 'PENDING_CITIZEN_VERIFICATION', 'PENDING_CLOSURE_APPROVAL', 'CLOSED']
      .includes(g.current_status)) {
      throw Object.assign(
        new Error(`Cannot reassign: grievance is in state ${g.current_status}`),
        { status: 400 },
      );
    }

    const current = await this._activeAssignment(grievanceId);
    if (!current) {
      throw Object.assign(
        new Error('No active assignment to reassign. Use assign first.'),
        { status: 400 },
      );
    }

    if (current.officer_id === newOfficerId) {
      throw Object.assign(
        new Error('New officer is the same as the current officer'),
        { status: 400 },
      );
    }

    // Validate new officer
    const newOfficer = await User.findOne({
      where: { user_id: newOfficerId, role: 'officer', department_id: g.department_id, is_active: true },
    });
    if (!newOfficer) {
      throw Object.assign(
        new Error('New officer not found, inactive, wrong role, or not in this department'),
        { status: 400 },
      );
    }

    const now = new Date();

    // Close the current assignment
    await current.update({ unassigned_at: now });

    // Open a new one
    await GrievanceAssignment.create({
      grievance_id: g.grievance_id,
      officer_id:   newOfficerId,
      assigned_by:  reassignerUser.user_id,
      assigned_at:  now,
      reason:       reason || null,
    });

    // Status history note (status itself does not change on reassignment)
    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by:   reassignerUser.user_id,
      old_status:   g.current_status,
      new_status:   g.current_status,
      note:         `Reassigned from officer ${current.officer_id} to officer ${newOfficerId}. Reason: ${reason}`,
    });

    // Notifications (fire-and-forget)
    Notification.bulkCreate([
      {
        user_id:      newOfficerId,
        message:      `You have been assigned grievance ${g.grn}.`,
        type:         'assignment',
        grievance_id: g.grievance_id,
      },
      {
        user_id:      g.citizen_id,
        message:      `The officer handling your grievance ${g.grn} has been changed.`,
        type:         'status_change',
        grievance_id: g.grievance_id,
      },
    ]).catch(() => {});

    return g;
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  /**
   * Changes grievance current_status and always creates a GrievanceStatusHistory entry.
   */
  static async updateStatus(grievanceId, newStatus, note, user) {
    const g = await this.checkAccess(grievanceId, user);
    const oldStatus = g.current_status;

    const allowed = VALID_TRANSITIONS[oldStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw Object.assign(
        new Error(`Invalid transition from ${oldStatus} to ${newStatus}`),
        { status: 400 },
      );
    }

    await g.update({ current_status: newStatus });

    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by:   user.user_id,
      old_status:   oldStatus,
      new_status:   newStatus,
      note:         note || `Status changed to ${newStatus}`,
    });

    // Notify citizen
    Notification.create({
      user_id:      g.citizen_id,
      message:      `Your grievance ${g.grn} status has changed to ${newStatus}.`,
      type:         'status_change',
      grievance_id: g.grievance_id,
    }).catch(() => {});

    return g;
  }

  // ── Comments (remarks) ──────────────────────────────────────────────────────

  /**
   * Adds a comment on a grievance using the Comments model.
   * is_internal=true for officer/dept-head internal notes; false for citizen-visible notes.
   */
  static async addComment(grievanceId, content, user, isInternal = false) {
    const g = await this.checkAccess(grievanceId, user);

    if (g.current_status === 'CLOSED') {
      throw Object.assign(new Error('Cannot comment on a closed grievance'), { status: 400 });
    }

    const comment = await Comment.create({
      grievance_id: g.grievance_id,
      user_id:      user.user_id,
      content,
      is_internal:  isInternal,
    });

    return comment;
  }
}

module.exports = GrievanceService;
