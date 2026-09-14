'use strict';

const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// GET is accessible by anyone authenticated
router.get('/', verifyToken, departmentController.getAll);

// POST/PUT require administrator
router.use(verifyToken, requireRole('administrator'));

router.post('/', [
  body('name').notEmpty().trim(),
  body('head_user_id').optional({ nullable: true }).isInt(),
  body('sla_days').optional().isInt({ min: 1 }),
  body('description').optional().trim(),
  validate
], departmentController.create);

router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('head_user_id').optional({ nullable: true }).isInt(),
  body('sla_days').optional().isInt({ min: 1 }),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean(),
  validate
], departmentController.update);

module.exports = router;
