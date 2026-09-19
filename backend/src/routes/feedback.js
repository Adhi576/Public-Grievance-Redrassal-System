'use strict';

const express = require('express');
const router  = express.Router();
const fc      = require('../controllers/feedbackController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  return next();
};

// All feedback routes require a valid JWT
router.use(verifyToken);

// ── Submit Feedback ───────────────────────────────────────────────────────────
// POST /api/feedback/:id   (citizen only)
router.post('/:id',
  requireRole('citizen'),
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be an integer between 1 and 5.'),
    body('comment').optional().isString().trim(),
    validate,
  ],
  fc.submit,
);

// ── Get Feedback ──────────────────────────────────────────────────────────────
// GET /api/feedback/:id   (citizen owner, officer, dept head, admin)
router.get('/:id',
  requireRole('citizen', 'officer', 'department_head', 'administrator'),
  fc.get,
);

module.exports = router;
