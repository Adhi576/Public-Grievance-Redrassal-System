'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Escalation = sequelize.define('Escalation', {
  escalation_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'grievances', key: 'grievance_id' },
  },
  department_head_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  escalated_by_system: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  escalated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolution_note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'escalations',
  timestamps: false,
  indexes: [
    { fields: ['grievance_id'] },
  ],
});

module.exports = Escalation;
