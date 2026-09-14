'use strict';

const { Department, User } = require('../models');

class DepartmentService {
  static async getAll() {
    return Department.findAll({
      include: [{ model: User, as: 'head', attributes: ['user_id', 'name', 'email'] }],
      order: [['name', 'ASC']]
    });
  }

  static async getById(id) {
    const dept = await Department.findByPk(id, {
      include: [{ model: User, as: 'head', attributes: ['user_id', 'name', 'email'] }]
    });
    if (!dept) throw Object.assign(new Error('Department not found'), { status: 404 });
    return dept;
  }

  static async create(data) {
    const { name, head_user_id, sla_days, description } = data;
    return Department.create({ name, head_user_id, sla_days, description });
  }

  static async update(id, data) {
    const dept = await this.getById(id);
    const { name, head_user_id, sla_days, description, is_active } = data;
    await dept.update({ name, head_user_id, sla_days, description, is_active });
    return dept;
  }
}

module.exports = DepartmentService;
