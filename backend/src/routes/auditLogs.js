'use strict';

const express = require('express');
const router  = express.Router();
const alc     = require('../controllers/auditLogController');
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
router.use(requireRole('administrator')); // Enforce admin-only access

// ── GET /api/audit-logs ───────────────────────────────────────────────────────
router.get('/',
  [
    query('user_id').optional().isInt({ min: 1 }).withMessage('user_id must be a positive integer'),
    query('action').optional().isString().trim(),
    query('from').optional().isISO8601().withMessage('from must be a valid ISO 8601 date'),
    query('to').optional().isISO8601().withMessage('to must be a valid ISO 8601 date'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  alc.getLogs,
);

module.exports = router;
