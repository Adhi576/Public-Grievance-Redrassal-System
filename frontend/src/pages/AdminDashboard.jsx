import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import {
  Users,
  Building,
  UserCheck,
  Tag,
  ShieldAlert,
  FileBarChart,
  FileText,
  CheckCircle,
  Activity,
  AlertTriangle,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOfficers: 0,
    totalDepts: 0,
    totalGrievances: 0,
    inProgress: 0,
    resolved: 0,
    escalated: 0,
    avgResolutionHours: null
  });
  const [reportData, setReportData] = useState(null);
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes, grievancesRes, reportRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: { data: [] } })),
        api.get('/departments').catch(() => ({ data: { data: [] } })),
        api.get('/grievances').catch(() => ({ data: { data: [] } })),
        api.get('/reports/summary').catch(() => ({ data: { data: null } }))
      ]);

      const users = usersRes.data?.data || [];
      const depts = deptsRes.data?.data || [];
      const grievances = grievancesRes.data?.data || [];
      const report = reportRes.data?.data;

      const officers = users.filter(u => u.role === 'officer');

      let inProgressCount = 0;
      let resolvedCount = 0;
      let escalatedCount = 0;

      grievances.forEach(g => {
        if (['IN_PROGRESS', 'ASSIGNED', 'SUBMITTED', 'UNDER_REVIEW'].includes(g.current_status)) {
          inProgressCount++;
        } else if (['RESOLVED', 'CLOSED'].includes(g.current_status)) {
          resolvedCount++;
        } else if (g.current_status === 'ESCALATED') {
          escalatedCount++;
        }
      });

      setStats({
        totalUsers: users.length,
        totalOfficers: officers.length,
        totalDepts: depts.length,
        totalGrievances: grievances.length,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        escalated: escalatedCount,
        avgResolutionHours: report?.avg_resolution_hours || null
      });

      setReportData(report);
      setRecentGrievances(grievances.slice(0, 6));
    } catch (err) {
      setError('Failed to load system dashboard overview.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Administrator Command Center</h1>
          <p className="text-muted text-sm mt-1">System-wide monitoring, civic grievance metrics, and module controls.</p>
        </div>
      </div>

      <Alert type="error" message={error} />

      {/* Quick Access Control Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Link to="/admin/users" className="card p-3 text-center hover:border-primary transition flex flex-col items-center justify-center gap-1.5" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full">
            <Users size={20} />
          </div>
          <span className="text-xs font-semibold">Users</span>
          <span className="text-[11px] text-muted">{stats.totalUsers} registered</span>
        </Link>

        <Link to="/admin/departments" className="card p-3 text-center hover:border-primary transition flex flex-col items-center justify-center gap-1.5" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-full">
            <Building size={20} />
          </div>
          <span className="text-xs font-semibold">Departments</span>
          <span className="text-[11px] text-muted">{stats.totalDepts} active</span>
        </Link>

        <Link to="/admin/officers" className="card p-3 text-center hover:border-primary transition flex flex-col items-center justify-center gap-1.5" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded-full">
            <UserCheck size={20} />
          </div>
          <span className="text-xs font-semibold">Officers</span>
          <span className="text-[11px] text-muted">{stats.totalOfficers} assigned</span>
        </Link>

        <Link to="/admin/categories" className="card p-3 text-center hover:border-primary transition flex flex-col items-center justify-center gap-1.5" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
            <Tag size={20} />
          </div>
          <span className="text-xs font-semibold">Categories</span>
          <span className="text-[11px] text-muted">Manage tags</span>
        </Link>

        <Link to="/admin/escalations" className="card p-3 text-center hover:border-primary transition flex flex-col items-center justify-center gap-1.5" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="p-2.5 bg-red-50 text-red-600 rounded-full">
            <ShieldAlert size={20} />
          </div>
          <span className="text-xs font-semibold">Escalations</span>
          <span className="text-[11px] text-muted">SLA policies</span>
        </Link>

        <Link to="/admin/reports" className="card p-3 text-center hover:border-primary transition flex flex-col items-center justify-center gap-1.5" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-full">
            <FileBarChart size={20} />
          </div>
          <span className="text-xs font-semibold">Reports</span>
          <span className="text-[11px] text-muted">Analytics</span>
        </Link>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <FileText size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase">Total Complaints</p>
              <h3 className="text-2xl font-bold">{stats.totalGrievances}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-amber-100 rounded-full text-amber-600" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase">Active / In Progress</p>
              <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase">Resolved / Closed</p>
              <h3 className="text-2xl font-bold">{stats.resolved}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-muted text-xs font-semibold uppercase">Escalated (SLA)</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.escalated}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Breakdown & Recent Grievances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Grievances Table */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-base font-semibold">Recent Grievance Submissions</h2>
            <Link to="/admin/reports" className="text-xs text-primary font-medium">View Detailed Report</Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentGrievances.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-6">No grievances found.</td>
                  </tr>
                ) : (
                  recentGrievances.map((g) => (
                    <tr key={g.grievance_id}>
                      <td className="font-medium text-sm">{g.grn}</td>
                      <td>
                        <div style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.title}
                        </div>
                      </td>
                      <td>
                        <Badge
                          text={g.priority}
                          color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'blue'}
                        />
                      </td>
                      <td><Badge text={g.current_status} /></td>
                      <td className="text-sm text-muted">{new Date(g.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Distribution Summary */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold">Status Overview</h2>
            </div>
            <div className="card-body space-y-3">
              {reportData?.by_status && Object.entries(reportData.by_status).map(([st, cnt]) => {
                const pct = stats.totalGrievances > 0 ? ((cnt / stats.totalGrievances) * 100).toFixed(0) : 0;
                return (
                  <div key={st}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{st}</span>
                      <span className="text-muted">{cnt} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, backgroundColor: st === 'RESOLVED' || st === 'CLOSED' ? '#16a34a' : st === 'ESCALATED' ? '#dc2626' : '#2563eb', height: '100%' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-body flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-full">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs text-muted font-medium">Avg Resolution Turnaround</p>
                <h4 className="text-lg font-bold">
                  {stats.avgResolutionHours ? `${stats.avgResolutionHours} Hours` : 'N/A'}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
