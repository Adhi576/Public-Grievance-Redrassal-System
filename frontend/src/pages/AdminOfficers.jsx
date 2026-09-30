import React, { useState, useEffect } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import { UserCheck, Edit, PlusCircle, CheckCircle, XCircle, Search } from 'lucide-react';

const AdminOfficers = () => {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: '',
    mobile: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        api.get('/users?role=officer'),
        api.get('/departments')
      ]);

      if (usersRes.data.success) {
        setOfficers(usersRes.data.data);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load officers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingOfficer(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      department_id: departments[0]?.department_id || '',
      mobile: ''
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (o) => {
    setEditingOfficer(o);
    setFormData({
      name: o.name,
      email: o.email,
      password: '',
      department_id: o.department_id || '',
      mobile: o.mobile || ''
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleToggleStatus = async (o) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !o.is_active;
      const res = await api.patch(`/users/${o.user_id}/status`, { is_active: newStatus });
      if (res.data.success) {
        setSuccess(`Officer ${o.name} is now ${newStatus ? 'Active' : 'Deactivated'}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update officer status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (editingOfficer) {
        const payload = {
          name: formData.name,
          role: 'officer',
          department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
          mobile: formData.mobile || null
        };
        const res = await api.put(`/users/${editingOfficer.user_id}`, payload);
        if (res.data.success) {
          setSuccess('Officer details updated.');
          setShowModal(false);
          fetchData();
        }
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'officer',
          department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
          mobile: formData.mobile || null
        };
        const res = await api.post('/users', payload);
        if (res.data.success) {
          setSuccess('Officer account created.');
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

  const filteredOfficers = officers.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Officer Management</h1>
          <p className="text-muted text-sm mt-1">Manage grievance redressal officers and their department assignments.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          Add Officer
        </button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card mb-6">
        <div className="card-body flex items-center gap-2">
          <Search size={18} className="text-muted" />
          <input
            type="text"
            className="form-control text-sm"
            placeholder="Search officers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : filteredOfficers.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>No officers registered.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Officer Name</th>
                  <th>Email</th>
                  <th>Assigned Department</th>
                  <th>Contact Mobile</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((o) => {
                  const dept = departments.find((d) => d.department_id === o.department_id);
                  return (
                    <tr key={o.user_id}>
                      <td className="font-medium text-sm">{o.user_id}</td>
                      <td className="font-semibold flex items-center gap-2">
                        <UserCheck size={16} className="text-yellow-600" />
                        {o.name}
                      </td>
                      <td className="text-sm text-muted">{o.email}</td>
                      <td className="text-sm font-medium">
                        {dept ? dept.name : o.department_id ? `Dept #${o.department_id}` : 'Unassigned'}
                      </td>
                      <td className="text-sm text-muted">{o.mobile || '—'}</td>
                      <td>
                        <span style={{ backgroundColor: o.is_active ? '#dcfce7' : '#fee2e2', color: o.is_active ? '#16a34a' : '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {o.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-secondary text-xs flex items-center gap-1"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleOpenEdit(o)}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className={`btn ${o.is_active ? 'btn-danger' : 'btn-success'} text-xs flex items-center gap-1`}
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleToggleStatus(o)}
                          >
                            {o.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            {o.is_active ? 'Deactivate' : 'Activate'}
                          </button>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingOfficer ? 'Edit Officer' : 'Add Officer'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Officer Name</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {!editingOfficer && (
                  <>
                    <div className="form-group">
                      <label className="form-label text-sm">Email Address</label>
                      <input
                        type="email"
                        className="form-control text-sm"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-sm">Password (Min 8 chars)</label>
                      <input
                        type="password"
                        className="form-control text-sm"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label text-sm">Assigned Department</label>
                  <select
                    className="form-control text-sm"
                    required
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Mobile Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : editingOfficer ? 'Update Officer' : 'Create Officer'}
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

export default AdminOfficers;
