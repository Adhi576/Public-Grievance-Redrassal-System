import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import {
  FileText,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Eye,
  CheckSquare,
  FileBarChart
} from 'lucide-react';

const HeadDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [grievances, setGrievances] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active filter tab in dashboard queue
  const [activeTab, setActiveTab] = useState('ALL');

  // Assign / Reassign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [isReassign, setIsReassign] = useState(false);
  const [assignForm, setAssignForm] = useState({ officer_id: '', reason: '' });
  const [submittingAssign, setSubmittingAssign] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [grievanceRes, officersRes] = await Promise.all([
        api.get('/grievances'),
        api.get('/users?role=officer').catch(() => ({ data: { data: [] } }))
      ]);

      if (grievanceRes.data?.success) {
        setGrievances(grievanceRes.data.data || []);
      }
      if (officersRes.data?.success) {
        setOfficers(officersRes.data.data || []);
      }
    } catch (err) {
      setError('Failed to load department dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation
  const stats = {
    total: grievances.length,
    unassigned: grievances.filter(g => ['SUBMITTED', 'UNDER_REVIEW'].includes(g.current_status)).length,
    inProgress: grievances.filter(g => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(g.current_status)).length,
    pendingClosure: grievances.filter(g => g.current_status === 'RESOLVED').length,
    escalated: grievances.filter(g => g.current_status === 'ESCALATED').length,
    closed: grievances.filter(g => g.current_status === 'CLOSED').length,
  };

  // Filtered list based on active tab
  const filteredGrievances = grievances.filter((g) => {
    if (activeTab === 'UNASSIGNED') return ['SUBMITTED', 'UNDER_REVIEW'].includes(g.current_status);
    if (activeTab === 'CLOSURE_REVIEW') return g.current_status === 'RESOLVED';
    if (activeTab === 'ESCALATED') return g.current_status === 'ESCALATED';
    if (activeTab === 'IN_PROGRESS') return ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(g.current_status);
    if (activeTab === 'CLOSED') return g.current_status === 'CLOSED';
    return true;
  });

  // Assign / Reassign handlers
  const handleOpenAssign = (grievance, reassign = false) => {
    setSelectedGrievance(grievance);
    setIsReassign(reassign);
    setAssignForm({
      officer_id: officers[0]?.user_id || '',
      reason: ''
    });
    setError('');
    setSuccess('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrievance || !assignForm.officer_id) return;
    if (isReassign && !assignForm.reason.trim()) {
      setError('Reassignment reason is required.');
      return;
    }

    try {
      setSubmittingAssign(true);
      setError('');

      if (isReassign) {
        await api.post(`/grievances/${selectedGrievance.grievance_id}/reassign`, {
          officer_id: parseInt(assignForm.officer_id, 10),
          reason: assignForm.reason
        });
        setSuccess(`Grievance ${selectedGrievance.grn} successfully reassigned.`);
      } else {
        await api.post(`/grievances/${selectedGrievance.grievance_id}/assign`, {
          officer_id: parseInt(assignForm.officer_id, 10)
        });
        setSuccess(`Grievance ${selectedGrievance.grn} successfully assigned to officer.`);
      }

      setShowAssignModal(false);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign officer.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Department Head Dashboard</h1>
          <p className="text-muted text-sm mt-1">
            Department Operations & Grievance Governance • Department #{user.department_id || 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/head/grievances" className="btn btn-secondary text-sm flex items-center gap-1.5">
            <FileText size={16} /> All Complaints
          </Link>
          <Link to="/head/officers" className="btn btn-secondary text-sm flex items-center gap-1.5">
            <UserCheck size={16} /> Officers Workload
          </Link>
          <Link to="/head/reports" className="btn btn-primary text-sm flex items-center gap-1.5">
            <FileBarChart size={16} /> Department Reports
          </Link>
        </div>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* Urgent Alert Banners */}
      {stats.escalated > 0 && (
        <div
          className="card mb-6"
          style={{ backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderLeft: '5px solid #dc2626' }}
        >
          <div className="card-body p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-red-700">
                  {stats.escalated} Grievance{stats.escalated > 1 ? 's' : ''} Escalated (SLA Breached)
                </h3>
                <p className="text-xs text-red-600 mt-0.5">
                  Immediate review and intervention required by Department Head.
                </p>
              </div>
            </div>
            <button
              className="btn btn-danger text-xs flex items-center gap-1"
              style={{ padding: '0.4rem 0.8rem' }}
              onClick={() => setActiveTab('ESCALATED')}
            >
              View Escalations <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {stats.pendingClosure > 0 && (
        <div
          className="card mb-6"
          style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderLeft: '5px solid #7c3aed' }}
        >
          <div className="card-body p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-purple-900">
                  {stats.pendingClosure} Grievance{stats.pendingClosure > 1 ? 's' : ''} Awaiting Closure Approval
                </h3>
                <p className="text-xs text-purple-700 mt-0.5">
                  Officers have resolved these complaints. Review proof and approve or reject closure (UC-15).
                </p>
              </div>
            </div>
            <button
              className="btn text-xs text-white flex items-center gap-1"
              style={{ backgroundColor: '#7c3aed', padding: '0.4rem 0.8rem' }}
              onClick={() => setActiveTab('CLOSURE_REVIEW')}
            >
              Review Closures <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {/* Total */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-semibold">TOTAL</span>
              <FileText size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <span className="text-xs text-muted">All Department Cases</span>
          </div>
        </div>

        {/* Unassigned */}
        <div className="card" style={{ borderLeft: stats.unassigned > 0 ? '3px solid #f59e0b' : '' }}>
          <div className="card-body p-4">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-semibold text-yellow-700">UNASSIGNED</span>
              <Clock size={16} className="text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-700">{stats.unassigned}</p>
            <span className="text-xs text-muted">Needs Officer</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-semibold text-blue-600">IN PROGRESS</span>
              <Activity size={16} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <span className="text-xs text-muted">Active Workload</span>
          </div>
        </div>

        {/* Pending Closure */}
        <div className="card" style={{ borderLeft: stats.pendingClosure > 0 ? '3px solid #7c3aed' : '' }}>
          <div className="card-body p-4">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-semibold text-purple-700">CLOSURE REVIEW</span>
              <CheckSquare size={16} className="text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats.pendingClosure}</p>
            <span className="text-xs text-muted">Resolved by Officer</span>
          </div>
        </div>

        {/* Escalated */}
        <div className="card" style={{ borderLeft: stats.escalated > 0 ? '3px solid #dc2626' : '' }}>
          <div className="card-body p-4">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-semibold text-red-600">ESCALATED</span>
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.escalated}</p>
            <span className="text-xs text-muted">SLA Overdue</span>
          </div>
        </div>

        {/* Closed */}
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center justify-between text-muted mb-1">
              <span className="text-xs font-semibold text-green-600">CLOSED</span>
              <CheckCircle size={16} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.closed}</p>
            <span className="text-xs text-muted">Completed Cases</span>
          </div>
        </div>
      </div>

      {/* Main Grievance Queue */}
      <div className="card">
        {/* Queue Header with Tabs */}
        <div className="card-header pb-0 border-b-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold">Department Grievance Queue</h2>
              <p className="text-xs text-muted">Real-time complaint monitoring, officer assignment, and resolution review.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary text-xs flex items-center gap-1"
                style={{ padding: '0.35rem 0.65rem' }}
                onClick={fetchDashboardData}
              >
                <RefreshCw size={14} /> Refresh
              </button>
              <Link
                to="/head/grievances"
                className="btn btn-secondary text-xs flex items-center gap-1"
                style={{ padding: '0.35rem 0.65rem' }}
              >
                Advanced Search <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            {[
              { key: 'ALL', label: 'All Cases', count: stats.total },
              { key: 'UNASSIGNED', label: 'Unassigned', count: stats.unassigned, alert: stats.unassigned > 0 },
              { key: 'CLOSURE_REVIEW', label: 'Pending Closure Review', count: stats.pendingClosure, highlight: stats.pendingClosure > 0 },
              { key: 'ESCALATED', label: 'Escalated', count: stats.escalated, alert: stats.escalated > 0 },
              { key: 'IN_PROGRESS', label: 'Active In-Progress', count: stats.inProgress },
              { key: 'CLOSED', label: 'Closed', count: stats.closed },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`text-xs font-semibold px-3 py-2 rounded-t flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50 font-bold'
                    : 'text-muted hover:text-black hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: tab.alert ? '#fee2e2' : tab.highlight ? '#ede9fe' : '#e2e8f0',
                    color: tab.alert ? '#dc2626' : tab.highlight ? '#7c3aed' : '#475569',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '10px',
                    fontSize: '0.65rem'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="card-body p-0">
          {filteredGrievances.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <FileText size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No grievances found in "{activeTab}" queue.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>GRN</th>
                    <th>Citizen</th>
                    <th>Complaint Title & Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Officer</th>
                    <th>SLA Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrievances.map((g) => {
                    const isOverdue = g.sla_due_date && new Date(g.sla_due_date) < new Date() && !['RESOLVED', 'CLOSED'].includes(g.current_status);

                    return (
                      <tr key={g.grievance_id}>
                        {/* GRN */}
                        <td className="font-semibold text-xs text-primary font-mono whitespace-nowrap">
                          <Link to={`/head/grievances/${g.grievance_id}`} className="hover:underline">
                            {g.grn}
                          </Link>
                        </td>

                        {/* Citizen */}
                        <td className="text-xs">
                          <p className="font-medium text-slate-900">{g.citizen?.name || 'Citizen'}</p>
                          <p className="text-muted text-[11px]">{g.citizen?.email || '—'}</p>
                        </td>

                        {/* Title & Category */}
                        <td>
                          <p className="text-xs font-semibold text-slate-800" style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {g.title}
                          </p>
                          <span className="text-[11px] text-muted">
                            {g.subCategory?.category?.name ? `${g.subCategory.category.name} › ` : ''}
                            {g.subCategory?.name || 'General'}
                          </span>
                        </td>

                        {/* Priority */}
                        <td>
                          <Badge
                            text={g.priority}
                            color={g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'gray'}
                          />
                        </td>

                        {/* Status */}
                        <td>
                          <Badge text={g.current_status} />
                        </td>

                        {/* Assigned Officer */}
                        <td className="text-xs">
                          {g.activeAssignment?.officer ? (
                            <div>
                              <p className="font-medium text-slate-800">{g.activeAssignment.officer.name}</p>
                              <p className="text-muted text-[11px]">{g.activeAssignment.officer.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Unassigned
                            </span>
                          )}
                        </td>

                        {/* SLA Due */}
                        <td className="text-xs whitespace-nowrap">
                          {g.sla_due_date ? (
                            <div>
                              <p className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                                {new Date(g.sla_due_date).toLocaleDateString()}
                              </p>
                              {isOverdue && (
                                <span className="text-[10px] text-red-600 font-bold flex items-center gap-0.5">
                                  <AlertTriangle size={10} /> SLA Overdue
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted italic">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* If unassigned -> Assign */}
                            {['SUBMITTED', 'UNDER_REVIEW'].includes(g.current_status) && (
                              <button
                                className="btn btn-primary text-xs flex items-center gap-1"
                                style={{ padding: '0.25rem 0.5rem' }}
                                onClick={() => handleOpenAssign(g, false)}
                                title="Assign to an officer (UC-11)"
                              >
                                <UserPlus size={13} /> Assign
                              </button>
                            )}

                            {/* If assigned/in progress -> Reassign */}
                            {['ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'REOPENED'].includes(g.current_status) && (
                              <button
                                className="btn btn-secondary text-xs flex items-center gap-1"
                                style={{ padding: '0.25rem 0.5rem' }}
                                onClick={() => handleOpenAssign(g, true)}
                                title="Reassign to another officer (UC-12)"
                              >
                                <RefreshCw size={13} /> Reassign
                              </button>
                            )}

                            {/* If Resolved -> Closure Review */}
                            {g.current_status === 'RESOLVED' && (
                              <Link
                                to={`/head/grievances/${g.grievance_id}`}
                                className="btn text-xs text-white flex items-center gap-1"
                                style={{ backgroundColor: '#7c3aed', padding: '0.25rem 0.5rem' }}
                                title="Review resolution proof and approve closure (UC-15)"
                              >
                                <CheckSquare size={13} /> Review Closure
                              </Link>
                            )}

                            {/* View Details */}
                            <Link
                              to={`/head/grievances/${g.grievance_id}`}
                              className="btn btn-secondary text-xs flex items-center gap-1"
                              style={{ padding: '0.25rem 0.5rem' }}
                              title="View full complaint timeline and remarks (UC-10/UC-13)"
                            >
                              <Eye size={13} /> Details
                            </Link>
                          </div>
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

      {/* Assign / Reassign Modal (UC-11 & UC-12) */}
      {showAssignModal && selectedGrievance && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <div className="card-header flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center gap-2">
                {isReassign ? <RefreshCw size={18} className="text-primary" /> : <UserPlus size={18} className="text-primary" />}
                {isReassign ? 'Reassign Complaint' : 'Assign Complaint to Officer'}
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4 text-xs">
                <p><span className="font-semibold text-slate-700">GRN:</span> {selectedGrievance.grn}</p>
                <p className="mt-1"><span className="font-semibold text-slate-700">Title:</span> {selectedGrievance.title}</p>
                <p className="mt-1"><span className="font-semibold text-slate-700">Priority:</span> <span className="uppercase font-bold">{selectedGrievance.priority}</span></p>
              </div>

              <form onSubmit={handleAssignSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Select Department Officer</label>
                  {officers.length === 0 ? (
                    <p className="text-xs text-red-600 italic">No active officers found in your department.</p>
                  ) : (
                    <select
                      className="form-control text-sm"
                      required
                      value={assignForm.officer_id}
                      onChange={(e) => setAssignForm({ ...assignForm, officer_id: e.target.value })}
                    >
                      <option value="">-- Select Officer --</option>
                      {officers.map((off) => (
                        <option key={off.user_id} value={off.user_id}>
                          {off.name} ({off.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {isReassign && (
                  <div className="form-group">
                    <label className="form-label text-sm">Reason for Reassignment (Mandatory)</label>
                    <textarea
                      className="form-control text-sm"
                      rows={3}
                      required
                      placeholder="e.g. Officer on leave / Workload rebalancing / High priority case..."
                      value={assignForm.reason}
                      onChange={(e) => setAssignForm({ ...assignForm, reason: e.target.value })}
                    ></textarea>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-sm"
                    disabled={submittingAssign || officers.length === 0}
                  >
                    {submittingAssign ? <div className="spinner"></div> : isReassign ? 'Reassign Officer' : 'Assign Officer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadDashboard;
