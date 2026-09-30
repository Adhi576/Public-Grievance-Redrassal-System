import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { FileText, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const HeadDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0, escalated: 0 });
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHeadData();
  }, []);

  const fetchHeadData = async () => {
    try {
      setLoading(true);
      const grievanceRes = await api.get('/grievances');

      if (grievanceRes.data?.success) {
        const list = grievanceRes.data.data || [];
        setGrievances(list);

        let inProgress = 0;
        let resolved = 0;
        let escalated = 0;

        list.forEach((g) => {
          if (['IN_PROGRESS', 'ASSIGNED', 'SUBMITTED', 'UNDER_REVIEW'].includes(g.current_status)) {
            inProgress++;
          } else if (['RESOLVED', 'CLOSED'].includes(g.current_status)) {
            resolved++;
          } else if (g.current_status === 'ESCALATED') {
            escalated++;
          }
        });

        setStats({
          total: list.length,
          inProgress,
          resolved,
          escalated,
        });
      }
    } catch (err) {
      setError('Failed to load department dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Department Head Dashboard</h1>
          <p className="text-muted mt-1">Welcome, {user.name}. Department overview and grievance queue.</p>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600" style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%' }}>
              <FileText size={24} />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Department Grievances</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full text-yellow-600" style={{ backgroundColor: '#fef9c3', color: '#ca8a04', borderRadius: '50%' }}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Active / Pending</p>
              <h3 className="text-2xl font-bold">{stats.inProgress}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600" style={{ backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '50%' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Resolved / Closed</p>
              <h3 className="text-2xl font-bold">{stats.resolved}</h3>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body flex items-center gap-4 border border-red-200" style={{ borderColor: stats.escalated > 0 ? '#fca5a5' : 'transparent' }}>
            <div className="p-3 bg-red-100 rounded-full text-red-600" style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '50%' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Escalated</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.escalated}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold">Department Grievance Queue</h2>
          <span className="text-sm text-muted">{grievances.length} Total</span>
        </div>

        {grievances.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>No grievances recorded in your department.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g.grievance_id}>
                    <td className="font-medium text-sm">{g.grn}</td>
                    <td>
                      <div style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.title}
                      </div>
                    </td>
                    <td className="text-sm">{g.subCategory?.name || 'N/A'}</td>
                    <td>
                      <Badge
                        text={g.priority}
                        color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'gray'}
                      />
                    </td>
                    <td><Badge text={g.current_status} /></td>
                    <td className="text-sm text-muted">{new Date(g.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadDashboard;
