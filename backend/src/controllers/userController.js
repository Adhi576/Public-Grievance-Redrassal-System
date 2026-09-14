'use strict';

const UserService = require('../services/userService');
const { log } = require('../services/auditService');

exports.getAll = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.department_id) filters.department_id = req.query.department_id;
    
    const users = await UserService.getAllUsers(filters);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    await log(req.user.user_id, 'CREATE_USER', 'user', user.user_id, { role: user.role }, req.ip);
    res.status(201).json({ success: true, message: 'User created' });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    await log(req.user.user_id, 'UPDATE_USER', 'user', user.user_id, null, req.ip);
    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    next(err);
  }
};

exports.changeStatus = async (req, res, next) => {
  try {
    const { is_active } = req.body;
    const user = await UserService.changeStatus(req.params.id, is_active);
    await log(req.user.user_id, 'CHANGE_USER_STATUS', 'user', user.user_id, { is_active }, req.ip);
    res.json({ success: true, message: 'User status updated' });
  } catch (err) {
    next(err);
  }
};
