'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reassignment = sequelize.define('Reassignment', {
  reassignment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'grievances', key: 'grievance_id' },
  },
  from_officer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  to_officer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reassigned_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  reassigned_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'reassignments',
  timestamps: false,
  indexes: [
    { fields: ['grievance_id'] },
  ],
});

module.exports = Reassignment;
