import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';

const OfficerGrievances = () => {
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
          <h1 className="text-2xl font-bold">Assigned Grievances</h1>
          <p className="text-muted mt-1 text-sm">View and manage all grievances currently assigned to you.</p>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : grievances.length === 0 ? (
          <div className="card-body text-center text-muted py-12">
            <p>You have no assigned grievances.</p>
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
                  <th>SLA Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => {
                  const isOverdue = g.sla_due_date && new Date(g.sla_due_date) < new Date();
                  
                  return (
                    <tr key={g.grievance_id}>
                      <td className="font-medium text-sm">{g.grn}</td>
                      <td>
                        <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                      <td className="text-sm">
                        {g.sla_due_date ? (
                          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                            {new Date(g.sla_due_date).toLocaleDateString()}
                          </span>
                        ) : 'N/A'}
                      </td>
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

export default OfficerGrievances;
