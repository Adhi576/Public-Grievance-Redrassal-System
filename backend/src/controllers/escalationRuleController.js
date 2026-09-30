'use strict';

const EscalationRuleService = require('../services/escalationRuleService');
const { log } = require('../services/auditService');

exports.getAll = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.department_id) filters.department_id = req.query.department_id;
    if (req.query.priority) filters.priority = req.query.priority;

    const rules = await EscalationRuleService.getAll(filters);
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const rule = await EscalationRuleService.getById(req.params.id);
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const rule = await EscalationRuleService.create(req.body);
    await log(req.user.user_id, 'CREATE_ESCALATION_RULE', 'escalation_rule', rule.rule_id, null, req.ip);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const rule = await EscalationRuleService.update(req.params.id, req.body);
    await log(req.user.user_id, 'UPDATE_ESCALATION_RULE', 'escalation_rule', rule.rule_id, null, req.ip);
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    await EscalationRuleService.delete(req.params.id);
    await log(req.user.user_id, 'DELETE_ESCALATION_RULE', 'escalation_rule', parseInt(req.params.id, 10), null, req.ip);
    res.json({ success: true, message: 'Escalation rule deleted' });
  } catch (err) {
    next(err);
  }
};
