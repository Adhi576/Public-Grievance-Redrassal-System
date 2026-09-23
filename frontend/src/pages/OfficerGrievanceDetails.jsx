import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Clock, MessageSquare, CheckCircle, FileText } from 'lucide-react';

const OfficerGrievanceDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status Update State
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Remark State
  const [remark, setRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);

  // Resolve State
  const [resolveData, setResolveData] = useState({ action_taken: '', resolution_description: '' });
  const [attachments, setAttachments] = useState(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchGrievance();
  }, [id]);

  const fetchGrievance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/grievances/${id}`);
      if (res.data.success) {
        setGrievance(res.data.data);
      }
    } catch (err) {
      setError('Failed to load grievance details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setError('');
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/grievances/${id}/status`, { status: newStatus, note: statusNote });
      if (res.data.success) {
        setStatusNote('');
        fetchGrievance();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    setError('');
    setAddingRemark(true);
    try {
      const res = await api.post(`/grievances/${id}/remarks`, { note: remark });
      if (res.data.success) {
        setRemark('');
        fetchGrievance();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add remark.');
    } finally {
      setAddingRemark(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    setError('');
    setResolving(true);
    
    try {
      const formData = new FormData();
      formData.append('action_taken', resolveData.action_taken);
      formData.append('resolution_description', resolveData.resolution_description);
      
      if (attachments) {
        for (let i = 0; i < attachments.length; i++) {
          formData.append('attachments', attachments[i]);
        }
      }

      const res = await api.post(`/grievances/${id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success) {
        setResolveData({ action_taken: '', resolution_description: '' });
        setAttachments(null);
        fetchGrievance();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resolve grievance.');
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  if (!grievance) return <div className="container py-8"><Alert type="error" message={error || 'Grievance not found'} /></div>;

  return (
    <div className="container py-8">
      <Link to="/officer/grievances" className="flex items-center gap-1 text-sm text-primary mb-6">
        <ArrowLeft size={16} />
        Back to Assigned Grievances
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{grievance.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-muted font-medium">GRN: {grievance.grn}</span>
            <Badge text={grievance.current_status} />
            <Badge 
              text={`Priority: ${grievance.priority}`} 
              color={grievance.priority === 'high' ? 'red' : grievance.priority === 'medium' ? 'yellow' : 'gray'} 
            />
            {grievance.sla_due_date && (
              <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                SLA Due: {new Date(grievance.sla_due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Grievance Details</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted">Citizen Name</p>
                  <p className="font-medium">{grievance.citizen?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Citizen Contact</p>
                  <p className="font-medium">{grievance.citizen?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Category / Sub-Category</p>
                  <p className="font-medium">{grievance.subCategory?.category?.name} &rarr; {grievance.subCategory?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Location</p>
                  <p className="font-medium">{grievance.location || 'Not provided'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted mb-1">Description</p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md whitespace-pre-wrap">
                  {grievance.description}
                </div>
              </div>
            </div>
          </div>

          {/* Resolutions Viewer */}
          {grievance.resolutions && grievance.resolutions.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Resolutions Submitted</h2>
              </div>
              <div className="card-body space-y-4">
                {grievance.resolutions.map((res, index) => (
                  <div key={res.resolution_id} className="p-4 border border-slate-200 rounded-md bg-slate-50">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-primary-dark">Resolution #{index + 1}</span>
                      <span className="text-xs text-muted">{new Date(res.resolved_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-medium">Action Taken:</p>
                    <p className="text-sm mb-2">{res.action_taken}</p>
                    <p className="text-sm font-medium">Description:</p>
                    <p className="text-sm">{res.resolution_description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          
          {/* Action: Update Status */}
          {['ASSIGNED', 'REOPENED'].includes(grievance.current_status) && (
            <div className="card border-blue-200">
              <div className="card-header bg-blue-50">
                <h2 className="text-sm font-semibold text-blue-800">Update Status</h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleUpdateStatus}>
                  <div className="form-group">
                    <label className="form-label text-xs">New Status</label>
                    <select className="form-control text-sm" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      {/* Can add others if needed, usually just IN_PROGRESS for officer */}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Note (Optional)</label>
                    <input 
                      type="text" 
                      className="form-control text-sm" 
                      value={statusNote} 
                      onChange={(e) => setStatusNote(e.target.value)} 
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block text-sm" disabled={updatingStatus}>
                    {updatingStatus ? <div className="spinner"></div> : 'Update Status'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Action: Resolve Grievance */}
          {grievance.current_status === 'IN_PROGRESS' && (
            <div className="card border-green-200">
              <div className="card-header bg-green-50">
                <h2 className="text-sm font-semibold text-green-800 flex items-center gap-1">
                  <CheckCircle size={16} /> Resolve Grievance
                </h2>
              </div>
              <div className="card-body">
                <form onSubmit={handleResolve}>
                  <div className="form-group">
                    <label className="form-label text-xs">Action Taken</label>
                    <input 
                      type="text" 
                      className="form-control text-sm" 
                      required 
                      value={resolveData.action_taken} 
                      onChange={(e) => setResolveData({...resolveData, action_taken: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Description</label>
                    <textarea 
                      className="form-control text-sm" 
                      required 
                      style={{ minHeight: '60px' }}
                      value={resolveData.resolution_description} 
                      onChange={(e) => setResolveData({...resolveData, resolution_description: e.target.value})} 
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label className="form-label text-xs">Proof Upload (Max 3 files)</label>
                    <input 
                      type="file" 
                      className="form-control text-sm" 
                      multiple 
                      onChange={(e) => setAttachments(e.target.files)} 
                    />
                  </div>
                  <button type="submit" className="btn btn-success btn-block text-sm" disabled={resolving}>
                    {resolving ? <div className="spinner"></div> : 'Submit Resolution'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Action: Add Remark */}
          <div className="card">
            <div className="card-header flex items-center gap-1">
              <MessageSquare size={16} className="text-muted" />
              <h2 className="text-sm font-semibold">Internal Remarks</h2>
            </div>
            <div className="card-body">
              <div className="max-h-48 overflow-y-auto mb-4 space-y-3">
                {grievance.comments && grievance.comments.length > 0 ? (
                  grievance.comments.map(c => (
                    <div key={c.comment_id} className="bg-slate-50 p-2 rounded border border-slate-200 text-sm">
                      <p className="font-medium text-xs text-primary-dark">{c.user?.name} <span className="text-muted font-normal float-right">{new Date(c.created_at).toLocaleDateString()}</span></p>
                      <p className="mt-1">{c.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic">No remarks yet.</p>
                )}
              </div>
              <form onSubmit={handleAddRemark}>
                <div className="form-group mb-2">
                  <textarea 
                    className="form-control text-sm" 
                    placeholder="Type a remark..." 
                    style={{ minHeight: '50px' }}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-secondary btn-block text-sm" disabled={addingRemark}>
                  {addingRemark ? <div className="spinner"></div> : 'Add Remark'}
                </button>
              </form>
            </div>
          </div>

          {/* Status History */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-sm font-semibold">Timeline</h2>
            </div>
            <div className="card-body pt-0">
              <div className="timeline">
                {grievance.statusHistory && grievance.statusHistory.map((history, idx) => (
                  <div key={history.history_id} className="timeline-item mb-4">
                    <div className={`timeline-dot ${idx === 0 ? 'active' : ''}`} style={{ width: '0.75rem', height: '0.75rem', left: '-1.875rem' }}></div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold">{history.status}</span>
                    </div>
                    <span className="text-[10px] text-muted block">{new Date(history.changed_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OfficerGrievanceDetails;
