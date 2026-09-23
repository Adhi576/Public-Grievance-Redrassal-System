import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { PlusCircle, FileText, Activity, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [recentGrievances, setRecentGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all grievances for the citizen to calculate basic stats
      const response = await api.get('/grievances');
      if (response.data.success) {
        const grievances = response.data.data;
        
        let resolved = 0;
        let pending = 0;
        
        grievances.forEach(g => {
          if (['RESOLVED', 'CLOSED'].includes(g.current_status)) {
            resolved++;
          } else {
            pending++;
          }
        });
        
        setStats({
          total: grievances.length,
          resolved,
          pending
        });
        
        // Get top 3 recent
        setRecentGrievances(grievances.slice(0, 3));
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
          <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
          <p className="text-muted mt-1">Here is the overview of your grievances.</p>
        </div>
        <Link to="/grievances/new" className="btn btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          Submit Grievance
        </Link>
      </div>

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600" style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%' }}>
              <FileText size={24} />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">Total Grievances</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full text-orange-600" style={{ backgroundColor: '#ffedd5', color: '#ea580c', borderRadius: '50%' }}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-muted text-sm font-medium">In Progress</p>
              <h3 className="text-2xl font-bold">{stats.pending}</h3>
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
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Grievances</h2>
          <Link to="/grievances" className="text-sm font-medium text-primary">View All</Link>
        </div>
        
        {recentGrievances.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>You have not submitted any grievances yet.</p>
            <Link to="/grievances/new" className="btn btn-primary mt-4">Submit your first grievance</Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentGrievances.map((g) => (
                  <tr key={g.grievance_id}>
                    <td className="font-medium text-sm">{g.grn}</td>
                    <td>{g.title}</td>
                    <td className="text-sm text-muted">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td><Badge text={g.current_status} /></td>
                    <td>
                      <Link to={`/grievances/${g.grievance_id}`} className="text-sm font-medium">View</Link>
                    </td>
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

export default Dashboard;
