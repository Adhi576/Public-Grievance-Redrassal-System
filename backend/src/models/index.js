'use strict';

/**
 * Model index — imports all models and defines all Sequelize associations.
 * Import this once (in app.js or server.js) to register all models.
 */

const sequelize = require('../config/database');

const User                  = require('./User');
const Department            = require('./Department');
const Category              = require('./Category');
const SubCategory           = require('./SubCategory');
const { Grievance }         = require('./Grievance');
const GrievanceAssignment   = require('./GrievanceAssignment');
const GrievanceStatusHistory= require('./GrievanceStatusHistory');
const Attachment            = require('./Attachment');
const Resolution            = require('./Resolution');
const ResolutionVerification= require('./ResolutionVerification');
const Escalation            = require('./Escalation');
const EscalationRule        = require('./EscalationRule');
const Comment               = require('./Comment');
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

// ── Category ↔ SubCategories ──────────────────────────────────────────────────
Category.hasMany(SubCategory, { foreignKey: 'category_id', as: 'subCategories' });
SubCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ── EscalationRule ────────────────────────────────────────────────────────────
Department.hasMany(EscalationRule, { foreignKey: 'department_id', as: 'escalationRules' });
EscalationRule.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Category.hasMany(EscalationRule, { foreignKey: 'category_id', as: 'escalationRules' });
EscalationRule.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ── Grievances ────────────────────────────────────────────────────────────────
// Citizen
User.hasMany(Grievance, { foreignKey: 'citizen_id', as: 'submittedGrievances' });
Grievance.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });

// SubCategory
SubCategory.hasMany(Grievance, { foreignKey: 'sub_category_id', as: 'grievances' });
Grievance.belongsTo(SubCategory, { foreignKey: 'sub_category_id', as: 'subCategory' });

// Department
Department.hasMany(Grievance, { foreignKey: 'department_id', as: 'grievances' });
Grievance.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

// ── GrievanceAssignments ──────────────────────────────────────────────────────
Grievance.hasMany(GrievanceAssignment, { foreignKey: 'grievance_id', as: 'assignments' });
GrievanceAssignment.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });

User.hasMany(GrievanceAssignment, { foreignKey: 'officer_id', as: 'assignedGrievances' });
GrievanceAssignment.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

GrievanceAssignment.belongsTo(User, { foreignKey: 'assigned_by', as: 'assignedBy' });

// ── GrievanceStatusHistory ────────────────────────────────────────────────────
Grievance.hasMany(GrievanceStatusHistory, { foreignKey: 'grievance_id', as: 'statusHistory' });
GrievanceStatusHistory.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
GrievanceStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });

// ── Comments ──────────────────────────────────────────────────────────────────
Grievance.hasMany(Comment, { foreignKey: 'grievance_id', as: 'comments' });
Comment.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ── Attachments ───────────────────────────────────────────────────────────────
Grievance.hasMany(Attachment, { foreignKey: 'grievance_id', as: 'attachments' });
Attachment.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Attachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// ── Resolutions ───────────────────────────────────────────────────────────────
Grievance.hasMany(Resolution, { foreignKey: 'grievance_id', as: 'resolutions' });
Resolution.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Resolution.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

// ── ResolutionVerifications ───────────────────────────────────────────────────
Resolution.hasMany(ResolutionVerification, { foreignKey: 'resolution_id', as: 'verifications' });
ResolutionVerification.belongsTo(Resolution, { foreignKey: 'resolution_id', as: 'resolution' });
ResolutionVerification.belongsTo(User, { foreignKey: 'citizen_id', as: 'citizen' });

// ── Escalations ───────────────────────────────────────────────────────────────
Grievance.hasMany(Escalation, { foreignKey: 'grievance_id', as: 'escalations' });
Escalation.belongsTo(Grievance, { foreignKey: 'grievance_id', as: 'grievance' });
Escalation.belongsTo(User, { foreignKey: 'department_head_id', as: 'departmentHead' });

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
  SubCategory,
  Grievance,
  GrievanceAssignment,
  GrievanceStatusHistory,
  Attachment,
  Resolution,
  ResolutionVerification,
  Escalation,
  EscalationRule,
  Comment,
  Notification,
  Feedback,
  AuditLog,
  Report,
};
