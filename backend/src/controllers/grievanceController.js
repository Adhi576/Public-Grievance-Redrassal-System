'use strict';

const GrievanceService = require('../services/grievanceService');
const { log } = require('../services/auditService');

exports.submit = async (req, res, next) => {
  try {
    const grievance = await GrievanceService.submitGrievance(req.body, req.user.user_id, req.files);
    
    // Audit log
    await log(req.user.user_id, 'SUBMIT_GRIEVANCE', 'grievance', grievance.grievance_id, null, req.ip);
    
    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: {
        grievance_id: grievance.grievance_id,
        grn: grievance.grn
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.assign = async (req, res, next) => {
  try {
    const g = await GrievanceService.assignOfficer(req.params.id, req.body.officer_id, req.user);
    await log(req.user.user_id, 'ASSIGN_GRIEVANCE', 'grievance', g.grievance_id, { officer_id: req.body.officer_id }, req.ip);
    res.json({ success: true, message: 'Officer assigned successfully' });
  } catch (err) {
    next(err);
  }
};

exports.reassign = async (req, res, next) => {
  try {
    const g = await GrievanceService.reassignOfficer(req.params.id, req.body.officer_id, req.body.reason, req.user);
    await log(req.user.user_id, 'REASSIGN_GRIEVANCE', 'grievance', g.grievance_id, { to_officer_id: req.body.officer_id }, req.ip);
    res.json({ success: true, message: 'Officer reassigned successfully' });
  } catch (err) {
    next(err);
  }
};
