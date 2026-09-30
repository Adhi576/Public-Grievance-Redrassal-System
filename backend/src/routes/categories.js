'use strict';

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  next();
};

// GET accessible by all authenticated users
router.get('/', verifyToken, categoryController.getAll);

// Admin-only mutation routes
router.use(verifyToken, requireRole('administrator'));

router.post('/', [
  body('name').notEmpty().trim(),
  body('department_id').notEmpty().isInt(),
  body('description').optional().trim(),
  validate
], categoryController.create);

router.put('/:id', [
  body('name').optional().notEmpty().trim(),
  body('department_id').optional().isInt(),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean(),
  validate
], categoryController.update);

router.patch('/:id/status', [
  body('is_active').isBoolean(),
  validate
], categoryController.updateStatus);

// Subcategory management routes
router.post('/:id/subcategories', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  validate
], categoryController.createSubCategory);

router.put('/subcategories/:subId', [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('is_active').optional().isBoolean(),
  validate
], categoryController.updateSubCategory);

router.patch('/subcategories/:subId/status', [
  body('is_active').isBoolean(),
  validate
], categoryController.updateSubCategoryStatus);

module.exports = router;
