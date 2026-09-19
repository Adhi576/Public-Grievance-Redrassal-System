'use strict';

const GrievanceService = require('../services/grievanceService');
const { log } = require('../services/auditService');

// ── Submit ────────────────────────────────────────────────────────────────────
exports.submit = async (req, res, next) => {
  try {
    const grievance = await GrievanceService.submitGrievance(
      req.body,
      req.user.user_id,
      req.files || [],
    );
    await log(req.user.user_id, 'SUBMIT_GRIEVANCE', 'grievance', grievance.grievance_id, null, req.ip);
    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: { grievance_id: grievance.grievance_id, grn: grievance.grn },
    });
  } catch (err) { next(err); }
};

// ── Get single ────────────────────────────────────────────────────────────────
exports.getGrievance = async (req, res, next) => {
  try {
    const { grievance, activeAssignment } = await GrievanceService.getGrievance(
      req.params.id,
      req.user,
    );
    res.json({ success: true, data: { grievance, activeAssignment } });
  } catch (err) { next(err); }
};

// ── List ──────────────────────────────────────────────────────────────────────
exports.listGrievances = async (req, res, next) => {
  try {
    const grievances = await GrievanceService.listGrievances(req.user, req.query);
    res.json({ success: true, data: grievances });
  } catch (err) { next(err); }
};

// ── Assign ────────────────────────────────────────────────────────────────────
exports.assign = async (req, res, next) => {
  try {
    const g = await GrievanceService.assignOfficer(
      req.params.id,
      parseInt(req.body.officer_id, 10),
      req.user,
    );
    await log(req.user.user_id, 'ASSIGN_GRIEVANCE', 'grievance', g.grievance_id,
      { officer_id: req.body.officer_id }, req.ip);
    res.json({ success: true, message: 'Officer assigned successfully' });
  } catch (err) { next(err); }
};

// ── Reassign ──────────────────────────────────────────────────────────────────
exports.reassign = async (req, res, next) => {
  try {
    const g = await GrievanceService.reassignOfficer(
      req.params.id,
      parseInt(req.body.officer_id, 10),
      req.body.reason,
      req.user,
    );
    await log(req.user.user_id, 'REASSIGN_GRIEVANCE', 'grievance', g.grievance_id,
      { to_officer_id: req.body.officer_id, reason: req.body.reason }, req.ip);
    res.json({ success: true, message: 'Officer reassigned successfully' });
  } catch (err) { next(err); }
};

// ── Update Status ─────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
  try {
    const g = await GrievanceService.updateStatus(
      req.params.id,
      req.body.status,
      req.body.note,
      req.user,
    );
    await log(req.user.user_id, 'UPDATE_STATUS', 'grievance', g.grievance_id,
      { new_status: req.body.status }, req.ip);
    res.json({ success: true, message: `Status updated to ${req.body.status}` });
  } catch (err) { next(err); }
};

// ── Add Comment (Remarks) ─────────────────────────────────────────────────────
exports.addRemark = async (req, res, next) => {
  try {
    // Officers and dept heads: is_internal defaults to true (internal processing note)
    const isInternal = ['officer', 'department_head'].includes(req.user.role);
    const comment = await GrievanceService.addComment(
      req.params.id,
      req.body.note,
      req.user,
      isInternal,
    );
    await log(req.user.user_id, 'ADD_COMMENT', 'grievance', parseInt(req.params.id, 10),
      { comment_id: comment.comment_id, is_internal: isInternal }, req.ip);
    res.status(201).json({ success: true, message: 'Comment added', data: comment });
  } catch (err) { next(err); }
};
