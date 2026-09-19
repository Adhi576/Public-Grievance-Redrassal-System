'use strict';

const express = require('express');
const router  = express.Router();
const gc      = require('../controllers/grievanceController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload  = require('../config/multer');
const { body, query, validationResult } = require('express-validator');

// ── Validation helper ─────────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return next();
};

// All grievance routes require a valid JWT
router.use(verifyToken);

// ── List Grievances ───────────────────────────────────────────────────────────
// GET /api/grievances
// citizen → own, officer → assigned to them, dept_head → department, admin → all
router.get('/', [
  query('status').optional().isString(),
  query('sub_category_id').optional().isInt(),
  query('department_id').optional().isInt(),
  validate,
], gc.listGrievances);

// ── Submit Grievance ──────────────────────────────────────────────────────────
// POST /api/grievances  (citizen only, max 3 attachments)
router.post('/',
  requireRole('citizen'),
  upload.array('attachments', 3),
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('description').notEmpty().withMessage('Description is required').trim(),
    body('sub_category_id').isInt({ min: 1 }).withMessage('Valid sub_category_id required'),
    body('location').optional().isString().trim(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    validate,
  ],
  gc.submit,
);

// ── Get Single Grievance ──────────────────────────────────────────────────────
// GET /api/grievances/:id
router.get('/:id', gc.getGrievance);

// ── Assign Officer ────────────────────────────────────────────────────────────
// POST /api/grievances/:id/assign  (dept head or admin)
router.post('/:id/assign',
  requireRole('department_head', 'administrator'),
  [
    body('officer_id').isInt({ min: 1 }).withMessage('Valid officer_id required'),
    validate,
  ],
  gc.assign,
);

// ── Reassign Officer ──────────────────────────────────────────────────────────
// POST /api/grievances/:id/reassign  (dept head or admin)
router.post('/:id/reassign',
  requireRole('department_head', 'administrator'),
  [
    body('officer_id').isInt({ min: 1 }).withMessage('Valid officer_id required'),
    body('reason').notEmpty().withMessage('Reason is required').trim(),
    validate,
  ],
  gc.reassign,
);

// ── Update Status ─────────────────────────────────────────────────────────────
// PATCH /api/grievances/:id/status  (officer or dept head)
// Allowed manual transitions: ASSIGNED→IN_PROGRESS, SUBMITTED→UNDER_REVIEW, ESCALATED→IN_PROGRESS, REOPENED→IN_PROGRESS
router.patch('/:id/status',
  requireRole('officer', 'department_head', 'administrator'),
  [
    body('status')
      .isIn(['UNDER_REVIEW', 'IN_PROGRESS', 'ESCALATED', 'REOPENED'])
      .withMessage('Invalid status value'),
    body('note').optional().isString().trim(),
    validate,
  ],
  gc.updateStatus,
);

// ── Add Remark / Comment ──────────────────────────────────────────────────────
// POST /api/grievances/:id/remarks  (officer or dept head)
// Stored in Comments table (is_internal=true for officers/dept-heads)
router.post('/:id/remarks',
  requireRole('officer', 'department_head', 'administrator'),
  [
    body('note').notEmpty().withMessage('Note/comment content is required').trim(),
    validate,
  ],
  gc.addRemark,
);

// ── Resolve Grievance ─────────────────────────────────────────────────────────
// POST /api/grievances/:id/resolve  (officer only, max 3 attachments)
router.post('/:id/resolve',
  requireRole('officer'),
  upload.array('attachments', 3),
  [
    body('action_taken').notEmpty().withMessage('Action taken is required').trim(),
    body('resolution_description').notEmpty().withMessage('Resolution description is required').trim(),
    validate,
  ],
  gc.resolve,
);

// ── Verify Resolution ─────────────────────────────────────────────────────────
// POST /api/grievances/:id/verify  (citizen only)
router.post('/:id/verify',
  requireRole('citizen'),
  [
    body('resolution_id').isInt({ min: 1 }).withMessage('Valid resolution_id required'),
    body('decision').isIn(['accepted', 'rejected']).withMessage('Decision must be accepted or rejected'),
    body('rejection_reason').optional().isString().trim(),
    validate,
  ],
  gc.verify,
);

module.exports = router;
