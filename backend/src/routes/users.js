'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// All user management routes require 'administrator' role
router.use(verifyToken, requireRole('administrator'));

router.get('/', userController.getAll);
router.get('/:id', userController.getById);

router.post('/', [
  body('name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['citizen', 'officer', 'department_head', 'administrator']),
  body('department_id').optional({ nullable: true }).isInt(),
  validate
], userController.create);

router.put('/:id', [
  body('name').optional().notEmpty().trim().escape(),
  body('role').optional().isIn(['citizen', 'officer', 'department_head', 'administrator']),
  body('department_id').optional({ nullable: true }).isInt(),
  validate
], userController.update);

router.patch('/:id/status', [
  body('is_active').isBoolean(),
  validate
], userController.changeStatus);

module.exports = router;
