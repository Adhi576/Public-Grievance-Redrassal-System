'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EscalationRule = sequelize.define('EscalationRule', {
  rule_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  department_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'departments', key: 'department_id' },
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'categories', key: 'category_id' },
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: true,
  },
  sla_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  tableName: 'escalation_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['department_id'] },
  ],
});

module.exports = EscalationRule;
