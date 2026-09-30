import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import {
  FileBarChart,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';

const HeadReports = () => {
  const { user } = useContext(AuthContext);

  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (filters = dateRange) => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (filters.from) params.from = new Date(filters.from).toISOString();
      if (filters.to) params.to = new Date(filters.to).toISOString();

      const res = await api.get('/reports/summary', { params });
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      setError('Failed to generate department report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReport(dateRange);
  };

  const handleResetFilter = () => {
    const empty = { from: '', to: '' };
    setDateRange(empty);
    fetchReport(empty);
  };

  // CSV Export (UC-16)
  const handleExportCSV = () => {
    if (!reportData) return;

    const rows = [
      ['Metric', 'Value'],
      ['Department ID', user.department_id || 'Current'],
      ['Total Complaints', reportData.total || 0],
      ['Resolved Complaints', reportData.resolved || 0],
      ['Closed Complaints', reportData.closed || 0],
      ['Escalated Complaints', reportData.escalated || 0],
      ['Reopened Complaints', reportData.reopened || 0],
      ['Avg Resolution Turnaround (Hours)', reportData.avg_resolution_hours || 'N/A'],
      [],
      ['Status Breakdown'],
      ...Object.entries(reportData.by_status || {}).map(([s, c]) => [s, c]),
      [],
      ['Priority Breakdown'],
      ...Object.entries(reportData.by_priority || {}).map(([p, c]) => [p, c]),
      [],
      ['Officer Performance Breakdown'],
      ['Officer Name', 'Email', 'Active Workload', 'Total Assigned'],
      ...(reportData.officer_stats || []).map(o => [o.name, o.email, o.active_workload, o.total_assigned])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `department_${user.department_id || 'head'}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Department Performance & SLA Reports</h1>
          <p className="text-muted text-sm mt-1">
            Analyze complaint resolution timelines, officer workloads, and departmental SLA compliance (UC-16).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!reportData}
            className="btn btn-secondary text-sm flex items-center gap-1.5"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            disabled={!reportData}
            className="btn btn-secondary text-sm flex items-center gap-1.5"
          >
            <Printer size={15} /> Print / PDF
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />

      {/* Date Filter Card */}
      <div className="card mb-6">
        <div className="card-body p-4">
          <form onSubmit={handleApplyFilter} className="flex flex-col sm:flex-row items-end gap-3">
            <div>
              <label className="form-label text-xs font-semibold">From Date</label>
              <input
                type="date"
                className="form-control text-xs"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label text-xs font-semibold">To Date</label>
              <input
                type="date"
                className="form-control text-xs"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <button type="submit" className="btn btn-primary text-xs flex items-center gap-1" style={{ padding: '0.45rem 0.8rem' }}>
                <Calendar size={14} /> Apply Filter
              </button>
              {(dateRange.from || dateRange.to) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '0.45rem 0.8rem' }}
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="spinner"></div></div>
      ) : !reportData ? (
        <div className="card">
          <div className="card-body text-center text-muted py-12">
            <p>No report data available.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body p-4">
                <span className="text-xs font-semibold text-muted">TOTAL COMPLAINTS</span>
                <p className="text-2xl font-bold mt-1">{reportData.total}</p>
                <span className="text-[11px] text-muted">In selected period</span>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-4">
                <span className="text-xs font-semibold text-green-600">RESOLUTION RATE</span>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {reportData.total > 0
                    ? `${Math.round(((reportData.closed + reportData.resolved) / reportData.total) * 100)}%`
                    : '0%'}
                </p>
                <span className="text-[11px] text-muted">{reportData.closed + reportData.resolved} resolved / closed</span>
              </div>
            </div>

            <div className="card">
              <div className="card-body p-4">
                <span className="text-xs font-semibold text-blue-600">AVG RESOLUTION TIME</span>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {reportData.avg_resolution_hours != null ? `${reportData.avg_resolution_hours} hrs` : 'N/A'}
                </p>
                <span className="text-[11px] text-muted">From assignment to closure</span>
              </div>
            </div>

            <div className="card" style={{ borderLeft: reportData.escalated > 0 ? '3px solid #dc2626' : '' }}>
              <div className="card-body p-4">
                <span className="text-xs font-semibold text-red-600">ESCALATED CASES</span>
                <p className="text-2xl font-bold text-red-700 mt-1">{reportData.escalated}</p>
                <span className="text-[11px] text-muted">SLA breaches</span>
              </div>
            </div>
          </div>

          {/* Breakdown Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-primary" />
                  Status Distribution
                </h3>
              </div>
              <div className="card-body p-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Complaints</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.by_status || {}).map(([st, count]) => {
                      const pct = reportData.total > 0 ? Math.round((count / reportData.total) * 100) : 0;
                      return (
                        <tr key={st}>
                          <td className="font-semibold text-xs">{st}</td>
                          <td className="font-bold text-xs">{count}</td>
                          <td className="text-xs text-muted w-1/3">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-[11px] font-mono">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-primary" />
                  Priority Distribution
                </h3>
              </div>
              <div className="card-body p-0">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Complaints</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['high', 'medium', 'low'].map((p) => {
                      const count = reportData.by_priority?.[p] || 0;
                      const pct = reportData.total > 0 ? Math.round((count / reportData.total) * 100) : 0;
                      return (
                        <tr key={p}>
                          <td className="font-bold text-xs uppercase">{p}</td>
                          <td className="font-bold text-xs">{count}</td>
                          <td className="text-xs text-muted w-1/3">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: p === 'high' ? '#dc2626' : p === 'medium' ? '#ca8a04' : '#64748b'
                                  }}
                                ></div>
                              </div>
                              <span className="text-[11px] font-mono">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Department Officers Performance Table */}
          {reportData.officer_stats && reportData.officer_stats.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <Users size={16} className="text-primary" />
                  Officer Workload & Resolution Metrics
                </h3>
              </div>
              <div className="card-body p-0">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Officer</th>
                        <th>Email</th>
                        <th>Active Workload</th>
                        <th>Total Assigned</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.officer_stats.map((off) => (
                        <tr key={off.user_id}>
                          <td className="font-semibold text-xs">{off.name}</td>
                          <td className="text-xs text-muted">{off.email}</td>
                          <td>
                            <span className="font-bold text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                              {off.active_workload} active
                            </span>
                          </td>
                          <td className="font-bold text-xs">{off.total_assigned}</td>
                          <td>
                            <span
                              style={{
                                backgroundColor: off.is_active !== false ? '#dcfce7' : '#fee2e2',
                                color: off.is_active !== false ? '#16a34a' : '#dc2626',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}
                            >
                              {off.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeadReports;
