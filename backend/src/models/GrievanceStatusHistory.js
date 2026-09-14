'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GrievanceStatusHistory = sequelize.define('GrievanceStatusHistory', {
  history_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'grievances', key: 'grievance_id' },
  },
  changed_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true, // null for system-triggered transitions (e.g. SLA escalation)
    references: { model: 'users', key: 'user_id' },
  },
  old_status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  new_status: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  changed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'grievance_status_history',
  timestamps: false, // changed_at serves as timestamp
  indexes: [
    { fields: ['grievance_id'] },
  ],
});

module.exports = GrievanceStatusHistory;
