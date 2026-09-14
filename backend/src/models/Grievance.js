'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GRIEVANCE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'ESCALATED',
  'RESOLVED',
  'PENDING_CITIZEN_VERIFICATION',
  'PENDING_CLOSURE_APPROVAL',
  'REOPENED',
  'CLOSED',
];

const Grievance = sequelize.define('Grievance', {
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grn: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    comment: 'Grievance Reference Number',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'categories', key: 'category_id' },
  },
  department_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'departments', key: 'department_id' },
  },
  citizen_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  officer_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: 'users', key: 'user_id' },
  },
  status: {
    type: DataTypes.ENUM(...GRIEVANCE_STATUSES),
    allowNull: false,
    defaultValue: 'SUBMITTED',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
  },
  sla_due_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  closed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'grievances',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['citizen_id'] },
    { fields: ['officer_id'] },
    { fields: ['department_id'] },
    { fields: ['status'] },
    { fields: ['sla_due_date'] },
  ],
});

module.exports = { Grievance, GRIEVANCE_STATUSES };
