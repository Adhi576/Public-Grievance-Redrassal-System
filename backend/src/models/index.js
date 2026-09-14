'use strict';

/**
 * Model index — imports all models and defines all Sequelize associations.
 * Import this once (in app.js or server.js) to register all models.
 */

const sequelize = require('../config/database');

const User                  = require('./User');
const Department            = require('./Department');
const Category              = require('./Category');
const { Grievance }         = require('./Grievance');
const GrievanceStatusHistory= require('./GrievanceStatusHistory');
const Attachment            = require('./Attachment');
const Resolution            = require('./Resolution');
const VerificationRecord    = require('./VerificationRecord');
const Escalation            = require('./Escalation');
const Reassignment          = require('./Reassignment');
const Notification          = require('./Notification');
const Feedback              = require('./Feedback');
const AuditLog              = require('./AuditLog');
const Report                = require('./Report');

// ── Department ↔ Users ────────────────────────────────────────────────────────
Department.hasMany(User, { foreignKey: 'department_id', as: 'members' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// Department head (User)
Department.belongsTo(User, { foreignKey: 'head_user_id', as: 'head' });

// ── Department ↔ Categories ───────────────────────────────────────────────────
Department.hasMany(Category, { foreignKey: 'department_id', as: 'categories' });
Category.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// ── Grievances ────────────────────────────────────────────────────────────────
// Citizen
User.hasMany(Grievance, { foreignKey: 'citizen_id', as: 'submittedGrievances' });
Grievance.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });

// Officer
User.hasMany(Grievance, { foreignKey: 'officer_id', as: 'assignedGrievances' });
Grievance.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

// Category
Category.hasMany(Grievance, { foreignKey: 'category_id', as: 'grievances' });
Grievance.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Department
Department.hasMany(Grievance, { foreignKey: 'department_id', as: 'grievances' });
Grievance.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// ── GrievanceStatusHistory ────────────────────────────────────────────────────
Grievance.hasMany(GrievanceStatusHistory, { foreignKey: 'grievance_id', as: 'statusHistory' });
GrievanceStatusHistory.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
GrievanceStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

// ── Attachments ───────────────────────────────────────────────────────────────
Grievance.hasMany(Attachment, { foreignKey: 'grievance_id', as: 'attachments' });
Attachment.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Attachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// ── Resolutions ───────────────────────────────────────────────────────────────
Grievance.hasMany(Resolution, { foreignKey: 'grievance_id', as: 'resolutions' });
Resolution.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Resolution.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

// ── VerificationRecords ───────────────────────────────────────────────────────
Grievance.hasMany(VerificationRecord, { foreignKey: 'grievance_id', as: 'verifications' });
VerificationRecord.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
VerificationRecord.belongsTo(Resolution, { foreignKey: 'resolution_id', as: 'resolution' });
VerificationRecord.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });

// ── Escalations ───────────────────────────────────────────────────────────────
Grievance.hasMany(Escalation, { foreignKey: 'grievance_id', as: 'escalations' });
Escalation.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Escalation.belongsTo(User, { foreignKey: 'department_head_id', as: 'departmentHead' });

// ── Reassignments ─────────────────────────────────────────────────────────────
Grievance.hasMany(Reassignment, { foreignKey: 'grievance_id', as: 'reassignments' });
Reassignment.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Reassignment.belongsTo(User, { foreignKey: 'from_officer_id', as: 'fromOfficer' });
Reassignment.belongsTo(User, { foreignKey: 'to_officer_id', as: 'toOfficer' });
Reassignment.belongsTo(User, { foreignKey: 'reassigned_by', as: 'reassignedBy' });

// ── Notifications ─────────────────────────────────────────────────────────────
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Notification.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });

// ── Feedback ──────────────────────────────────────────────────────────────────
Grievance.hasOne(Feedback, { foreignKey: 'grievance_id', as: 'feedback' });
Feedback.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Feedback.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });

// ── AuditLogs ─────────────────────────────────────────────────────────────────
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Reports ───────────────────────────────────────────────────────────────────
User.hasMany(Report, { foreignKey: 'generated_by', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'generated_by', as: 'generatedBy' });

module.exports = {
  sequelize,
  User,
  Department,
  Category,
  Grievance,
  GrievanceStatusHistory,
  Attachment,
  Resolution,
  VerificationRecord,
  Escalation,
  Reassignment,
  Notification,
  Feedback,
  AuditLog,
  Report,
};
