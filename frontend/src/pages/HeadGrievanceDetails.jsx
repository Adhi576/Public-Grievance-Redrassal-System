import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import {
  FileText,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  History,
  Paperclip,
  ArrowLeft,
  UserPlus,
  RefreshCw,
  CheckSquare,
  ShieldAlert,
  Send,
  Calendar,
  MapPin,
  Tag
} from 'lucide-react';

const HeadGrievanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [grievance, setGrievance] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Assign / Reassign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [isReassign, setIsReassign] = useState(false);
  const [assignForm, setAssignForm] = useState({ officer_id: '', reason: '' });
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Closure Review State (UC-15)
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureDecision, setClosureDecision] = useState('approved'); // 'approved' | 'rejected'
  const [closureRemarks, setClosureRemarks] = useState('');
  const [submittingClosure, setSubmittingClosure] = useState(false);

  // Internal Remark State (UC-13)
  const [newRemark, setNewRemark] = useState('');
  const [submittingRemark, setSubmittingRemark] = useState(false);

  useEffect(() => {
    fetchGrievanceDetail();
  }, [id]);

  const fetchGrievanceDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const [gRes, offRes] = await Promise.all([
        api.get(`/grievances/${id}`),
        api.get('/users?role=officer').catch(() => ({ data: { data: [] } }))
      ]);

      if (gRes.data?.success) {
        setGrievance(gRes.data.data.grievance);
        setActiveAssignment(gRes.data.data.activeAssignment);
      }
      if (offRes.data?.success) {
        setOfficers(offRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load grievance details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Status transition to UNDER_REVIEW
  const handleMarkUnderReview = async () => {
    try {
      setError('');
      setSuccess('');
      const res = await api.patch(`/grievances/${id}/status`, {
        status: 'UNDER_REVIEW',
        note: 'Marked Under Review by Department Head'
      });
      if (res.data.success) {
        setSuccess('Grievance status updated to UNDER_REVIEW.');
        fetchGrievanceDetail();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Assign / Reassign submit
  const handleOpenAssignModal = (reassign = false) => {
    setIsReassign(reassign);
    setAssignForm({
      officer_id: activeAssignment?.officer_id || officers[0]?.user_id || '',
      reason: ''
    });
    setError('');
    setSuccess('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.officer_id) return;
    if (isReassign && !assignForm.reason.trim()) {
      setError('Reassignment reason is required.');
      return;
    }

    try {
      setSubmittingAssign(true);
      setError('');

      if (isReassign) {
        await api.post(`/grievances/${id}/reassign`, {
          officer_id: parseInt(assignForm.officer_id, 10),
          reason: assignForm.reason
        });
        setSuccess('Officer reassigned successfully.');
      } else {
        await api.post(`/grievances/${id}/assign`, {
          officer_id: parseInt(assignForm.officer_id, 10)
        });
        setSuccess('Officer assigned successfully.');
      }

      setShowAssignModal(false);
      fetchGrievanceDetail();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign officer.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  // UC-15: Closure Approval / Rejection
  const handleOpenClosureModal = (decision) => {
    setClosureDecision(decision);
    setClosureRemarks(decision === 'approved' ? 'Resolution reviewed and approved.' : '');
    setError('');
    setSuccess('');
    setShowClosureModal(true);
  };

  const handleClosureSubmit = async (e) => {
    e.preventDefault();
    if (closureDecision === 'rejected' && !closureRemarks.trim()) {
      setError('Remarks are mandatory when rejecting a resolution.');
      return;
    }

    try {
      setSubmittingClosure(true);
      setError('');

      const res = await api.post(`/grievances/${id}/approve-closure`, {
        decision: closureDecision,
        remarks: closureRemarks
      });

      if (res.data.success) {
        setSuccess(
          closureDecision === 'approved'
            ? 'Resolution approved! Grievance is now CLOSED.'
            : 'Resolution rejected and returned to officer with remarks.'
        );
        setShowClosureModal(false);
        fetchGrievanceDetail();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit closure review.');
    } finally {
      setSubmittingClosure(false);
    }
  };

  // Add Remark (UC-13)
  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    try {
      setSubmittingRemark(true);
      setError('');
      const res = await api.post(`/grievances/${id}/remarks`, {
        note: newRemark
      });

      if (res.data.success) {
        setSuccess('Internal remark added.');
        setNewRemark('');
        fetchGrievanceDetail();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add remark.');
    } finally {
      setSubmittingRemark(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="container py-8">
        <Alert type="error" message={error || 'Grievance not found.'} />
        <Link to="/head/grievances" className="btn btn-secondary text-sm inline-flex items-center gap-1">
          <ArrowLeft size={16} /> Back to Complaints
        </Link>
      </div>
    );
  }

  // SLA Calculation
  const isOverdue = grievance.sla_due_date && new Date(grievance.sla_due_date) < new Date() && !['RESOLVED', 'CLOSED'].includes(grievance.current_status);
  const latestResolution = grievance.resolutions && grievance.resolutions.length > 0
    ? grievance.resolutions[grievance.resolutions.length - 1]
    : null;

  return (
    <div className="container py-8">
      {/* Top Nav */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/head/grievances" className="btn btn-secondary text-xs flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Grievances
        </Link>
        <span className="text-xs text-muted font-mono font-bold">GRN: {grievance.grn}</span>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* SLA Alert Banner */}
      {isOverdue && (
        <div
          className="card mb-6"
          style={{ backgroundColor: '#fff5f5', border: '1px solid #fca5a5', borderLeft: '5px solid #dc2626' }}
        >
          <div className="card-body p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-red-600" />
              <div>
                <h4 className="text-sm font-bold text-red-800">SLA Due Date Exceeded!</h4>
                <p className="text-xs text-red-600">
                  Target resolution date was {new Date(grievance.sla_due_date).toLocaleString()}.
                </p>
              </div>
            </div>
            {activeAssignment && (
              <button
                className="btn btn-danger text-xs flex items-center gap-1"
                onClick={() => handleOpenAssignModal(true)}
              >
                <RefreshCw size={13} /> Reassign Officer
              </button>
            )}
          </div>
        </div>
      )}

      {/* UC-15 Resolution Closure Review Banner (When status is RESOLVED) */}
      {grievance.current_status === 'RESOLVED' && latestResolution && (
        <div
          className="card mb-6"
          style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderLeft: '5px solid #7c3aed' }}
        >
          <div className="card-body p-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={22} className="text-purple-700" />
                <h3 className="font-bold text-base text-purple-950">
                  Resolution Submitted — Awaiting Department Head Closure Approval (UC-15)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-success text-xs flex items-center gap-1 font-bold"
                  style={{ padding: '0.4rem 0.8rem' }}
                  onClick={() => handleOpenClosureModal('approved')}
                >
                  <CheckCircle size={15} /> Approve & Close Grievance
                </button>
                <button
                  className="btn btn-danger text-xs flex items-center gap-1 font-bold"
                  style={{ padding: '0.4rem 0.8rem' }}
                  onClick={() => handleOpenClosureModal('rejected')}
                >
                  <XCircle size={15} /> Reject Resolution
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded border border-purple-200 text-xs space-y-2 text-slate-800">
              <div>
                <span className="font-bold text-slate-900">Action Taken:</span>
                <p className="mt-0.5 text-slate-700">{latestResolution.action_taken}</p>
              </div>
              <div>
                <span className="font-bold text-slate-900">Resolution Details:</span>
                <p className="mt-0.5 text-slate-700">{latestResolution.resolution_description}</p>
              </div>
              <div className="text-[11px] text-muted pt-1">
                Resolved by Officer on {new Date(latestResolution.resolved_at || latestResolution.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grievance Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{grievance.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Calendar size={13} /> {new Date(grievance.created_at).toLocaleString()}
                  </span>
                  {grievance.location && (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <MapPin size={13} /> {grievance.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  text={grievance.priority}
                  color={grievance.priority === 'high' ? 'red' : grievance.priority === 'medium' ? 'yellow' : 'gray'}
                />
                <Badge text={grievance.current_status} />
              </div>
            </div>

            <div className="card-body">
              <h4 className="text-xs font-semibold text-muted uppercase mb-2">Complaint Description</h4>
              <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {grievance.description}
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-muted font-medium">Complainant:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{grievance.citizen?.name || 'Citizen'}</p>
                  <p className="text-muted">{grievance.citizen?.email || '—'}</p>
                </div>
                <div>
                  <span className="text-muted font-medium">Classification:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {grievance.subCategory?.category?.name || 'Category'} › {grievance.subCategory?.name || 'Subcategory'}
                  </p>
                  <p className="text-muted">Department: {grievance.department?.name || 'Current Dept'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Citizen & Officer Attachments */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Paperclip size={16} className="text-primary" />
                Attachments & Proofs
              </h3>
            </div>
            <div className="card-body">
              {(!grievance.attachments || grievance.attachments.length === 0) ? (
                <p className="text-xs text-muted italic">No file attachments uploaded for this complaint.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {grievance.attachments.map((att) => (
                    <div
                      key={att.attachment_id}
                      className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{att.file_name}</p>
                        <span className="text-[10px] text-muted">
                          Type: {att.attachment_type} • {(att.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <a
                        href={`/uploads/${att.stored_name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary text-xs"
                        style={{ padding: '0.2rem 0.5rem' }}
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Internal Remarks & Comments Thread (UC-13) */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <MessageSquare size={16} className="text-primary" />
                Internal Processing Notes & Remarks (UC-13)
              </h3>
            </div>
            <div className="card-body">
              {/* Add Remark Form */}
              {grievance.current_status !== 'CLOSED' && (
                <form onSubmit={handleAddRemark} className="mb-6">
                  <div className="form-group mb-2">
                    <label className="form-label text-xs">Add Department Head Remark / Directive</label>
                    <textarea
                      className="form-control text-xs"
                      rows={2}
                      placeholder="Add an internal processing note or instructions for the assigned officer..."
                      value={newRemark}
                      onChange={(e) => setNewRemark(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="btn btn-primary text-xs flex items-center gap-1"
                      disabled={submittingRemark || !newRemark.trim()}
                    >
                      <Send size={13} />
                      {submittingRemark ? 'Adding...' : 'Post Remark'}
                    </button>
                  </div>
                </form>
              )}

              {/* Remarks List */}
              {(!grievance.comments || grievance.comments.length === 0) ? (
                <p className="text-xs text-muted italic">No internal remarks posted yet.</p>
              ) : (
                <div className="space-y-3">
                  {grievance.comments.map((c) => (
                    <div
                      key={c.comment_id}
                      className="p-3 rounded border text-xs"
                      style={{
                        backgroundColor: c.is_internal ? '#f8fafc' : '#ffffff',
                        borderColor: '#e2e8f0'
                      }}
                    >
                      <div className="flex justify-between items-center text-muted mb-1 text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {c.user?.name || 'Department Staff'} ({c.user?.role || 'staff'})
                        </span>
                        <span>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-800 whitespace-pre-wrap">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Governance Controls & Timeline (1 col) */}
        <div className="space-y-6">
          {/* Officer Assignment & Governance Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <UserCheck size={16} className="text-primary" />
                Officer Assignment
              </h3>
            </div>
            <div className="card-body text-xs space-y-4">
              {activeAssignment?.officer ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-muted text-[11px] uppercase font-semibold">Currently Assigned Officer</span>
                  <p className="font-bold text-sm text-blue-900 mt-1">{activeAssignment.officer.name}</p>
                  <p className="text-muted">{activeAssignment.officer.email}</p>
                  <p className="text-[11px] text-muted mt-2">
                    Assigned: {new Date(activeAssignment.assigned_at).toLocaleString()}
                  </p>
                  {activeAssignment.reason && (
                    <p className="text-[11px] text-slate-600 mt-1 italic">
                      Reason: {activeAssignment.reason}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
                  <p className="font-bold">No Officer Assigned</p>
                  <p className="text-[11px] mt-0.5">This complaint requires an officer assignment to proceed.</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* Mark as Under Review */}
                {grievance.current_status === 'SUBMITTED' && (
                  <button
                    className="btn btn-secondary text-xs w-full flex items-center justify-center gap-1"
                    onClick={handleMarkUnderReview}
                  >
                    Mark as Under Review
                  </button>
                )}

                {/* Assign / Reassign Button */}
                {['SUBMITTED', 'UNDER_REVIEW'].includes(grievance.current_status) ? (
                  <button
                    className="btn btn-primary text-xs w-full flex items-center justify-center gap-1 font-bold"
                    onClick={() => handleOpenAssignModal(false)}
                  >
                    <UserPlus size={14} /> Assign Officer (UC-11)
                  </button>
                ) : ['ASSIGNED', 'IN_PROGRESS', 'ESCALATED', 'REOPENED'].includes(grievance.current_status) ? (
                  <button
                    className="btn btn-secondary text-xs w-full flex items-center justify-center gap-1 font-bold"
                    onClick={() => handleOpenAssignModal(true)}
                  >
                    <RefreshCw size={14} /> Reassign Officer (UC-12)
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* SLA Tracking Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Clock size={16} className="text-primary" />
                SLA Compliance Tracking
              </h3>
            </div>
            <div className="card-body text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-muted">Target SLA Due:</span>
                <span className={`font-semibold ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                  {grievance.sla_due_date ? new Date(grievance.sla_due_date).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-muted">Current Status:</span>
                <Badge text={grievance.current_status} />
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-muted">Assigned At:</span>
                <span className="text-slate-700">
                  {grievance.assigned_at ? new Date(grievance.assigned_at).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted">Closed At:</span>
                <span className="text-slate-700">
                  {grievance.closed_at ? new Date(grievance.closed_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Status History & Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <History size={16} className="text-primary" />
                Audit Trail & History
              </h3>
            </div>
            <div className="card-body p-3">
              {(!grievance.statusHistory || grievance.statusHistory.length === 0) ? (
                <p className="text-xs text-muted italic">No status history recorded.</p>
              ) : (
                <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 text-xs">
                  {grievance.statusHistory.map((sh) => (
                    <div key={sh.history_id} className="relative">
                      <div
                        className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white"
                      ></div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800">{sh.new_status}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(sh.changed_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{sh.note}</p>
                        {sh.changedBy && (
                          <span className="text-[10px] text-muted">By: {sh.changedBy.name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign / Reassign Modal */}
      {showAssignModal && (
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
                      placeholder="e.g. Officer unavailable / Rebalancing workload / Escalation handling..."
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

      {/* Closure Review Modal (UC-15) */}
      {showClosureModal && (
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
                {closureDecision === 'approved' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
                {closureDecision === 'approved' ? 'Approve Complaint Closure' : 'Reject Resolution & Return to Officer'}
              </h3>
              <button onClick={() => setShowClosureModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleClosureSubmit}>
                <p className="text-xs text-slate-700 mb-4">
                  {closureDecision === 'approved'
                    ? 'Confirming closure will mark this grievance as CLOSED and notify the citizen and officer.'
                    : 'Rejecting this resolution will return the grievance back to IN_PROGRESS status for the assigned officer with your remarks.'}
                </p>

                <div className="form-group">
                  <label className="form-label text-sm">
                    {closureDecision === 'approved' ? 'Approval Remarks (Optional)' : 'Rejection Reason & Directives (Mandatory)'}
                  </label>
                  <textarea
                    className="form-control text-sm"
                    rows={3}
                    required={closureDecision === 'rejected'}
                    placeholder={closureDecision === 'approved' ? 'Resolution verified and found satisfactory.' : 'State why the resolution was rejected and what additional action is required...'}
                    value={closureRemarks}
                    onChange={(e) => setClosureRemarks(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowClosureModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${closureDecision === 'approved' ? 'btn-success' : 'btn-danger'} text-sm font-bold`}
                    disabled={submittingClosure}
                  >
                    {submittingClosure ? <div className="spinner"></div> : closureDecision === 'approved' ? 'Confirm & Close' : 'Reject Resolution'}
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

export default HeadGrievanceDetails;
