'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware: verifies the Bearer JWT from the Authorization header.
 * Attaches req.user = { user_id, role, department_id, email } on success.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Re-fetch user to ensure they're still active
    const user = await User.findByPk(decoded.user_id, {
      attributes: ['user_id', 'role', 'department_id', 'email', 'name', 'is_active'],
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Account inactive or not found' });
    }
    req.user = user.toJSON();
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Middleware factory: restricts access to specified roles.
 * Usage: requireRole('administrator') or requireRole('officer', 'department_head')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  return next();
};

module.exports = { verifyToken, requireRole };
