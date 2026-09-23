import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { PlusCircle } from 'lucide-react';

const MyGrievances = () => {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const response = await api.get('/grievances');
      if (response.data.success) {
        setGrievances(response.data.data);
      }
    } catch (err) {
      setError('Failed to load grievances.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Grievances</h1>
          <p className="text-muted mt-1 text-sm">View and track the status of all your submitted grievances.</p>
        </div>
        <Link to="/grievances/new" className="btn btn-primary flex items-center gap-2">
          <PlusCircle size={18} />
          New Grievance
        </Link>
      </div>

      <Alert type="error" message={error} />

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : grievances.length === 0 ? (
          <div className="card-body text-center text-muted py-12">
            <p>You have no grievances on record.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g.grievance_id}>
                    <td className="font-medium text-sm">{g.grn}</td>
                    <td>
                      <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.title}
                      </div>
                    </td>
                    <td className="text-sm">{g.subCategory?.name || 'N/A'}</td>
                    <td className="text-sm">{g.department?.name || 'N/A'}</td>
                    <td>
                      <Badge 
                        text={g.priority} 
                        color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'gray'} 
                      />
                    </td>
                    <td><Badge text={g.current_status} /></td>
                    <td className="text-sm text-muted">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/grievances/${g.grievance_id}`} className="text-sm font-medium">View Details</Link>
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

export default MyGrievances;
