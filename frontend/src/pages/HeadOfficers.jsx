import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import {
  UserCheck,
  FileText,
  Mail,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

const HeadOfficers = () => {
  const { user } = useContext(AuthContext);

  const [officers, setOfficers] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [offRes, gRes] = await Promise.all([
        api.get('/users?role=officer'),
        api.get('/grievances')
      ]);

      if (offRes.data?.success) {
        setOfficers(offRes.data.data || []);
      }
      if (gRes.data?.success) {
        setGrievances(gRes.data.data || []);
      }
    } catch (err) {
      setError('Failed to load department officers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute workload for each officer
  const officerWorkloads = officers.map((off) => {
    const assignedGrievances = grievances.filter(
      (g) => g.activeAssignment?.officer_id === off.user_id || g.activeAssignment?.officer?.user_id === off.user_id
    );
    const inProgress = assignedGrievances.filter((g) => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(g.current_status)).length;
    const resolved = assignedGrievances.filter((g) => ['RESOLVED', 'CLOSED'].includes(g.current_status)).length;
    const escalated = assignedGrievances.filter((g) => g.current_status === 'ESCALATED').length;

    return {
      ...off,
      activeCount: assignedGrievances.length,
      inProgressCount: inProgress,
      resolvedCount: resolved,
      escalatedCount: escalated
    };
  });

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Department Officers & Workload</h1>
          <p className="text-muted text-sm mt-1">
            Monitor active case distribution and performance across department grievance officers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/head/dashboard" className="btn btn-secondary text-sm">
            Dashboard
          </Link>
          <button onClick={fetchData} className="btn btn-secondary text-sm flex items-center gap-1">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />

      {/* Officers Cards / Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-base font-bold flex items-center gap-2">
            <UserCheck size={18} className="text-primary" />
            Officers ({officers.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="spinner"></div></div>
        ) : officerWorkloads.length === 0 ? (
          <div className="card-body text-center text-muted py-12">
            <Layers size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No officers currently assigned to this department.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Officer Name</th>
                  <th>Email & Contact</th>
                  <th>Active Cases</th>
                  <th>In Progress</th>
                  <th>Resolved</th>
                  <th>Escalated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {officerWorkloads.map((off) => (
                  <tr key={off.user_id}>
                    <td className="font-semibold text-sm flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {off.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">{off.name}</p>
                        <span className="text-[11px] text-muted">ID #{off.user_id}</span>
                      </div>
                    </td>
                    <td className="text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Mail size={12} /> {off.email}
                      </div>
                      {off.mobile && <p className="text-[11px] text-slate-500 mt-0.5">{off.mobile}</p>}
                    </td>
                    <td>
                      <span className="font-bold text-sm text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {off.activeCount}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {off.inProgressCount}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        {off.resolvedCount}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${off.escalatedCount > 0 ? 'text-red-700 bg-red-50 border border-red-200 font-bold' : 'text-slate-500'}`}>
                        {off.escalatedCount}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: off.is_active !== false ? '#dcfce7' : '#fee2e2',
                          color: off.is_active !== false ? '#16a34a' : '#dc2626',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600
                        }}
                      >
                        {off.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/head/grievances?officer=${off.user_id}`}
                        className="btn btn-secondary text-xs flex items-center gap-1"
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <FileText size={13} /> View Queue
                      </Link>
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

export default HeadOfficers;
