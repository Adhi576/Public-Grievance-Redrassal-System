'use strict';

const AuthService = require('../services/authService');
const { log } = require('../services/auditService');

exports.register = async (req, res, next) => {
  try {
    const user = await AuthService.registerCitizen(req.body);
    await log(user.user_id, 'REGISTER_CITIZEN', 'user', user.user_id, null, req.ip);
    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await AuthService.login(email, password);
    await log(user.user_id, 'LOGIN', 'user', user.user_id, null, req.ip);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  // Client handles token deletion. We log the logout.
  const userId = req.user ? req.user.user_id : null;
  if (userId) {
    await log(userId, 'LOGOUT', 'user', userId, null, req.ip);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};
