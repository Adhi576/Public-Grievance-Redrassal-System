'use strict';

const ReportService = require('../services/reportService');
const { log } = require('../services/auditService');

// ── Generate Summary Report ───────────────────────────────────────────────────
exports.summary = async (req, res, next) => {
  try {
    const filters = {
      from:          req.query.from          || null,
      to:            req.query.to            || null,
      department_id: req.query.department_id || null,
    };
    const report = await ReportService.generateSummary(req.user, filters);
    await log(req.user.user_id, 'GENERATE_REPORT', 'report', null, filters, req.ip);
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};
