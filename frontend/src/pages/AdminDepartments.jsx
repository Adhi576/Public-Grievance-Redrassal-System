import React, { useState, useEffect } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import { Building, Edit, PlusCircle, CheckCircle, XCircle } from 'lucide-react';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [deptHeads, setDeptHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    head_user_id: '',
    sla_days: 7,
    description: '',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptRes, usersRes] = await Promise.all([
        api.get('/departments'),
        api.get('/users').catch(() => ({ data: { data: [] } }))
      ]);

      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }
      if (usersRes.data.success) {
        const heads = usersRes.data.data.filter(u => u.role === 'department_head');
        setDeptHeads(heads);
      }
    } catch (err) {
      setError('Failed to load departments.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      head_user_id: '',
      sla_days: 7,
      description: '',
      is_active: true
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (d) => {
    setEditingDept(d);
    setFormData({
      name: d.name,
      head_user_id: d.head_user_id || '',
      sla_days: d.sla_days || 7,
      description: d.description || '',
      is_active: d.is_active !== false
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleToggleStatus = async (d) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !d.is_active;
      const res = await api.put(`/departments/${d.department_id}`, {
        name: d.name,
        head_user_id: d.head_user_id,
        sla_days: d.sla_days,
        description: d.description,
        is_active: newStatus
      });
      if (res.data.success) {
        setSuccess(`Department ${d.name} is now ${newStatus ? 'Active' : 'Inactive'}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update department status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        head_user_id: formData.head_user_id ? parseInt(formData.head_user_id, 10) : null,
        sla_days: parseInt(formData.sla_days, 10) || 7,
        description: formData.description || null
      };

      if (editingDept) {
        payload.is_active = formData.is_active;
        const res = await api.put(`/departments/${editingDept.department_id}`, payload);
        if (res.data.success) {
          setSuccess('Department updated successfully.');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/departments', payload);
        if (res.data.success) {
          setSuccess('Department created successfully.');
          setShowModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Department Management</h1>
          <p className="text-muted text-sm mt-1">Configure civic departments, assigned heads, and default SLAs.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          Add Department
        </button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : departments.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>No departments configured yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Department Name</th>
                  <th>Department Head</th>
                  <th>Default SLA</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.department_id}>
                    <td className="font-medium text-sm">{d.department_id}</td>
                    <td className="font-semibold flex items-center gap-2">
                      <Building size={16} className="text-primary" />
                      {d.name}
                    </td>
                    <td className="text-sm">
                      {d.head ? (
                        <div>
                          <p className="font-medium">{d.head.name}</p>
                          <p className="text-xs text-muted">{d.head.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted italic">Unassigned</span>
                      )}
                    </td>
                    <td className="text-sm font-medium">{d.sla_days} Days</td>
                    <td className="text-sm text-muted" style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.description || '—'}
                    </td>
                    <td>
                      <span style={{ backgroundColor: d.is_active !== false ? '#dcfce7' : '#fee2e2', color: d.is_active !== false ? '#16a34a' : '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {d.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary text-xs flex items-center gap-1"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleOpenEdit(d)}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          className={`btn ${d.is_active !== false ? 'btn-danger' : 'btn-success'} text-xs flex items-center gap-1`}
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleToggleStatus(d)}
                        >
                          {d.is_active !== false ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          {d.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingDept ? 'Edit Department' : 'Add Department'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Department Name</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Department Head</label>
                  <select
                    className="form-control text-sm"
                    value={formData.head_user_id}
                    onChange={(e) => setFormData({ ...formData, head_user_id: e.target.value })}
                  >
                    <option value="">-- Select Department Head (Optional) --</option>
                    {deptHeads.map((h) => (
                      <option key={h.user_id} value={h.user_id}>{h.name} ({h.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Default SLA (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    className="form-control text-sm"
                    required
                    value={formData.sla_days}
                    onChange={(e) => setFormData({ ...formData, sla_days: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Description (Optional)</label>
                  <textarea
                    className="form-control text-sm"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  ></textarea>
                </div>

                {editingDept && (
                  <div className="form-group flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dept_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="dept_active" className="text-sm font-medium">Active Department</label>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : editingDept ? 'Update Department' : 'Create Department'}
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

export default AdminDepartments;
