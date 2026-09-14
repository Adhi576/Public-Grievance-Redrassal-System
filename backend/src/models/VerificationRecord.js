'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VerificationRecord = sequelize.define('VerificationRecord', {
  verification_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'grievances', key: 'grievance_id' },
  },
  resolution_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'resolutions', key: 'resolution_id' },
  },
  citizen_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  decision: {
    type: DataTypes.ENUM('accepted', 'rejected'),
    allowNull: false,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'verification_records',
  timestamps: false,
  indexes: [
    { fields: ['grievance_id'] },
  ],
});

module.exports = VerificationRecord;
