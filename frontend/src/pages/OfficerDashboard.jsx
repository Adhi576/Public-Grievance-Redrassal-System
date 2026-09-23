import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { FileText, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0, escalated: 0 });
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all assigned grievances for the officer
      const response = await api.get('/grievances');
      if (response.data.success) {
        const grievances = response.data.data;
        
        let inProgress = 0;
        let resolved = 0;
        let escalated = 0;
        
        grievances.forEach(g => {
          if (g.current_status === 'IN_PROGRESS') {
            inProgress++;
          } else if (['RESOLVED', 'PENDING_CITIZEN_VERIFICATION', 'CLOSED'].includes(g.current_status)) {
            resolved++;
          } else if (g.current_status === 'ESCALATED') {
            escalated++;
          }
        });
        
        setStats({
          total: grievances.length,
          inProgress,
          resolved,
          escalated
        });
        
        // Get top 5 recent
        setRecentGrievances(grievances.slice(0, 5));
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
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
          <h1 className="text-2xl font-bold">Officer Dashboard</h1>
          <p className="text-muted mt-1">Welcome, Officer {user.name}. Here is your workload overview.</p>
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
              <p className="text-muted text-sm font-medium">Total Assigned</p>
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
              <p className="text-muted text-sm font-medium">In Progress</p>
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
              <p className="text-muted text-sm font-medium">Resolved</p>
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
          <h2 className="text-lg font-semibold">Recent Assignments</h2>
          <Link to="/officer/grievances" className="text-sm font-medium text-primary">View All Work</Link>
        </div>
        
        {recentGrievances.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>You have no assigned grievances currently.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentGrievances.map((g) => {
                  const assignment = g.assignments?.find(a => !a.unassigned_at);
                  const assignedDate = assignment ? new Date(assignment.assigned_at).toLocaleDateString() : 'N/A';
                  return (
                    <tr key={g.grievance_id}>
                      <td className="font-medium text-sm">{g.grn}</td>
                      <td>
                        <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.title}
                        </div>
                      </td>
                      <td>
                        <Badge 
                          text={g.priority} 
                          color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'gray'} 
                        />
                      </td>
                      <td><Badge text={g.current_status} /></td>
                      <td className="text-sm text-muted">{assignedDate}</td>
                      <td>
                        <Link to={`/officer/grievances/${g.grievance_id}`} className="text-sm font-medium">Work On</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;
