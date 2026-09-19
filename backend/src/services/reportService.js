'use strict';

const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const {
  Grievance,
  Department,
  Report,
} = require('../models');

class ReportService {
  /**
   * Build the WHERE clause shared by all report queries.
   * dept_head access is scoped to their department_id automatically.
   */
  static _buildWhere(user, filters = {}) {
    const where = {};

    // Department scope
    if (user.role === 'department_head') {
      where.department_id = user.department_id;
    } else if (filters.department_id) {
      where.department_id = parseInt(filters.department_id, 10);
    }

    // Date range on created_at (submitted_at)
    if (filters.from || filters.to) {
      where.created_at = {};
      if (filters.from) where.created_at[Op.gte] = new Date(filters.from);
      if (filters.to)   where.created_at[Op.lte] = new Date(filters.to);
    }

    return where;
  }

  /**
   * Generates the analytics report for admin/dept_head.
   * Returns aggregated stats; also persists a Report record for audit trail.
   */
  static async generateSummary(user, filters = {}) {
    const where = this._buildWhere(user, filters);

    // 1. Total grievances
    const total = await Grievance.count({ where });

    // 2. Status-wise counts
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

    // 3. Department-wise counts (admin only; dept head only sees their own)
    let byDepartment = null;
    if (user.role === 'administrator') {
      const deptRows = await Grievance.findAll({
        where,
        attributes: [
          'department_id',
          [fn('COUNT', col('Grievance.grievance_id')), 'count'],
        ],
        include: [{ model: Department, as: 'department', attributes: ['name'] }],
        group: ['department_id', 'department.department_id'],
        raw: true,
        nest: true,
      });
      byDepartment = deptRows.map(r => ({
        department_id: r.department_id,
        department_name: r.department ? r.department.name : null,
        count: parseInt(r.count, 10),
      }));
    }

    // 4. Priority-wise counts
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

    // 5. Resolution / closure counts
    const resolved = await Grievance.count({ where: { ...where, current_status: 'RESOLVED' } });
    const closed   = await Grievance.count({ where: { ...where, current_status: 'CLOSED' } });
    const reopened = await Grievance.count({ where: { ...where, current_status: 'REOPENED' } });
    const escalated = await Grievance.count({ where: { ...where, current_status: 'ESCALATED' } });

    // 6. Average resolution time (from assigned_at to closed_at, only CLOSED)
    const avgResolutionResult = await Grievance.findOne({
      where: {
        ...where,
        current_status: 'CLOSED',
        assigned_at: { [Op.ne]: null },
        closed_at:   { [Op.ne]: null },
      },
      attributes: [
        [
          fn('AVG', literal('TIMESTAMPDIFF(HOUR, assigned_at, closed_at)')),
          'avg_hours',
        ],
      ],
      raw: true,
    });
    const avgResolutionHours = avgResolutionResult && avgResolutionResult.avg_hours != null
      ? parseFloat(parseFloat(avgResolutionResult.avg_hours).toFixed(2))
      : null;

    // Persist report log
    const reportParams = { filters, generated_at: new Date().toISOString() };
    await Report.create({
      report_type: 'status',
      generated_by: user.user_id,
      parameters: reportParams,
    });

    return {
      total,
      by_status: byStatus,
      by_department: byDepartment,
      by_priority: byPriority,
      resolved,
      closed,
      reopened,
      escalated,
      avg_resolution_hours: avgResolutionHours,
      applied_filters: filters,
    };
  }
}

module.exports = ReportService;
