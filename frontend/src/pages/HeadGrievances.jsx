import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import {
  FileText,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Eye,
  CheckSquare,
  AlertTriangle,
  Layers,
  ArrowUpDown
} from 'lucide-react';

const HeadGrievances = () => {
  const { user } = useContext(AuthContext);

  const [grievances, setGrievances] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [officerFilter, setOfficerFilter] = useState('ALL');

  // Assign / Reassign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [isReassign, setIsReassign] = useState(false);
  const [assignForm, setAssignForm] = useState({ officer_id: '', reason: '' });
  const [submittingAssign, setSubmittingAssign] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [grievanceRes, officersRes, categoriesRes] = await Promise.all([
        api.get('/grievances'),
        api.get('/users?role=officer').catch(() => ({ data: { data: [] } })),
        api.get('/categories').catch(() => ({ data: { data: [] } }))
      ]);

      if (grievanceRes.data?.success) {
        setGrievances(grievanceRes.data.data || []);
      }
      if (officersRes.data?.success) {
        setOfficers(officersRes.data.data || []);
      }
      if (categoriesRes.data?.success) {
        // filter categories for this department
        const deptCats = categoriesRes.data.data.filter(
          c => !user.department_id || c.department_id === user.department_id
        );
        setCategories(deptCats);
      }
    } catch (err) {
      setError('Failed to load department complaints.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Assign / Reassign Handlers
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
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign officer.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Filtered grievances
  const filteredGrievances = grievances.filter((g) => {
    // Status Filter
    if (statusFilter !== 'ALL' && g.current_status !== statusFilter) {
      return false;
    }
    // Priority Filter
    if (priorityFilter !== 'ALL' && g.priority !== priorityFilter) {
      return false;
    }
    // Category Filter
    if (categoryFilter !== 'ALL') {
      const catId = g.subCategory?.category_id || g.subCategory?.category?.category_id;
      if (catId !== parseInt(categoryFilter, 10)) return false;
    }
    // Officer Filter
    if (officerFilter !== 'ALL') {
      if (officerFilter === 'UNASSIGNED') {
        if (g.activeAssignment?.officer_id) return false;
      } else {
        if (g.activeAssignment?.officer_id !== parseInt(officerFilter, 10)) return false;
      }
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchGrn = g.grn?.toLowerCase().includes(q);
      const matchTitle = g.title?.toLowerCase().includes(q);
      const matchCitizen = g.citizen?.name?.toLowerCase().includes(q) || g.citizen?.email?.toLowerCase().includes(q);
      const matchLoc = g.location?.toLowerCase().includes(q);
      return matchGrn || matchTitle || matchCitizen || matchLoc;
    }
    return true;
  });

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Department Complaint Management</h1>
          <p className="text-muted text-sm mt-1">
            Review, assign, and track all complaints registered under your department.
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
      <Alert type="success" message={success} />

      {/* Filter and Search Bar */}
      <div className="card mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                className="form-control text-xs"
                placeholder="Search GRN, Title, Citizen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="form-control text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="SUBMITTED">SUBMITTED (Unassigned)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED (Pending Closure)</option>
                <option value="ESCALATED">ESCALATED (SLA Breached)</option>
                <option value="REOPENED">REOPENED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                className="form-control text-xs"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="form-control text-xs"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Officer Filter */}
            <div>
              <select
                className="form-control text-xs"
                value={officerFilter}
                onChange={(e) => setOfficerFilter(e.target.value)}
              >
                <option value="ALL">All Officers</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {officers.map((off) => (
                  <option key={off.user_id} value={off.user_id}>
                    {off.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-800">
            Showing {filteredGrievances.length} of {grievances.length} Department Cases
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><div className="spinner"></div></div>
        ) : filteredGrievances.length === 0 ? (
          <div className="card-body text-center text-muted py-12">
            <Layers size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No complaints matched your search or filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>GRN</th>
                  <th>Citizen</th>
                  <th>Title & Classification</th>
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

                      {/* Title & Classification */}
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
                                <AlertTriangle size={10} /> Overdue
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
                              title="Assign to Officer (UC-11)"
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
                              title="Reassign Officer (UC-12)"
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
                              <CheckSquare size={13} /> Closure Review
                            </Link>
                          )}

                          {/* Details */}
                          <Link
                            to={`/head/grievances/${g.grievance_id}`}
                            className="btn btn-secondary text-xs flex items-center gap-1"
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="View Full Details (UC-10/UC-13)"
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

      {/* Assign / Reassign Modal */}
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

export default HeadGrievances;
