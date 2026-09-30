import React, { useState, useEffect } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const AdminEscalations = () => {
  const [rules, setRules] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    department_id: '',
    category_id: '',
    priority: '',
    sla_days: 7,
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesRes, deptsRes, catsRes] = await Promise.all([
        api.get('/escalation-rules'),
        api.get('/departments'),
        api.get('/categories')
      ]);

      if (rulesRes.data.success) {
        setRules(rulesRes.data.data);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.data);
      }
      if (catsRes.data.success) {
        setCategories(catsRes.data.data);
      }
    } catch (err) {
      setError('Failed to load escalation rules.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingRule(null);
    setFormData({
      department_id: '',
      category_id: '',
      priority: '',
      sla_days: 3,
      is_active: true
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleOpenEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      department_id: rule.department_id || '',
      category_id: rule.category_id || '',
      priority: rule.priority || '',
      sla_days: rule.sla_days || 7,
      is_active: rule.is_active !== false
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this escalation rule?')) return;
    try {
      setError('');
      setSuccess('');
      const res = await api.delete(`/escalation-rules/${ruleId}`);
      if (res.data.success) {
        setSuccess('Escalation rule deleted successfully.');
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete escalation rule.');
    }
  };

  const handleToggleStatus = async (rule) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !rule.is_active;
      const res = await api.put(`/escalation-rules/${rule.rule_id}`, { is_active: newStatus });
      if (res.data.success) {
        setSuccess(`Rule is now ${newStatus ? 'Active' : 'Inactive'}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update rule status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        department_id: formData.department_id ? parseInt(formData.department_id, 10) : null,
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        priority: formData.priority || null,
        sla_days: parseInt(formData.sla_days, 10) || 7
      };

      if (editingRule) {
        payload.is_active = formData.is_active;
        const res = await api.put(`/escalation-rules/${editingRule.rule_id}`, payload);
        if (res.data.success) {
          setSuccess('Escalation rule updated.');
          setShowModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/escalation-rules', payload);
        if (res.data.success) {
          setSuccess('Escalation rule created.');
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

  // Filter categories by selected department in modal
  const filteredModalCategories = formData.department_id
    ? categories.filter(c => c.department_id === parseInt(formData.department_id, 10))
    : categories;

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Escalation Rules Configuration</h1>
          <p className="text-muted text-sm mt-1">Configure automated SLA timelines, priority overrides, and escalation triggers.</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenAdd}>
          <PlusCircle size={18} />
          Add Escalation Rule
        </button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : rules.length === 0 ? (
          <div className="card-body text-center text-muted py-8">
            <p>No escalation rules configured yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Target Department</th>
                  <th>Target Category</th>
                  <th>Priority Condition</th>
                  <th>SLA Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.rule_id}>
                    <td className="font-medium text-sm">#{r.rule_id}</td>
                    <td className="font-semibold text-sm">
                      {r.department ? r.department.name : <span className="text-muted italic">All Departments</span>}
                    </td>
                    <td className="text-sm">
                      {r.category ? r.category.name : <span className="text-muted italic">All Categories</span>}
                    </td>
                    <td>
                      {r.priority ? (
                        <Badge
                          text={r.priority}
                          color={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'yellow' : 'blue'}
                        />
                      ) : (
                        <span className="text-muted italic text-sm">Any Priority</span>
                      )}
                    </td>
                    <td className="text-sm font-bold text-primary-dark">{r.sla_days} Days</td>
                    <td>
                      <span style={{ backgroundColor: r.is_active ? '#dcfce7' : '#fee2e2', color: r.is_active ? '#16a34a' : '#dc2626', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-secondary text-xs flex items-center gap-1"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleOpenEdit(r)}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          className={`btn ${r.is_active ? 'btn-danger' : 'btn-success'} text-xs flex items-center gap-1`}
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleToggleStatus(r)}
                        >
                          {r.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          {r.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn btn-secondary text-xs flex items-center gap-1 text-red-600 hover:bg-red-50"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleDelete(r.rule_id)}
                        >
                          <Trash2 size={14} />
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
              <h3 className="text-lg font-bold">{editingRule ? 'Edit Escalation Rule' : 'Add Escalation Rule'}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Department (Optional)</label>
                  <select
                    className="form-control text-sm"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value, category_id: '' })}
                  >
                    <option value="">-- All Departments (Global Rule) --</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Category (Optional)</label>
                  <select
                    className="form-control text-sm"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">-- All Categories --</option>
                    {filteredModalCategories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Priority Match (Optional)</label>
                  <select
                    className="form-control text-sm"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="">-- Any Priority --</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">SLA Resolution Target (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="form-control text-sm"
                    required
                    value={formData.sla_days}
                    onChange={(e) => setFormData({ ...formData, sla_days: e.target.value })}
                  />
                  <p className="text-xs text-muted mt-1">If an assigned grievance exceeds this threshold, it is automatically escalated.</p>
                </div>

                {editingRule && (
                  <div className="form-group flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rule_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="rule_active" className="text-sm font-medium">Active Rule</label>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : editingRule ? 'Update Rule' : 'Save Rule'}
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

export default AdminEscalations;
