'use strict';

const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../config/multer');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// Protect all grievance routes
router.use(verifyToken);

// Submit Grievance (Citizen only)
// Multer handles max 3 files
router.post('/', requireRole('citizen'), upload.array('attachments', 3), [
  body('title').notEmpty().withMessage('Title is required').trim(),
  body('description').notEmpty().withMessage('Description is required').trim(),
  body('category_id').isInt().withMessage('Valid category_id required'),
  validate
], grievanceController.submit);

// Assignment routes (Department Head only)
router.post('/:id/assign', requireRole('department_head', 'administrator'), [
  body('officer_id').isInt().withMessage('Valid officer_id required'),
  validate
], grievanceController.assign);

router.post('/:id/reassign', requireRole('department_head', 'administrator'), [
  body('officer_id').isInt().withMessage('Valid officer_id required'),
  body('reason').notEmpty().withMessage('Reason is required').trim(),
  validate
], grievanceController.reassign);

// Status updates (Officer or Dept Head)
router.patch('/:id/status', requireRole('officer', 'department_head'), [
  body('status').isIn(['UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED']),
  body('note').optional().trim(),
  validate
], grievanceController.updateStatus);

// Remarks (Officer or Dept Head)
router.post('/:id/remarks', requireRole('officer', 'department_head'), [
  body('note').notEmpty().withMessage('Note is required').trim(),
  validate
], grievanceController.addRemark);

module.exports = router;
