'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GrievanceAssignment = sequelize.define('GrievanceAssignment', {
  assignment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'grievances', key: 'grievance_id' },
  },
  officer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  assigned_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  unassigned_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'grievance_assignments',
  timestamps: false,
  indexes: [
    { fields: ['grievance_id'] },
    { fields: ['officer_id'] },
  ],
});

module.exports = GrievanceAssignment;
