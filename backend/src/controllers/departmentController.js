'use strict';

const DepartmentService = require('../services/departmentService');
const { log } = require('../services/auditService');

exports.getAll = async (req, res, next) => {
  try {
    const depts = await DepartmentService.getAll();
    res.json({ success: true, data: depts });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const dept = await DepartmentService.create(req.body);
    await log(req.user.user_id, 'CREATE_DEPARTMENT', 'department', dept.department_id, null, req.ip);
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const dept = await DepartmentService.update(req.params.id, req.body);
    await log(req.user.user_id, 'UPDATE_DEPARTMENT', 'department', dept.department_id, null, req.ip);
    res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
};
