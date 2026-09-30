import React, { useState, useEffect } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { Download, Printer, Filter } from 'lucide-react';

const AdminReports = () => {
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    department_id: ''
  });

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
    generateReport();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load departments for report filter', err);
    }
  };

  const generateReport = async (customFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (customFilters.from) params.from = customFilters.from;
      if (customFilters.to) params.to = customFilters.to;
      if (customFilters.department_id) params.department_id = customFilters.department_id;

      const res = await api.get('/reports/summary', { params });
      if (res.data.success) {
        setReport(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    generateReport(filters);
  };

  const handleResetFilters = () => {
    const defaultFilters = { from: '', to: '', department_id: '' };
    setFilters(defaultFilters);
    generateReport(defaultFilters);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!report) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'PUBLIC GRIEVANCE REDRESSAL SYSTEM - ANALYTICS REPORT\n\n';
    csvContent += `Generated At,${new Date().toISOString()}\n`;
    csvContent += `Total Grievances,${report.total}\n`;
    csvContent += `Resolved,${report.resolved}\n`;
    csvContent += `Closed,${report.closed}\n`;
    csvContent += `Reopened,${report.reopened}\n`;
    csvContent += `Escalated,${report.escalated}\n`;
    csvContent += `Average Resolution (Hours),${report.avg_resolution_hours || 'N/A'}\n\n`;

    csvContent += 'STATUS BREAKDOWN\nStatus,Count\n';
    if (report.by_status) {
      Object.entries(report.by_status).forEach(([st, cnt]) => {
        csvContent += `${st},${cnt}\n`;
      });
    }

    csvContent += '\nPRIORITY BREAKDOWN\nPriority,Count\n';
    if (report.by_priority) {
      Object.entries(report.by_priority).forEach(([pr, cnt]) => {
        csvContent += `${pr.toUpperCase()},${cnt}\n`;
      });
    }

    if (report.by_department && report.by_department.length > 0) {
      csvContent += '\nDEPARTMENT PERFORMANCE\nDepartment,Count\n';
      report.by_department.forEach(d => {
        csvContent += `"${d.department_name || 'Unassigned'}",${d.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PGRS_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Report Generator</h1>
          <p className="text-muted text-sm mt-1">Generate comprehensive system audit summaries, SLA performance, and resolution metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-2 text-sm" onClick={handlePrint} disabled={!report}>
            <Printer size={16} />
            Print
          </button>
          <button className="btn btn-primary flex items-center gap-2 text-sm" onClick={handleExportCSV} disabled={!report}>
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />

      {/* Filter Card */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Filter size={16} />
            Report Parameters & Date Filter
          </h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="form-group mb-0">
              <label className="form-label text-xs">From Date</label>
              <input
                type="date"
                className="form-control text-sm"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-xs">To Date</label>
              <input
                type="date"
                className="form-control text-sm"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label text-xs">Department Filter</label>
              <select
                className="form-control text-sm"
                value={filters.department_id}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary flex-1 text-sm" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Generate'}
              </button>
              <button type="button" className="btn btn-secondary text-sm" onClick={handleResetFilters}>
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="spinner"></div></div>
      ) : !report ? (
        <div className="card"><div className="card-body text-center text-muted py-8">No report generated.</div></div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body">
                <p className="text-muted text-xs font-semibold uppercase">Total Complaints</p>
                <h3 className="text-2xl font-bold mt-1">{report.total}</h3>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-muted text-xs font-semibold uppercase">Resolved / Closed</p>
                <h3 className="text-2xl font-bold text-green-600 mt-1">{report.resolved + report.closed}</h3>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-muted text-xs font-semibold uppercase">Escalations</p>
                <h3 className="text-2xl font-bold text-red-600 mt-1">{report.escalated}</h3>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p className="text-muted text-xs font-semibold uppercase">Avg Turnaround</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-1">
                  {report.avg_resolution_hours ? `${report.avg_resolution_hours} hrs` : 'N/A'}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Table */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold">Status Breakdown</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_status && Object.keys(report.by_status).length > 0 ? (
                      Object.entries(report.by_status).map(([status, count]) => {
                        const pct = report.total > 0 ? ((count / report.total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={status}>
                            <td><Badge text={status} /></td>
                            <td className="font-bold text-sm">{count}</td>
                            <td className="text-sm text-muted">{pct}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="3" className="text-center text-muted py-4">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Priority Breakdown Table */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold">Priority Distribution</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Count</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_priority && Object.keys(report.by_priority).length > 0 ? (
                      Object.entries(report.by_priority).map(([priority, count]) => {
                        const pct = report.total > 0 ? ((count / report.total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={priority}>
                            <td>
                              <Badge
                                text={priority}
                                color={priority === 'high' ? 'red' : priority === 'medium' ? 'yellow' : 'blue'}
                              />
                            </td>
                            <td className="font-bold text-sm">{count}</td>
                            <td className="text-sm text-muted">{pct}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="3" className="text-center text-muted py-4">No data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          {report.by_department && report.by_department.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold">Department Performance Distribution</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Total Grievances</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.by_department.map((dept) => {
                      const pct = report.total > 0 ? ((dept.count / report.total) * 100).toFixed(1) : 0;
                      return (
                        <tr key={dept.department_id || 'unassigned'}>
                          <td className="font-medium text-sm">{dept.department_name || 'Unassigned'}</td>
                          <td className="font-bold text-sm">{dept.count}</td>
                          <td style={{ width: '40%' }}>
                            <div className="flex items-center gap-2">
                              <div style={{ flex: 1, backgroundColor: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, backgroundColor: '#2563eb', height: '100%' }}></div>
                              </div>
                              <span className="text-xs text-muted font-semibold">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
