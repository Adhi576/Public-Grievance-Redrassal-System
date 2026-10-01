# Appendix B: Analysis Models — Core Source Code & System User Interfaces

This document contains the core source code modules and representative user interface screenshots for the **Public Grievance Redressal System (PGRS)** software requirements specification.

---

## 7. Core Source Code

---

### 7.1 Authentication and Role-Based Access Control

**File:** `backend/src/controllers/authController.js`

**Purpose:**  
Handles citizen registration, login authentication, password hash comparison, and JWT generation with role payload.

```javascript
'use strict';

const AuthService = require('../services/authService');
const { log } = require('../services/auditService');

exports.register = async (req, res, next) => {
  try {
    const user = await AuthService.registerCitizen(req.body);
    await log(user.user_id, 'REGISTER_CITIZEN', 'user', user.user_id, null, req.ip);
    res.status(201).json({ success: true, message: 'Registration successful' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await AuthService.login(email, password);
    await log(user.user_id, 'LOGIN', 'user', user.user_id, null, req.ip);
    res.json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  const userId = req.user ? req.user.user_id : null;
  if (userId) {
    await log(userId, 'LOGOUT', 'user', userId, null, req.ip);
  }
  res.json({ success: true, message: 'Logged out successfully' });
};
```

**File:** `backend/src/middleware/auth.js`

**Purpose:**  
Verifies Bearer JWT tokens on incoming requests, checks account active status, and restricts endpoints via role guards.

```javascript
'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.user_id, {
      attributes: ['user_id', 'role', 'department_id', 'email', 'name', 'is_active'],
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Account inactive or not found' });
    }
    req.user = user.toJSON();
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
  }
  return next();
};

module.exports = { verifyToken, requireRole };
```

---

### 7.2 Grievance Submission

**File:** `backend/src/controllers/grievanceController.js`

**Purpose:**  
Receives citizen grievance payload and files, invokes service validation, and logs the submission audit record.

```javascript
exports.submit = async (req, res, next) => {
  try {
    const grievance = await GrievanceService.submitGrievance(
      req.body,
      req.user.user_id,
      req.files || [],
    );
    await log(req.user.user_id, 'SUBMIT_GRIEVANCE', 'grievance', grievance.grievance_id, null, req.ip);
    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: { grievance_id: grievance.grievance_id, grn: grievance.grn },
    });
  } catch (err) {
    next(err);
  }
};
```

**File:** `backend/src/services/grievanceService.js`

**Purpose:**  
Validates category classification, generates unique GRN, derives department ownership, persists attachments, and records initial status history.

```javascript
static async submitGrievance(data, citizenId, files) {
  const { title, description, sub_category_id, location, priority } = data;

  const subCat = await SubCategory.findByPk(sub_category_id, {
    include: [{ model: Category, as: 'category' }],
  });
  if (!subCat || !subCat.is_active || !subCat.category || !subCat.category.is_active) {
    throw Object.assign(new Error('Invalid or inactive category classification'), { status: 400 });
  }

  const department_id = subCat.category.department_id;
  const grn = generateGRN();

  const g = await Grievance.create({
    grn,
    title,
    description,
    sub_category_id,
    department_id,
    citizen_id: citizenId,
    location: location || null,
    priority: priority || 'medium',
    current_status: 'SUBMITTED',
  });

  if (files && files.length > 0) {
    await Attachment.bulkCreate(files.map(file => ({
      grievance_id:    g.grievance_id,
      file_name:       file.originalname,
      stored_name:     file.filename,
      file_path:       file.path,
      file_type:       file.mimetype,
      file_size:       file.size,
      attachment_type: 'citizen_document',
      uploaded_by:     citizenId,
    })));
  }

  await GrievanceStatusHistory.create({
    grievance_id: g.grievance_id,
    changed_by:   citizenId,
    old_status:   null,
    new_status:   'SUBMITTED',
    note:         'Grievance submitted by citizen',
  });

  return g;
}
```

---

### 7.3 Grievance Assignment

**File:** `backend/src/services/grievanceService.js`

**Purpose:**  
Assigns unassigned complaints to a department officer, queries escalation rules to compute SLA target deadlines, and updates status to `ASSIGNED`.

```javascript
static async assignOfficer(grievanceId, officerId, assignerUser) {
  const g = await this.checkAccess(grievanceId, assignerUser);

  const existing = await this._activeAssignment(grievanceId);
  if (existing) {
    throw Object.assign(new Error('Grievance already has an active assignment. Use reassign instead.'), { status: 400 });
  }

  const officer = await User.findOne({
    where: { user_id: officerId, role: 'officer', department_id: g.department_id, is_active: true },
  });
  if (!officer) {
    throw Object.assign(new Error('Officer not found, inactive, or not in this department'), { status: 400 });
  }

  const assignedAt = new Date();
  const categoryId = g.subCategory?.category?.category_id || null;

  // Resolve SLA Days via EscalationRule hierarchy
  const rule = await EscalationRule.findOne({
    where: {
      [Op.or]: [
        { department_id: g.department_id, category_id: categoryId, priority: g.priority },
        { department_id: g.department_id, category_id: categoryId, priority: null },
        { department_id: g.department_id, category_id: null, priority: g.priority },
        { department_id: g.department_id, category_id: null, priority: null },
        { department_id: null, category_id: null, priority: null }
      ],
      is_active: true
    },
    order: [['category_id', 'DESC'], ['priority', 'DESC'], ['department_id', 'DESC']]
  });

  const slaDays = rule ? rule.sla_days : 7;
  const slaDue = new Date(assignedAt.getTime() + slaDays * 24 * 60 * 60 * 1000);

  await GrievanceAssignment.create({
    grievance_id: g.grievance_id,
    officer_id:   officerId,
    assigned_by:  assignerUser.user_id,
    assigned_at:  assignedAt,
  });

  const oldStatus = g.current_status;
  await g.update({
    current_status: 'ASSIGNED',
    assigned_at:    assignedAt,
    sla_due_date:   slaDue,
  });

  await GrievanceStatusHistory.create({
    grievance_id: g.grievance_id,
    changed_by:   assignerUser.user_id,
    old_status:   oldStatus,
    new_status:   'ASSIGNED',
    note:         `Assigned to officer ID ${officerId}`,
  });

  return g;
}
```

---

### 7.4 Grievance Resolution

**File:** `backend/src/controllers/grievanceController.js`

**Purpose:**  
Receives officer resolution data and proofs, executes state change, and returns resolution summary.

```javascript
exports.resolve = async (req, res, next) => {
  try {
    const { grievance, resolution } = await GrievanceService.resolveGrievance(
      req.params.id,
      req.body,
      req.files || [],
      req.user,
    );
    await log(req.user.user_id, 'RESOLVE_GRIEVANCE', 'grievance', grievance.grievance_id,
      { resolution_id: resolution.resolution_id }, req.ip);
    res.json({ success: true, message: 'Grievance resolved successfully', data: { resolution } });
  } catch (err) {
    next(err);
  }
};
```

**File:** `backend/src/services/grievanceService.js`

**Purpose:**  
Validates officer ownership, creates resolution entry, saves resolution proof attachments, and updates status to `RESOLVED`.

```javascript
static async resolveGrievance(grievanceId, data, files, officerUser) {
  const g = await this.checkAccess(grievanceId, officerUser);

  if (g.current_status !== 'IN_PROGRESS') {
    throw Object.assign(
      new Error(`Cannot resolve: grievance is in state ${g.current_status}. Must be IN_PROGRESS.`),
      { status: 400 },
    );
  }

  const { action_taken, resolution_description } = data;
  if (!action_taken || !resolution_description) {
    throw Object.assign(new Error('action_taken and resolution_description are required'), { status: 400 });
  }

  const resolution = await Resolution.create({
    grievance_id: g.grievance_id,
    officer_id: officerUser.user_id,
    action_taken,
    resolution_description,
  });

  if (files && files.length > 0) {
    await Attachment.bulkCreate(files.map(file => ({
      grievance_id: g.grievance_id,
      file_name: file.originalname,
      stored_name: file.filename,
      file_path: file.path,
      file_type: file.mimetype,
      file_size: file.size,
      attachment_type: 'resolution_proof',
      uploaded_by: officerUser.user_id,
    })));
  }

  const oldStatus = g.current_status;
  await g.update({ current_status: 'RESOLVED' });

  await GrievanceStatusHistory.create({
    grievance_id: g.grievance_id,
    changed_by: officerUser.user_id,
    old_status: oldStatus,
    new_status: 'RESOLVED',
    note: 'Grievance resolved by officer',
  });

  return { grievance: g, resolution };
}
```

---

### 7.5 Resolution Proof Upload

**File:** `backend/src/config/multer.js`

**Purpose:**  
Configures multipart storage, creates isolated grievance subdirectories, and validates file formats and size limits.

```javascript
'use strict';

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const storageDir = process.env.UPLOAD_PATH || './uploads';

const getGrievanceDir = (req) => {
  const baseId = req.params.id || req.body.grievance_id || 'temp';
  const dest = path.join(storageDir, 'grievances', String(baseId));
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  return dest;
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    cb(null, getGrievanceDir(req));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Invalid file type'), { status: 400 }), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter
});

module.exports = upload;
```

---

### 7.6 Department Head Closure Approval / Rejection

**File:** `backend/src/services/grievanceService.js`

**Purpose:**  
Allows Department Heads to review submitted resolution proofs: approval marks the case `CLOSED`, while rejection returns the case to `IN_PROGRESS` with directives.

```javascript
static async approveClosure(grievanceId, decision, remarks, headUser) {
  const g = await this.checkAccess(grievanceId, headUser);

  if (g.current_status !== 'RESOLVED') {
    throw Object.assign(
      new Error(`Cannot review closure: grievance is in state ${g.current_status}. Must be RESOLVED.`),
      { status: 400 },
    );
  }

  if (decision === 'rejected' && (!remarks || !remarks.trim())) {
    throw Object.assign(new Error('Remarks are required when rejecting a resolution.'), { status: 400 });
  }

  const oldStatus = g.current_status;
  const newStatus = decision === 'approved' ? 'CLOSED' : 'IN_PROGRESS';
  const now = new Date();

  await g.update({
    current_status: newStatus,
    closed_at: decision === 'approved' ? now : null,
  });

  const note = decision === 'approved'
    ? (remarks || 'Resolution approved by Department Head. Grievance closed.')
    : `Resolution rejected by Department Head. Returned to officer. Remarks: ${remarks}`;

  await GrievanceStatusHistory.create({
    grievance_id: g.grievance_id,
    changed_by:   headUser.user_id,
    old_status:   oldStatus,
    new_status:   newStatus,
    note,
  });

  if (remarks) {
    await Comment.create({
      grievance_id: g.grievance_id,
      user_id:      headUser.user_id,
      content:      decision === 'approved' ? `Closure Approved: ${remarks}` : `Closure Review Rejected: ${remarks}`,
      is_internal:  true,
    });
  }

  return g;
}
```

---

### 7.7 Automated SLA Escalation

**File:** `backend/src/jobs/slaMonitorJob.js`

**Purpose:**  
Hourly cron engine detecting SLA overdue grievances, updating status to `ESCALATED`, and notifying the Department Head.

```javascript
'use strict';

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Grievance, GrievanceStatusHistory, Escalation, Notification, Department } = require('../models');

async function runSlaCheck() {
  const overdueGrievances = await Grievance.findAll({
    where: {
      current_status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] },
      sla_due_date: { [Op.lt]: new Date() },
    },
    include: [{ model: Department, as: 'department', attributes: ['head_user_id'] }],
  });

  if (overdueGrievances.length === 0) return 0;

  let escalated = 0;
  for (const g of overdueGrievances) {
    const existingEscalation = await Escalation.findOne({
      where: { grievance_id: g.grievance_id, escalated_by_system: true },
    });
    if (existingEscalation) continue;

    const oldStatus = g.current_status;
    await g.update({ current_status: 'ESCALATED' });

    await Escalation.create({
      grievance_id: g.grievance_id,
      escalated_by_system: true,
      escalated_at: new Date(),
      department_head_id: g.department?.head_user_id,
    });

    await GrievanceStatusHistory.create({
      grievance_id: g.grievance_id,
      changed_by: null,
      old_status: oldStatus,
      new_status: 'ESCALATED',
      note: `System auto-escalation: SLA due date (${g.sla_due_date}) exceeded.`,
    });

    if (g.department?.head_user_id) {
      await Notification.create({
        user_id: g.department.head_user_id,
        message: `ESCALATION: Grievance ${g.grn} has exceeded its SLA. Requires immediate attention.`,
        type: 'escalation',
        grievance_id: g.grievance_id,
      });
    }
    escalated++;
  }
  return escalated;
}

const slaMonitorJob = cron.schedule('0 * * * *', async () => {
  try {
    await runSlaCheck();
  } catch (error) {
    console.error('[SLA Monitor] Error during SLA check:', error);
  }
}, { scheduled: false });

module.exports = slaMonitorJob;
module.exports.runSlaCheck = runSlaCheck;
```

---

### 7.8 Admin & Department Report Generation

**File:** `backend/src/services/reportService.js`

**Purpose:**  
Aggregates departmental performance statistics, priority counts, SLA compliance metrics, and average turnaround hours.

```javascript
static async generateSummary(user, filters = {}) {
  const where = this._buildWhere(user, filters);

  const total = await Grievance.count({ where });

  const statusRows = await Grievance.findAll({
    where,
    attributes: ['current_status', [fn('COUNT', col('grievance_id')), 'count']],
    group: ['current_status'],
    raw: true,
  });
  const byStatus = {};
  for (const row of statusRows) {
    byStatus[row.current_status] = parseInt(row.count, 10);
  }

  const priorityRows = await Grievance.findAll({
    where,
    attributes: ['priority', [fn('COUNT', col('grievance_id')), 'count']],
    group: ['priority'],
    raw: true,
  });
  const byPriority = {};
  for (const row of priorityRows) {
    byPriority[row.priority] = parseInt(row.count, 10);
  }

  const resolved = await Grievance.count({ where: { ...where, current_status: 'RESOLVED' } });
  const closed   = await Grievance.count({ where: { ...where, current_status: 'CLOSED' } });
  const escalated = await Grievance.count({ where: { ...where, current_status: 'ESCALATED' } });

  // Compute average turnaround time in hours
  const diffExpression = 'EXTRACT(EPOCH FROM (closed_at - assigned_at)) / 3600';
  const avgResolutionResult = await Grievance.findOne({
    where: {
      ...where,
      current_status: 'CLOSED',
      assigned_at: { [Op.ne]: null },
      closed_at:   { [Op.ne]: null },
    },
    attributes: [[fn('AVG', literal(diffExpression)), 'avg_hours']],
    raw: true,
  });
  const avgResolutionHours = avgResolutionResult && avgResolutionResult.avg_hours != null
    ? parseFloat(parseFloat(avgResolutionResult.avg_hours).toFixed(2))
    : null;

  await Report.create({
    report_type: 'status',
    generated_by: user.user_id,
    parameters: { filters, generated_at: new Date().toISOString() },
  });

  return {
    total,
    by_status: byStatus,
    by_priority: byPriority,
    resolved,
    closed,
    escalated,
    avg_resolution_hours: avgResolutionHours,
    applied_filters: filters,
  };
}
```

---

### 7.9 Citizen Resolution Verification & Feedback

**File:** `backend/src/services/feedbackService.js`

**Purpose:**  
Validates feedback submissions on closed grievances and records 1-to-5 star citizen ratings.

```javascript
'use strict';

const { Grievance, Feedback } = require('../models');

class FeedbackService {
  static async submitFeedback(grievanceId, data, citizenUser) {
    const { rating, comment } = data;
    const r = parseInt(rating, 10);
    if (!r || r < 1 || r > 5) {
      throw Object.assign(new Error('Rating must be an integer between 1 and 5.'), { status: 400 });
    }

    const g = await Grievance.findByPk(grievanceId);
    if (!g || g.citizen_id !== citizenUser.user_id) {
      throw Object.assign(new Error('Forbidden: not your grievance.'), { status: 403 });
    }
    if (g.current_status !== 'CLOSED') {
      throw Object.assign(new Error('Feedback can only be submitted for CLOSED grievances.'), { status: 400 });
    }

    const existing = await Feedback.findOne({ where: { grievance_id: grievanceId } });
    if (existing) {
      throw Object.assign(new Error('Feedback has already been submitted for this grievance.'), { status: 409 });
    }

    return Feedback.create({
      grievance_id: grievanceId,
      citizen_id: citizenUser.user_id,
      rating: r,
      comment: comment || null,
    });
  }
}

module.exports = FeedbackService;
```

---

### 7.10 Frontend Role Guard & Dashboard Routing

**File:** `frontend/src/components/ProtectedRoute.jsx`

**Purpose:**  
Client-side React router guard that authenticates sessions and redirects users to their appropriate dashboard portal.

```javascript
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const getRoleHome = (role) => {
  switch (role) {
    case 'officer':
      return '/officer/dashboard';
    case 'department_head':
      return '/head/dashboard';
    case 'administrator':
      return '/admin/dashboard';
    case 'citizen':
    default:
      return '/dashboard';
  }
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## 8. User Interface Screenshots

Below are the primary user interface views for each user role in the PGRS system.

---

### 8.1 Citizen Portal (Dashboard & Grievance Submission)

![Citizen Grievance Portal UI](C:/Users/adhik/.gemini/antigravity/brain/17fac088-0b4f-436a-ae01-db0557016aac/citizen_portal_ui_1790772187198.jpg)

*Features shown:*
- My Grievances list with live status indicators (`Submitted`, `In Progress`, `Resolved`).
- New grievance submission form with title, category dropdown, priority, and file attachment dropzone.

---

### 8.2 Officer Portal (Assigned Complaint & Resolution Form)

![Officer Resolution Portal UI](C:/Users/adhik/.gemini/antigravity/brain/17fac088-0b4f-436a-ae01-db0557016aac/officer_portal_ui_1790772219216.jpg)

*Features shown:*
- Assigned complaint details, citizen description, location, and complainant attachments.
- SLA countdown timer badge.
- Resolution form with Action Taken, Detailed Resolution Notes, and Resolution Proof file upload.

---

### 8.3 Department Head Portal (Department Dashboard & Closure Review)

![Department Head Dashboard UI](C:/Users/adhik/.gemini/antigravity/brain/17fac088-0b4f-436a-ae01-db0557016aac/head_portal_ui_1790772306239.jpg)

*Features shown:*
- Department summary cards (Total Complaints, Unassigned, In Progress, Pending Closure Review, Escalated).
- Urgent Pending Closure Review banner.
- Department Complaint queue with inline actions for Officer Assignment, Reassignment, and Closure Review.

---

### 8.4 Administrator Portal (Analytics & Governance Dashboard)

![Administrator Analytics Dashboard UI](C:/Users/adhik/.gemini/antigravity/brain/17fac088-0b4f-436a-ae01-db0557016aac/admin_analytics_ui_1790772349697.jpg)

*Features shown:*
- Executive KPI cards (Total Complaints, Resolution Rate %, Avg Turnaround Hours, Escalated Breaches).
- Status distribution chart and Department performance comparison breakdown.
- Navigation links for Users, Departments, Officers, Categories, Escalations, and Reports.
