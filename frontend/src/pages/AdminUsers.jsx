import React, { useState, useEffect } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { UserPlus, Edit, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen',
    department_id: '',
    mobile: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      setError('Failed to load users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'citizen',
      department_id: '',
      mobile: ''
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // Not editable here
      role: u.role,
      department_id: u.department_id || '',
      mobile: u.mobile || ''
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleToggleStatus = async (u) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !u.is_active;
      const res = await api.patch(`/users/${u.user_id}/status`, { is_active: newStatus });
      if (res.data.success) {
        setSuccess(`User ${u.name} is now ${newStatus ? 'Active' : 'Deactivated'}.`);
        fetchUsers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update user
        const payload = {
          name: formData.name,
          role: formData.role,
          department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
          mobile: formData.mobile || null
        };
        const res = await api.put(`/users/${editingUser.user_id}`, payload);
        if (res.data.success) {
          setSuccess('User updated successfully.');
          setShowModal(false);
          fetchUsers();
        }
      } else {
        // Create user
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
          mobile: formData.mobile || null
        };
        const res = await api.post('/users', payload);
        if (res.data.success) {
          setSuccess('User created successfully.');
          setShowModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted text-sm mt-1">Manage all system users, credentials, and access roles.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenAdd}>
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              className="form-control text-sm"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-muted" />
            <select
              className="form-control text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="officer">Officer</option>
              <option value="department_head">Department Head</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : filteredUsers.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>No users found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const dept = departments.find((d) => d.department_id === u.department_id);
                  return (
                    <tr key={u.user_id}>
                      <td className="font-medium text-sm">{u.user_id}</td>
                      <td className="font-semibold">{u.name}</td>
                      <td className="text-sm text-muted">{u.email}</td>
                      <td>
                        <Badge
                          text={u.role}
                          color={
                            u.role === 'administrator' ? 'red' :
                            u.role === 'department_head' ? 'purple' :
                            u.role === 'officer' ? 'yellow' : 'blue'
                          }
                        />
                      </td>
                      <td className="text-sm">{dept ? dept.name : u.department_id ? `Dept #${u.department_id}` : '—'}</td>
                      <td className="text-sm text-muted">{u.mobile || '—'}</td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#16a34a' : '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn btn-secondary text-xs flex items-center gap-1"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            className={`btn ${u.is_active ? 'btn-danger' : 'btn-success'} text-xs flex items-center gap-1`}
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleToggleStatus(u)}
                            title={u.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                            {u.is_active ? 'Deactivate' : 'Activate'}
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
              <h3 className="text-lg font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Full Name</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {!editingUser && (
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
                  <label className="form-label text-sm">Role</label>
                  <select
                    className="form-control text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="officer">Officer</option>
                    <option value="department_head">Department Head</option>
                    <option value="administrator">Administrator</option>
                  </select>
                </div>

                {['officer', 'department_head'].includes(formData.role) && (
                  <div className="form-group">
                    <label className="form-label text-sm">Assigned Department</label>
                    <select
                      className="form-control text-sm"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((d) => (
                        <option key={d.department_id} value={d.department_id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label text-sm">Mobile Number (Optional)</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    maxLength={15}
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : editingUser ? 'Update User' : 'Create User'}
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

export default AdminUsers;
