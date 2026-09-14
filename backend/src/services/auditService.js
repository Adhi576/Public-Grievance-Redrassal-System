'use strict';

const { AuditLog } = require('../models');

/**
 * Logs an auditable action.
 * @param {number|null} userId
 * @param {string} action  - e.g. 'LOGIN', 'ASSIGN', 'STATUS_CHANGE'
 * @param {string|null} entityType - e.g. 'grievance', 'user'
 * @param {number|null} entityId
 * @param {object|null} details - extra context as JSON
 * @param {string|null} ipAddress
 */
const log = async (userId, action, entityType = null, entityId = null, details = null, ipAddress = null) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
    });
  } catch (err) {
    // Never crash the main request because audit logging failed
    console.error('[AuditService] Failed to write audit log:', err.message);
  }
};

/**
 * Express middleware that can be used to auto-log a request.
 * For fine-grained logging, call auditService.log() directly in the service layer.
 */
const auditMiddleware = (action, entityType) => async (req, _res, next) => {
  const userId = req.user ? req.user.user_id : null;
  const entityId = req.params.id ? parseInt(req.params.id, 10) : null;
  await log(userId, action, entityType, entityId, null, req.ip);
  next();
};

module.exports = { log, auditMiddleware };
