'use strict';

const express = require('express');
const router = express.Router();
const erc = require('../controllers/escalationRuleController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

router.use(verifyToken);

// Accessible by Admin and Department Head
router.get('/', requireRole('administrator', 'department_head'), erc.getAll);
router.get('/:id', requireRole('administrator', 'department_head'), erc.getById);

// Admin-only mutation routes
router.use(requireRole('administrator'));

router.post('/', [
  body('sla_days').isInt({ min: 1 }).withMessage('sla_days must be a positive integer'),
  body('department_id').optional({ nullable: true }).isInt(),
  body('category_id').optional({ nullable: true }).isInt(),
  body('priority').optional({ nullable: true }).isIn(['low', 'medium', 'high']),
  validate
], erc.create);

router.put('/:id', [
  body('sla_days').optional().isInt({ min: 1 }),
  body('department_id').optional({ nullable: true }).isInt(),
  body('category_id').optional({ nullable: true }).isInt(),
  body('priority').optional({ nullable: true }).isIn(['low', 'medium', 'high']),
  body('is_active').optional().isBoolean(),
  validate
], erc.update);

router.delete('/:id', erc.delete);

module.exports = router;
