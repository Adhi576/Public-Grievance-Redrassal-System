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

/**
 * Retrieves audit logs with filtering and pagination.
 * Strips sensitive data like passwords/tokens from details.
 */
const getLogs = async (filters, page = 1, limit = 20) => {
  const { Op } = require('sequelize');
  const { User } = require('../models');
  
  const where = {};
  
  if (filters.user_id) {
    where.user_id = parseInt(filters.user_id, 10);
  }
  
  if (filters.action) {
    where.action = filters.action;
  }
  
  if (filters.from || filters.to) {
    where.timestamp = {};
    if (filters.from) where.timestamp[Op.gte] = new Date(filters.from);
    if (filters.to)   where.timestamp[Op.lte] = new Date(filters.to);
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    order: [['timestamp', 'DESC']],
    limit,
    offset,
    include: [{ model: User, as: 'user', attributes: ['name', 'email', 'role'] }],
  });

  // Strip sensitive info from details if present (defensive)
  const safeRows = rows.map(row => {
    const plain = row.get({ plain: true });
    if (plain.details) {
      delete plain.details.password;
      delete plain.details.password_hash;
      delete plain.details.token;
    }
    return plain;
  });

  return {
    total: count,
    page,
    limit,
    total_pages: Math.ceil(count / limit),
    logs: safeRows,
  };
};

module.exports = { log, auditMiddleware, getLogs };
