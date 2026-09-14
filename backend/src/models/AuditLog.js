'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  log_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true, // null for system actions
    references: { model: 'users', key: 'user_id' },
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'e.g. LOGIN, ASSIGN, STATUS_CHANGE, RESOLVE',
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'e.g. grievance, user, department',
  },
  entity_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Extra context as JSON',
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'audit_logs',
  timestamps: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['timestamp'] },
  ],
});

module.exports = AuditLog;
