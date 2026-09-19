'use strict';

/**
 * Phase 2 Grievance Backend Tests
 *
 * Covers:
 *  - create grievance (valid, invalid sub_category)
 *  - get grievance (own, unauthorized)
 *  - list grievances (citizen/officer/dept_head filters)
 *  - assign officer (valid, already assigned, bad officer)
 *  - reassign officer (valid, no active assignment, same officer)
 *  - active officer access check vs old officer loses access
 *  - update status (valid transitions, invalid transition)
 *  - status history verification
 *  - add comment / remark
 *  - subcategory/category retrieval
 *  - department filtering
 *  - auth still works
 */

const request = require('supertest');
const app     = require('../app');
const db      = require('../models');

// ── Test data (inserted fresh for each suite) ─────────────────────────────────
let adminToken, citizenToken, officerToken, officer2Token, deptHeadToken;
let adminUser, citizenUser, officerUser, officer2User, deptHeadUser;
let department, category, subCategory;
let grievanceId, grn;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  expect(res.statusCode).toBe(200);
  return res.body.token;
}

// ── Setup ──────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  await db.sequelize.authenticate();
  const q = db.sequelize.getQueryInterface();

  // Disable FK checks so we can delete in any order
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.ResolutionVerification.destroy({ where: {}, truncate: false });
  await db.Resolution.destroy({ where: {}, truncate: false });
  await db.Attachment.destroy({ where: {}, truncate: false });
  await db.GrievanceAssignment.destroy({ where: {}, truncate: false });
  await db.GrievanceStatusHistory.destroy({ where: {}, truncate: false });
  await db.Escalation.destroy({ where: {}, truncate: false });
  await db.EscalationRule.destroy({ where: {}, truncate: false });
  await db.Notification.destroy({ where: {}, truncate: false });
  await db.Comment.destroy({ where: {}, truncate: false });
  await db.Grievance.destroy({ where: {}, truncate: false });
  await db.SubCategory.destroy({ where: {}, truncate: false });
  await db.Category.destroy({ where: {}, truncate: false });
  await db.User.destroy({ where: { email: { [db.sequelize.Sequelize.Op.like]: '%@pgrs-test.dev' } } });
  await db.Department.destroy({ where: { name: { [db.sequelize.Sequelize.Op.like]: '%Phase2%' } } });
  await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('Test@1234', 10);

  // Department
  department = await db.Department.create({
    name: 'Test Dept Phase2',
    sla_days: 5,
    is_active: true,
  });

  // Users
  adminUser = await db.User.create({
    name: 'Admin P2', email: 'admin@pgrs-test.dev', password_hash: hash,
    role: 'administrator', is_active: true,
  });
  citizenUser = await db.User.create({
    name: 'Citizen P2', email: 'citizen@pgrs-test.dev', password_hash: hash,
    role: 'citizen', is_active: true,
  });
  officerUser = await db.User.create({
    name: 'Officer P2', email: 'officer@pgrs-test.dev', password_hash: hash,
    role: 'officer', department_id: department.department_id, is_active: true,
  });
  officer2User = await db.User.create({
    name: 'Officer2 P2', email: 'officer2@pgrs-test.dev', password_hash: hash,
    role: 'officer', department_id: department.department_id, is_active: true,
  });
  deptHeadUser = await db.User.create({
    name: 'DeptHead P2', email: 'depthead@pgrs-test.dev', password_hash: hash,
    role: 'department_head', department_id: department.department_id, is_active: true,
  });

  // Set department head
  await department.update({ head_user_id: deptHeadUser.user_id });

  // Category + SubCategory
  category = await db.Category.create({
    name: 'Roads P2',
    department_id: department.department_id,
    is_active: true,
  });
  subCategory = await db.SubCategory.create({
    name: 'Pothole P2',
    category_id: category.category_id,
    is_active: true,
  });

  // EscalationRule
  await db.EscalationRule.create({
    department_id: department.department_id,
    category_id: category.category_id,
    priority: null, // applies to all priorities
    sla_days: 1, // 1 day for testing
    is_active: true,
  });

  // Tokens
  adminToken    = await login('admin@pgrs-test.dev',    'Test@1234');
  citizenToken  = await login('citizen@pgrs-test.dev',  'Test@1234');
  officerToken  = await login('officer@pgrs-test.dev',  'Test@1234');
  officer2Token = await login('officer2@pgrs-test.dev', 'Test@1234');
  deptHeadToken = await login('depthead@pgrs-test.dev', 'Test@1234');
});

afterAll(async () => {
  await db.sequelize.close();
});

// =============================================================================
// AUTH SMOKE TEST
// =============================================================================
describe('Auth smoke test', () => {
  test('POST /api/auth/login returns token for citizen', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('POST /api/auth/login rejects bad password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@pgrs-test.dev', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});

// =============================================================================
// GRIEVANCE CREATION
// =============================================================================
describe('Create grievance', () => {
  test('Citizen can submit grievance with valid sub_category_id', async () => {
    const res = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title:           'Test pothole on Main St',
        description:     'Large pothole causing accidents',
        sub_category_id: subCategory.sub_category_id,
        location:        'Main St & 1st Ave',
        priority:        'high',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.grn).toMatch(/^PGRS-/);
    grievanceId = res.body.data.grievance_id;
    grn = res.body.data.grn;
  });

  test('Submit fails with invalid sub_category_id (not an int)', async () => {
    const res = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title:           'Bad subcat',
        description:     'desc',
        sub_category_id: 'abc',
      });
    expect(res.statusCode).toBe(400);
  });

  test('Submit fails with non-existent sub_category_id', async () => {
    const res = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title:           'Non-existent subcat',
        description:     'desc',
        sub_category_id: 999999,
      });
    expect(res.statusCode).toBe(400);
  });

  test('Officer cannot submit grievance', async () => {
    const res = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        title: 'Officer submit', description: 'desc', sub_category_id: subCategory.sub_category_id,
      });
    expect(res.statusCode).toBe(403);
  });

  test('Initial status history entry is created (SUBMITTED)', async () => {
    const history = await db.GrievanceStatusHistory.findOne({
      where: { grievance_id: grievanceId, new_status: 'SUBMITTED' },
    });
    expect(history).not.toBeNull();
    expect(history.old_status).toBeNull();
  });
});

// =============================================================================
// GET GRIEVANCE
// =============================================================================
describe('Get grievance', () => {
  test('Citizen can get their own grievance', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.grievance.grn).toBe(grn);
  });

  test('Get returns subCategory with parent category', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.statusCode).toBe(200);
    const sub = res.body.data.grievance.subCategory;
    expect(sub).toBeDefined();
    expect(sub.name).toBe('Pothole P2');
    expect(sub.category).toBeDefined();
    expect(sub.category.name).toBe('Roads P2');
  });

  test('Officer cannot access unassigned grievance', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('Dept head can access grievance in their department', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${deptHeadToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('Returns 404 for non-existent grievance', async () => {
    const res = await request(app)
      .get('/api/grievances/999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
  });
});

// =============================================================================
// LIST GRIEVANCES
// =============================================================================
describe('List grievances', () => {
  test('Citizen only sees their own grievances', async () => {
    const res = await request(app)
      .get('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`);
    expect(res.statusCode).toBe(200);
    const ids = res.body.data.map(g => g.citizen_id);
    expect(ids.every(id => id === citizenUser.user_id)).toBe(true);
  });

  test('Dept head sees grievances in their department', async () => {
    const res = await request(app)
      .get('/api/grievances')
      .set('Authorization', `Bearer ${deptHeadToken}`);
    expect(res.statusCode).toBe(200);
    const deptIds = res.body.data.map(g => g.department_id);
    expect(deptIds.every(id => id === department.department_id)).toBe(true);
  });

  test('Officer sees only assigned grievances (empty before assignment)', async () => {
    const res = await request(app)
      .get('/api/grievances')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.statusCode).toBe(200);
    // grievance is not yet assigned — officer list should be empty
    expect(res.body.data.length).toBe(0);
  });

  test('Admin sees all grievances', async () => {
    const res = await request(app)
      .get('/api/grievances')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Department filter works', async () => {
    const res = await request(app)
      .get(`/api/grievances?department_id=${department.department_id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.every(g => g.department_id === department.department_id)).toBe(true);
  });
});

// =============================================================================
// ASSIGNMENT
// =============================================================================
describe('Assign officer', () => {
  test('Invalid assignment: officer from wrong department is rejected', async () => {
    // Create a separate dept and officer
    const uniqueSuffix = Date.now();
    const otherDept = await db.Department.create({ name: `Other Dept P2 ${uniqueSuffix}`, sla_days: 7, is_active: true });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Test@1234', 10);
    const wrongOfficer = await db.User.create({
      name: 'WrongOfficer', email: `wrong${uniqueSuffix}@pgrs-test.dev`, password_hash: hash,
      role: 'officer', department_id: otherDept.department_id, is_active: true,
    });
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/assign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: wrongOfficer.user_id });
    expect(res.statusCode).toBe(400);
    // cleanup
    await wrongOfficer.destroy();
    await otherDept.destroy();
  });

  test('Dept head can assign officer to grievance', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/assign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: officerUser.user_id });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GrievanceAssignment record is created with unassigned_at = null', async () => {
    const assignment = await db.GrievanceAssignment.findOne({
      where: { grievance_id: grievanceId, officer_id: officerUser.user_id, unassigned_at: null },
    });
    expect(assignment).not.toBeNull();
    expect(assignment.assigned_by).toBe(deptHeadUser.user_id);
  });

  test('Grievance current_status is now ASSIGNED', async () => {
    const g = await db.Grievance.findByPk(grievanceId);
    expect(g.current_status).toBe('ASSIGNED');
  });

  test('Status history has ASSIGNED entry', async () => {
    const hist = await db.GrievanceStatusHistory.findOne({
      where: { grievance_id: grievanceId, new_status: 'ASSIGNED' },
    });
    expect(hist).not.toBeNull();
  });

  test('Cannot assign again when already assigned', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/assign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: officer2User.user_id });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already has an active assignment/i);
  });
});

// =============================================================================
// OFFICER ACCESS AFTER ASSIGNMENT
// =============================================================================
describe('Officer access after assignment', () => {
  test('Assigned officer can now access grievance', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('Officer appears in list after assignment', async () => {
    const res = await request(app)
      .get('/api/grievances')
      .set('Authorization', `Bearer ${officerToken}`);
    expect(res.statusCode).toBe(200);
    const ids = res.body.data.map(g => g.grievance_id);
    expect(ids).toContain(grievanceId);
  });
});

// =============================================================================
// UPDATE STATUS
// =============================================================================
describe('Update status', () => {
  test('Officer can update ASSIGNED → IN_PROGRESS', async () => {
    const res = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'IN_PROGRESS', note: 'Started working on it' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('current_status is now IN_PROGRESS', async () => {
    const g = await db.Grievance.findByPk(grievanceId);
    expect(g.current_status).toBe('IN_PROGRESS');
  });

  test('Status history entry created for IN_PROGRESS', async () => {
    const hist = await db.GrievanceStatusHistory.findOne({
      where: { grievance_id: grievanceId, new_status: 'IN_PROGRESS' },
    });
    expect(hist).not.toBeNull();
    expect(hist.old_status).toBe('ASSIGNED');
    expect(hist.note).toBe('Started working on it');
  });

  test('Invalid status transition is rejected', async () => {
    // IN_PROGRESS → SUBMITTED is not a valid transition
    const res = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'UNDER_REVIEW' });
    // UNDER_REVIEW is not in the allowed values list for the route itself
    expect([400, 422]).toContain(res.statusCode);
  });

  test('Citizen cannot update status', async () => {
    const res = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(res.statusCode).toBe(403);
  });
});

// =============================================================================
// ADD COMMENT (REMARK)
// =============================================================================
describe('Add comment (remark)', () => {
  test('Assigned officer can add a remark', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/remarks`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ note: 'Investigating root cause' });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.content).toBe('Investigating root cause');
    expect(res.body.data.is_internal).toBe(true);
  });

  test('Comment is persisted in the Comments table', async () => {
    const comment = await db.Comment.findOne({
      where: { grievance_id: grievanceId, user_id: officerUser.user_id },
    });
    expect(comment).not.toBeNull();
    expect(comment.content).toBe('Investigating root cause');
  });

  test('Empty remark is rejected', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/remarks`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ note: '' });
    expect(res.statusCode).toBe(400);
  });

  test('Citizen cannot post a remark', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/remarks`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ note: 'Citizen remark' });
    expect(res.statusCode).toBe(403);
  });
});

// =============================================================================
// REASSIGNMENT
// =============================================================================
describe('Reassign officer', () => {
  test('Reassignment requires reason', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/reassign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: officer2User.user_id }); // missing reason
    expect(res.statusCode).toBe(400);
  });

  test('Dept head can reassign to officer2', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/reassign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: officer2User.user_id, reason: 'Officer on leave' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Old assignment has unassigned_at set (history preserved)', async () => {
    const oldAssignment = await db.GrievanceAssignment.findOne({
      where: { grievance_id: grievanceId, officer_id: officerUser.user_id },
    });
    expect(oldAssignment).not.toBeNull();
    expect(oldAssignment.unassigned_at).not.toBeNull();
  });

  test('New active assignment is officer2', async () => {
    const active = await db.GrievanceAssignment.findOne({
      where: { grievance_id: grievanceId, unassigned_at: null },
    });
    expect(active).not.toBeNull();
    expect(active.officer_id).toBe(officer2User.user_id);
  });

  test('Old officer (officer1) loses access after reassignment', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${officerToken}`); // officerToken = officer1
    expect(res.statusCode).toBe(403);
  });

  test('New officer (officer2) has access after reassignment', async () => {
    const res = await request(app)
      .get(`/api/grievances/${grievanceId}`)
      .set('Authorization', `Bearer ${officer2Token}`);
    expect(res.statusCode).toBe(200);
  });

  test('Cannot reassign to same officer', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/reassign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: officer2User.user_id, reason: 'Same officer test' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/same as the current officer/i);
  });

  test('Status history note for reassignment is created', async () => {
    const hist = await db.GrievanceStatusHistory.findOne({
      where: { grievance_id: grievanceId, note: { [db.sequelize.Sequelize.Op.like]: '%Reassigned%' } },
    });
    expect(hist).not.toBeNull();
  });

  test('Reassignment with no active assignment is rejected', async () => {
    // Create a fresh grievance that was never assigned
    const res1 = await request(app)
      .post('/api/grievances')
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({
        title: 'Unassigned Grievance', description: 'Test', sub_category_id: subCategory.sub_category_id,
      });
    expect(res1.statusCode).toBe(201);
    const unassignedId = res1.body.data.grievance_id;

    const res2 = await request(app)
      .post(`/api/grievances/${unassignedId}/reassign`)
      .set('Authorization', `Bearer ${deptHeadToken}`)
      .send({ officer_id: officer2User.user_id, reason: 'No assignment exists' });
    expect(res2.statusCode).toBe(400);
    expect(res2.body.message).toMatch(/No active assignment/i);
  });
});

// =============================================================================
// RESOLUTION
// =============================================================================
describe('Resolve grievance', () => {
  test('Officer cannot resolve if status is not IN_PROGRESS', async () => {
    // Current status is ASSIGNED (or REOPENED from previous tests, wait, in previous tests it was updated to IN_PROGRESS. Let's check status)
    // Actually we updated it to IN_PROGRESS in the Update status tests. But then reassigned it.
    // Reassignment preserves the status. So it should still be IN_PROGRESS.
    // Let's set it to SUBMITTED to test rejection
    await db.Grievance.update({ current_status: 'SUBMITTED' }, { where: { grievance_id: grievanceId } });

    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officer2Token}`)
      .send({ action_taken: 'Fixed', resolution_description: 'Pothole filled' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Must be IN_PROGRESS/i);
    
    // Restore IN_PROGRESS for next tests
    await db.Grievance.update({ current_status: 'IN_PROGRESS' }, { where: { grievance_id: grievanceId } });
  });

  test('Unauthorized officer cannot resolve', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officerToken}`) // officerToken is officer1, but it's assigned to officer2
      .send({ action_taken: 'Fixed', resolution_description: 'Pothole filled' });
    expect(res.statusCode).toBe(403);
  });

  test('Missing fields rejected', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officer2Token}`)
      .send({ action_taken: 'Fixed' }); // missing resolution_description
    expect(res.statusCode).toBe(400);
  });

  test('Assigned officer can resolve grievance with proof', async () => {
    // Create a dummy file
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'dummy_proof.jpg');
    fs.writeFileSync(testFilePath, 'dummy image content');

    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officer2Token}`)
      .field('action_taken', 'Pothole fixed completely')
      .field('resolution_description', 'Filled with asphalt')
      .attach('attachments', testFilePath);

    fs.unlinkSync(testFilePath);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resolution).toBeDefined();
    expect(res.body.data.resolution.action_taken).toBe('Pothole fixed completely');
  });

  test('Resolution record is saved in DB', async () => {
    const resolution = await db.Resolution.findOne({
      where: { grievance_id: grievanceId },
      order: [['created_at', 'DESC']],
    });
    expect(resolution).not.toBeNull();
    expect(resolution.action_taken).toBe('Pothole fixed completely');
    expect(resolution.officer_id).toBe(officer2User.user_id);
  });

  test('Grievance status is updated to RESOLVED', async () => {
    const g = await db.Grievance.findByPk(grievanceId);
    expect(g.current_status).toBe('RESOLVED');
  });

  test('Status history is recorded for RESOLVED', async () => {
    const hist = await db.GrievanceStatusHistory.findOne({
      where: { grievance_id: grievanceId, new_status: 'RESOLVED' },
    });
    expect(hist).not.toBeNull();
    expect(hist.changed_by).toBe(officer2User.user_id);
  });

  test('Attachment record is created for resolution_proof', async () => {
    const attachment = await db.Attachment.findOne({
      where: { grievance_id: grievanceId, attachment_type: 'resolution_proof' },
    });
    expect(attachment).not.toBeNull();
    expect(attachment.file_name).toBe('dummy_proof.jpg');
  });

  test('Multiple resolutions are supported after reopening', async () => {
    // Simulate reopening
    await db.Grievance.update({ current_status: 'IN_PROGRESS' }, { where: { grievance_id: grievanceId } });

    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officer2Token}`)
      .send({ action_taken: 'Fixed again', resolution_description: 'Double checked' });
      
    expect(res.statusCode).toBe(200);

    const resolutions = await db.Resolution.findAll({
      where: { grievance_id: grievanceId },
    });
    expect(resolutions.length).toBe(2);
  });
});

// =============================================================================
// CITIZEN VERIFICATION
// =============================================================================
describe('Verify resolution', () => {
  let resolutionId;

  beforeAll(async () => {
    const resolution = await db.Resolution.findOne({
      where: { grievance_id: grievanceId },
      order: [['created_at', 'DESC']],
    });
    resolutionId = resolution.resolution_id;
    await db.Grievance.update({ current_status: 'RESOLVED' }, { where: { grievance_id: grievanceId } });
  });

  test('Unauthorized citizen blocked', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Test@1234', 10);
    const otherCitizen = await db.User.create({
      name: 'Other Citizen', email: `othercitizen${Date.now()}@pgrs-test.dev`, password_hash: hash,
      role: 'citizen', is_active: true,
    });
    
    const resAuth = await request(app).post('/api/auth/login').send({ email: otherCitizen.email, password: 'Test@1234' });
    const otherToken = resAuth.body.token;

    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/verify`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ resolution_id: resolutionId, decision: 'accepted' });
    
    expect(res.statusCode).toBe(403);
  });

  test('Reject resolution requires reason', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ resolution_id: resolutionId, decision: 'rejected' });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/Rejection reason is required/i);
  });

  test('Citizen rejects resolution -> status REOPENED', async () => {
    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ resolution_id: resolutionId, decision: 'rejected', rejection_reason: 'Issue persists' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const g = await db.Grievance.findByPk(grievanceId);
    expect(g.current_status).toBe('REOPENED');

    const verif = await db.ResolutionVerification.findOne({ where: { resolution_id: resolutionId } });
    expect(verif).not.toBeNull();
    expect(verif.decision).toBe('rejected');
    expect(verif.rejection_reason).toBe('Issue persists');
  });

  test('Cannot verify already verified resolution', async () => {
    // Temporarily reset status to RESOLVED to bypass the status check and hit the duplicate check
    await db.Grievance.update({ current_status: 'RESOLVED' }, { where: { grievance_id: grievanceId } });

    const res = await request(app)
      .post(`/api/grievances/${grievanceId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ resolution_id: resolutionId, decision: 'accepted' });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already been verified/i);
    
    // Restore REOPENED status
    await db.Grievance.update({ current_status: 'REOPENED' }, { where: { grievance_id: grievanceId } });
  });

  test('After reopening, allow new resolution cycle + citizen accepts', async () => {
    const resolveRes = await request(app)
      .patch(`/api/grievances/${grievanceId}/status`) // Changed to PATCH
      .set('Authorization', `Bearer ${officer2Token}`)
      .send({ status: 'IN_PROGRESS' });
    expect(resolveRes.statusCode).toBe(200);

    const newRes = await request(app)
      .post(`/api/grievances/${grievanceId}/resolve`)
      .set('Authorization', `Bearer ${officer2Token}`)
      .field('action_taken', 'Really fixed it this time')
      .field('resolution_description', 'Done done');
    expect(newRes.statusCode).toBe(200);
    
    const newResolutionId = newRes.body.data.resolution.resolution_id;

    const acceptRes = await request(app)
      .post(`/api/grievances/${grievanceId}/verify`)
      .set('Authorization', `Bearer ${citizenToken}`)
      .send({ resolution_id: newResolutionId, decision: 'accepted' });
    
    expect(acceptRes.statusCode).toBe(200);
    
    const g = await db.Grievance.findByPk(grievanceId);
    expect(g.current_status).toBe('CLOSED');
    expect(g.closed_at).not.toBeNull();
  });
});

// =============================================================================
// NOTIFICATIONS
// =============================================================================
describe('Notifications', () => {
  test('Assignment creates notification for officer', async () => {
    const notif = await db.Notification.findOne({
      where: {
        grievance_id: grievanceId,
        type: 'assignment',
      },
    });
    expect(notif).not.toBeNull();
    expect(notif.message).toMatch(/assigned/i);
  });

  test('Reassignment creates notification for new officer', async () => {
    const notifs = await db.Notification.findAll({
      where: {
        grievance_id: grievanceId,
        type: 'assignment',
      },
    });
    // Should have at least 2 assignment notifications (original + reassignment)
    expect(notifs.length).toBeGreaterThanOrEqual(2);
  });

  test('Resolution creates notification for citizen', async () => {
    const notif = await db.Notification.findOne({
      where: {
        grievance_id: grievanceId,
        user_id: citizenUser.user_id,
        type: 'status_change',
        message: { [db.sequelize.Sequelize.Op.like]: '%RESOLVED%' },
      },
    });
    expect(notif).not.toBeNull();
  });

  test('Reopening creates notification for officer', async () => {
    // When citizen rejects -> status becomes REOPENED -> officer should be notified
    const notif = await db.Notification.findOne({
      where: {
        grievance_id: grievanceId,
        type: 'status_change',
        message: { [db.sequelize.Sequelize.Op.like]: '%rejected%' },
      },
    });
    expect(notif).not.toBeNull();
  });
});

// =============================================================================
// SLA ESCALATION
// =============================================================================
describe('SLA escalation', () => {
  const { runSlaCheck } = require('../jobs/slaMonitorJob');
  let slaGrievanceId;

  beforeAll(async () => {
    // Create a fresh grievance in IN_PROGRESS with sla_due_date already in the past
    const pastDue = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const g = await db.Grievance.create({
      grn: `SLA-TEST-${Date.now()}`,
      title: 'SLA Test Grievance',
      description: 'Test SLA breach',
      sub_category_id: subCategory.sub_category_id,
      department_id: department.department_id,
      citizen_id: citizenUser.user_id,
      priority: 'medium',
      current_status: 'IN_PROGRESS',
      sla_due_date: pastDue,
    });
    slaGrievanceId = g.grievance_id;
  });

  test('SLA monitor escalates overdue grievance to ESCALATED', async () => {
    const count = await runSlaCheck();
    expect(count).toBeGreaterThanOrEqual(1);

    const g = await db.Grievance.findByPk(slaGrievanceId);
    expect(g.current_status).toBe('ESCALATED');
  });

  test('Escalation record is created', async () => {
    const esc = await db.Escalation.findOne({
      where: { grievance_id: slaGrievanceId, escalated_by_system: true },
    });
    expect(esc).not.toBeNull();
    expect(esc.department_head_id).toBe(deptHeadUser.user_id);
  });

  test('Status history is created for ESCALATED', async () => {
    const hist = await db.GrievanceStatusHistory.findOne({
      where: { grievance_id: slaGrievanceId, new_status: 'ESCALATED' },
    });
    expect(hist).not.toBeNull();
    expect(hist.changed_by).toBeNull(); // system action
  });

  test('Dept head receives escalation notification', async () => {
    const notif = await db.Notification.findOne({
      where: {
        grievance_id: slaGrievanceId,
        user_id: deptHeadUser.user_id,
        type: 'escalation',
      },
    });
    expect(notif).not.toBeNull();
    expect(notif.message).toMatch(/SLA/i);
  });

  test('Duplicate escalation is prevented', async () => {
    // Re-run the check; same grievance should NOT be escalated again
    const countBefore = await db.Escalation.count({ where: { grievance_id: slaGrievanceId } });
    await runSlaCheck();
    const countAfter = await db.Escalation.count({ where: { grievance_id: slaGrievanceId } });
    expect(countAfter).toBe(countBefore);
  });

  test('EscalationRule SLA days used for sla_due_date on assignment', async () => {
    // The EscalationRule set sla_days = 1, so sla_due_date should be ~24h from assignedAt
    // Fetch the main grievance which was assigned earlier
    const g = await db.Grievance.findByPk(grievanceId);
    expect(g.sla_due_date).not.toBeNull();

    const diff = new Date(g.sla_due_date) - new Date(g.assigned_at);
    const diffDays = diff / (1000 * 60 * 60 * 24);
    // Should be approximately 1 day (allow ±1 min tolerance)
    expect(diffDays).toBeGreaterThanOrEqual(0.99);
    expect(diffDays).toBeLessThanOrEqual(1.01);
  });
});

// =============================================================================
// UNAUTHENTICATED ACCESS
// =============================================================================
describe('Unauthorized access', () => {
  test('No token returns 401', async () => {
    const res = await request(app).get('/api/grievances');
    expect(res.statusCode).toBe(401);
  });

  test('Invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/grievances')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});
