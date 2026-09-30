'use strict';

const { EscalationRule, Department, Category } = require('../models');

class EscalationRuleService {
  static async getAll(filters = {}) {
    return EscalationRule.findAll({
      where: filters,
      include: [
        { model: Department, as: 'department', attributes: ['department_id', 'name'] },
        { model: Category, as: 'category', attributes: ['category_id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  static async getById(ruleId) {
    const rule = await EscalationRule.findByPk(ruleId, {
      include: [
        { model: Department, as: 'department', attributes: ['department_id', 'name'] },
        { model: Category, as: 'category', attributes: ['category_id', 'name'] }
      ]
    });
    if (!rule) throw Object.assign(new Error('Escalation rule not found'), { status: 404 });
    return rule;
  }

  static async create(data) {
    const { department_id, category_id, priority, sla_days } = data;
    return EscalationRule.create({
      department_id: department_id ? parseInt(department_id, 10) : null,
      category_id: category_id ? parseInt(category_id, 10) : null,
      priority: priority || null,
      sla_days: parseInt(sla_days, 10) || 7,
      is_active: true
    });
  }

  static async update(ruleId, data) {
    const rule = await this.getById(ruleId);
    const { department_id, category_id, priority, sla_days, is_active } = data;
    await rule.update({
      department_id: department_id !== undefined ? (department_id ? parseInt(department_id, 10) : null) : rule.department_id,
      category_id: category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : rule.category_id,
      priority: priority !== undefined ? (priority || null) : rule.priority,
      sla_days: sla_days !== undefined ? parseInt(sla_days, 10) : rule.sla_days,
      is_active: is_active !== undefined ? is_active : rule.is_active
    });
    return rule;
  }

  static async delete(ruleId) {
    const rule = await this.getById(ruleId);
    await rule.destroy();
    return { success: true };
  }
}

module.exports = EscalationRuleService;
