'use strict';

const auditService = require('../services/auditService');

exports.getLogs = async (req, res, next) => {
  try {
    const filters = {
      user_id: req.query.user_id || null,
      action: req.query.action || null,
      from: req.query.from || null,
      to: req.query.to || null,
    };

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await auditService.getLogs(filters, page, limit);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
