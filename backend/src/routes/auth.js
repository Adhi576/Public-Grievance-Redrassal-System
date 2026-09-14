'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware generic handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

router.post('/register', [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('mobile').optional().trim().escape(),
  validate
], authController.register);

router.post('/login', [
  body('email').notEmpty().withMessage('Email required').trim(),
  body('password').notEmpty().withMessage('Password required'),
  validate
], authController.login);

router.post('/logout', verifyToken, authController.logout);

module.exports = router;
