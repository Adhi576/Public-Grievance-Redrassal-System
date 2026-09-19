'use strict';

const express = require('express');
const router  = express.Router();
const rc      = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return next();
};

router.use(verifyToken);

// ── GET /api/reports/summary ──────────────────────────────────────────────────
// Admin: full view   |   Dept head: scoped to their department
router.get('/summary',
  requireRole('administrator', 'department_head'),
  [
    query('from').optional().isISO8601().withMessage('from must be a valid ISO 8601 date'),
    query('to').optional().isISO8601().withMessage('to must be a valid ISO 8601 date'),
    query('department_id').optional().isInt({ min: 1 }),
    validate,
  ],
  rc.summary,
);

module.exports = router;
