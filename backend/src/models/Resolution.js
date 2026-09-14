'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resolution = sequelize.define('Resolution', {
  resolution_id: {
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
  resolution_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  action_taken: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'resolutions',
  timestamps: false,
  indexes: [
    { fields: ['grievance_id'] },
  ],
});

module.exports = Resolution;
