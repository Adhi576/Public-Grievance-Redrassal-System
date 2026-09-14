'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  report_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  report_type: {
    type: DataTypes.ENUM('status', 'department', 'category', 'sla', 'escalation', 'resolution', 'closure'),
    allowNull: false,
  },
  generated_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  parameters: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Filter params used to generate this report',
  },
  generated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'reports',
  timestamps: false,
});

module.exports = Report;
