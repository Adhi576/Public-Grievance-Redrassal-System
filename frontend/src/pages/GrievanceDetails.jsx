import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';

const GrievanceDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [grievance, setGrievance] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States for verification
  const [verifyAction, setVerifyAction] = useState(null); // 'accept' or 'reject'
  const [rejectReason, setRejectReason] = useState('');
  const [verifying, setVerifying] = useState(false);

  // States for feedback
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null); // if already submitted

  // Safe date formatter — never produces "Invalid Date"
  const fmtDate = (val, opts = {}) => {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    return opts.dateOnly ? d.toLocaleDateString() : d.toLocaleString();
  };

  useEffect(() => {
    fetchGrievance();
    // Also fetch feedback if already closed
    fetchFeedback();
  }, [id]);

  const fetchGrievance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/grievances/${id}`);
      if (res.data.success) {
        // API returns { data: { grievance: {...}, activeAssignment: {...} } }
        setGrievance(res.data.data.grievance);
        setActiveAssignment(res.data.data.activeAssignment);
      }
    } catch (err) {
      setError('Failed to load grievance details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await api.get(`/feedback/${id}`);
      if (res.data.success && res.data.data) {
        setFeedback(res.data.data);
      }
    } catch (err) {
      // It's ok if no feedback exists (404/empty)
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    
    try {
      // Find the latest resolution
      const resolutions = grievance.resolutions || [];
      const latestResolution = resolutions[resolutions.length - 1];
      
      if (!latestResolution) throw new Error("No resolution found to verify.");

      const payload = {
        action: verifyAction,
        reason: verifyAction === 'reject' ? rejectReason : undefined
      };
      
      const res = await api.post(`/grievances/${id}/verify`, payload);
      if (res.data.success) {
        // Refresh data
        fetchGrievance();
        setVerifyAction(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify resolution.');
    } finally {
      setVerifying(false);
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    setError('');
    setSubmittingFeedback(true);
    
    try {
      const res = await api.post(`/feedback/${id}`, { rating, comment });
      if (res.data.success) {
        fetchFeedback();
        fetchGrievance();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><div className="spinner"></div></div>;
  if (!grievance) return <div className="container py-8"><Alert type="error" message={error || 'Grievance not found'} /></div>;

  const latestResolution = grievance.resolutions?.[grievance.resolutions.length - 1];
  
  return (
    <div className="container py-8">
      <Link to="/grievances" className="flex items-center gap-1 text-sm text-primary mb-6">
        <ArrowLeft size={16} />
        Back to My Grievances
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
                  <p className="text-sm text-muted">Department</p>
                  <p className="font-medium">{grievance.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Category</p>
                  <p className="font-medium">{grievance.subCategory?.category?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Sub-Category</p>
                  <p className="font-medium">{grievance.subCategory?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Location</p>
                  <p className="font-medium">{grievance.location || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted">Submitted On</p>
                  <p className="font-medium">{fmtDate(grievance.created_at)}</p>
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

          {/* Resolutions Section */}
          {grievance.resolutions && grievance.resolutions.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Resolutions & Actions Taken</h2>
              </div>
              <div className="card-body space-y-6">
                {grievance.resolutions.map((res, index) => (
                  <div key={res.resolution_id} className={`p-4 border rounded-md ${index === grievance.resolutions.length - 1 ? 'border-primary-light bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-primary-dark">Resolution #{index + 1}</span>
                      <span className="text-xs text-muted">{fmtDate(res.resolved_at)}</span>
                    </div>
                    <p className="text-sm font-medium mb-1 text-muted">Action Taken:</p>
                    <p className="text-sm mb-4 whitespace-pre-wrap">{res.action_taken}</p>
                    
                    {/* Verification Status */}
                    {res.verifications && res.verifications.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm font-medium mb-2">Citizen Feedback for this resolution:</p>
                        {res.verifications.map(v => (
                          <div key={v.verification_id} className="flex gap-2 items-start mb-2">
                            {v.status === 'ACCEPTED' ? (
                              <CheckCircle size={16} className="text-green-600 mt-1" />
                            ) : (
                              <XCircle size={16} className="text-red-600 mt-1" />
                            )}
                            <div>
                              <p className="text-sm"><span className="font-medium">{v.status}</span> on {fmtDate(v.created_at)}</p>
                              {v.reason && <p className="text-sm text-muted mt-1">Reason: {v.reason}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Action Box (If RESOLVED) */}
          {grievance.current_status === 'RESOLVED' && (
            <div className="card border-orange-300">
              <div className="card-header bg-orange-50 border-orange-200">
                <h2 className="text-lg font-semibold text-orange-800">Verification Required</h2>
              </div>
              <div className="card-body">
                {!verifyAction ? (
                  <div>
                    <p className="mb-4">The assigned officer has marked this grievance as resolved. Please review the action taken above and let us know if you are satisfied.</p>
                    <div className="flex gap-4">
                      <button className="btn btn-success flex-1" onClick={() => setVerifyAction('accept')}>
                        Accept Resolution (Close Grievance)
                      </button>
                      <button className="btn btn-danger flex-1" onClick={() => setVerifyAction('reject')}>
                        Reject Resolution (Reopen)
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerify}>
                    <p className="font-medium mb-2">
                      {verifyAction === 'accept' ? 'Are you sure you want to accept and close this grievance?' : 'Please provide a reason for rejecting the resolution:'}
                    </p>
                    
                    {verifyAction === 'reject' && (
                      <textarea
                        className="form-control mb-4"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        required
                        placeholder="Explain why the resolution is unsatisfactory..."
                      ></textarea>
                    )}
                    
                    <div className="flex gap-2">
                      <button type="button" className="btn btn-secondary" onClick={() => setVerifyAction(null)}>Cancel</button>
                      <button type="submit" className={`btn ${verifyAction === 'accept' ? 'btn-success' : 'btn-danger'}`} disabled={verifying}>
                        {verifying ? <div className="spinner"></div> : 'Confirm'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Feedback Form (If CLOSED) */}
          {grievance.current_status === 'CLOSED' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold">Service Feedback</h2>
              </div>
              <div className="card-body">
                {feedback ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Your Rating:</span>
                      <span className="text-xl text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < feedback.rating ? '★' : '☆'}</span>
                        ))}
                      </span>
                    </div>
                    {feedback.comment && (
                      <p className="text-muted italic">"{feedback.comment}"</p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleFeedback}>
                    <p className="mb-4">Please rate the service you received.</p>
                    <div className="form-group">
                      <label className="form-label">Rating (1-5)</label>
                      <select className="form-control" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                        <option value={5}>5 - Excellent</option>
                        <option value={4}>4 - Good</option>
                        <option value={3}>3 - Average</option>
                        <option value={2}>2 - Poor</option>
                        <option value={1}>1 - Terrible</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Comment (Optional)</label>
                      <textarea 
                        className="form-control" 
                        value={comment} 
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Any additional feedback..."
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submittingFeedback}>
                      {submittingFeedback ? <div className="spinner"></div> : 'Submit Feedback'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Current Assignment</h2>
            </div>
            <div className="card-body">
              {activeAssignment ? (
                <div>
                  <p className="text-sm font-medium">Assigned Officer</p>
                  <p className="text-muted">{activeAssignment.officer?.name || 'Officer'}</p>
                  <p className="text-xs text-muted mt-1">Assigned on: {fmtDate(activeAssignment.assigned_at, { dateOnly: true })}</p>
                </div>
              ) : (
                <p className="text-muted italic">No active assignment.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Status History</h2>
            </div>
            <div className="card-body">
              <div className="timeline">
                {grievance.statusHistory && grievance.statusHistory.map((history, idx) => (
                  <div key={history.history_id} className="timeline-item">
                    <div className={`timeline-dot ${idx === 0 ? 'active' : ''}`}></div>
                    <div className="timeline-content">
                      <div className="flex justify-between items-start mb-1">
                        <Badge text={history.status} />
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock size={12} />
                          {fmtDate(history.changed_at)}
                        </span>
                      </div>
                      {history.remarks && <p className="text-sm mt-2 italic text-muted">"{history.remarks}"</p>}
                    </div>
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

export default GrievanceDetails;
