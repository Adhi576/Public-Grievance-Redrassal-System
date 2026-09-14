'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attachment = sequelize.define('Attachment', {
  attachment_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  grievance_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'grievances', key: 'grievance_id' },
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original filename submitted by user',
  },
  stored_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'UUID-based name on disk',
  },
  file_path: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'MIME type',
  },
  file_size: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: 'Size in bytes',
  },
  attachment_type: {
    type: DataTypes.ENUM('citizen_document', 'resolution_proof'),
    allowNull: false,
    defaultValue: 'citizen_document',
  },
  uploaded_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'users', key: 'user_id' },
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'attachments',
  timestamps: false,
  indexes: [
    { fields: ['grievance_id'] },
  ],
});

module.exports = Attachment;
