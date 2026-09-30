import React, { useState, useEffect } from 'react';
import api from '../api';
import Alert from '../components/Alert';
import {
  Tag,
  PlusCircle,
  Edit,
  CheckCircle,
  XCircle,
  Plus,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Layers
} from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedCats, setExpandedCats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catFormData, setCatFormData] = useState({
    name: '',
    department_id: '',
    description: '',
    is_active: true
  });

  // Subcategory Modal
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [parentCatId, setParentCatId] = useState(null);
  const [subFormData, setSubFormData] = useState({
    name: '',
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
      const [catRes, deptRes] = await Promise.all([
        api.get('/categories'),
        api.get('/departments')
      ]);

      if (catRes.data.success) {
        setCategories(catRes.data.data);
        // Expand all by default if not already set
        const initExpanded = {};
        catRes.data.data.forEach(c => { initExpanded[c.category_id] = true; });
        setExpandedCats(prev => Object.keys(prev).length ? prev : initExpanded);
      }
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
      }
    } catch (err) {
      setError('Failed to load categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAll = () => {
    const all = {};
    categories.forEach(c => { all[c.category_id] = true; });
    setExpandedCats(all);
  };

  const collapseAll = () => {
    const none = {};
    categories.forEach(c => { none[c.category_id] = false; });
    setExpandedCats(none);
  };

  // Category Modal Handlers
  const handleOpenAddCat = () => {
    setEditingCat(null);
    setCatFormData({
      name: '',
      department_id: departments[0]?.department_id || '',
      description: '',
      is_active: true
    });
    setError('');
    setSuccess('');
    setShowCatModal(true);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCat(cat);
    setCatFormData({
      name: cat.name,
      department_id: cat.department_id || '',
      description: cat.description || '',
      is_active: cat.is_active !== false
    });
    setError('');
    setSuccess('');
    setShowCatModal(true);
  };

  const handleToggleCatStatus = async (cat) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !(cat.is_active !== false);
      const res = await api.patch(`/categories/${cat.category_id}/status`, {
        is_active: newStatus
      });
      if (res.data.success) {
        setSuccess(`Category "${cat.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category status.');
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        name: catFormData.name,
        department_id: parseInt(catFormData.department_id, 10),
        description: catFormData.description || null
      };

      if (editingCat) {
        payload.is_active = catFormData.is_active;
        const res = await api.put(`/categories/${editingCat.category_id}`, payload);
        if (res.data.success) {
          setSuccess('Category updated successfully.');
          setShowCatModal(false);
          fetchData();
        }
      } else {
        const res = await api.post('/categories', payload);
        if (res.data.success) {
          setSuccess('Category created successfully.');
          setShowCatModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Subcategory Modal Handlers
  const handleOpenAddSub = (catId) => {
    setParentCatId(catId);
    setEditingSub(null);
    setSubFormData({
      name: '',
      description: '',
      is_active: true
    });
    setError('');
    setSuccess('');
    setShowSubModal(true);
  };

  const handleOpenEditSub = (sub) => {
    setParentCatId(sub.category_id);
    setEditingSub(sub);
    setSubFormData({
      name: sub.name,
      description: sub.description || '',
      is_active: sub.is_active !== false
    });
    setError('');
    setSuccess('');
    setShowSubModal(true);
  };

  const handleToggleSubStatus = async (sub) => {
    try {
      setError('');
      setSuccess('');
      const newStatus = !(sub.is_active !== false);
      const res = await api.patch(`/categories/subcategories/${sub.sub_category_id}/status`, {
        is_active: newStatus
      });
      if (res.data.success) {
        setSuccess(`Subcategory "${sub.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subcategory status.');
    }
  };

  const handleSubSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (editingSub) {
        const res = await api.put(`/categories/subcategories/${editingSub.sub_category_id}`, {
          name: subFormData.name,
          description: subFormData.description || null,
          is_active: subFormData.is_active
        });
        if (res.data.success) {
          setSuccess('Subcategory updated successfully.');
          setShowSubModal(false);
          fetchData();
        }
      } else {
        const res = await api.post(`/categories/${parentCatId}/subcategories`, {
          name: subFormData.name,
          description: subFormData.description || null
        });
        if (res.data.success) {
          setSuccess('Subcategory created successfully.');
          setShowSubModal(false);
          fetchData();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    // Dept filter
    if (selectedDept !== 'ALL' && cat.department_id !== parseInt(selectedDept, 10)) {
      return false;
    }
    // Status filter
    if (statusFilter === 'active' && cat.is_active === false) return false;
    if (statusFilter === 'inactive' && cat.is_active !== false) return false;

    // Search query matches category or any subcategory
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = cat.name.toLowerCase().includes(q) || (cat.description && cat.description.toLowerCase().includes(q));
      const matchSub = cat.subCategories?.some(s => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q)));
      return matchCat || matchSub;
    }
    return true;
  });

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Complaint Categories & Subcategories</h1>
          <p className="text-muted text-sm mt-1">
            Configure hierarchical complaint classifications, parent departments, and activation status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary flex items-center gap-2" onClick={handleOpenAddCat}>
            <PlusCircle size={18} />
            Add Category
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {/* Filter and Control Bar */}
      <div className="card mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                className="form-control text-sm pl-8"
                placeholder="Search categories & subcategories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted" />
              <select
                className="form-control text-sm"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="form-control text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Category Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Expand/Collapse All */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                style={{ padding: '0.35rem 0.65rem' }}
                onClick={expandAll}
              >
                Expand All
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                style={{ padding: '0.35rem 0.65rem' }}
                onClick={collapseAll}
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8"><div className="spinner"></div></div>
        ) : filteredCategories.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-muted py-8">
              <Layers size={32} className="mx-auto mb-2 opacity-50" />
              <p>No complaint categories match the current filter criteria.</p>
            </div>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isCatActive = cat.is_active !== false;

            return (
              <div
                key={cat.category_id}
                className="card"
                style={{
                  borderLeft: isCatActive ? '4px solid var(--primary-color)' : '4px solid #cbd5e1',
                  opacity: isCatActive ? 1 : 0.88
                }}
              >
                {/* Category Header */}
                <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleExpand(cat.category_id)}
                      className="p-1 hover:bg-slate-100 rounded text-muted"
                      title={expandedCats[cat.category_id] ? 'Collapse' : 'Expand'}
                    >
                      {expandedCats[cat.category_id] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <Tag size={18} className={isCatActive ? 'text-primary' : 'text-muted'} />
                    <div>
                      <span className={`font-bold text-base ${!isCatActive ? 'text-muted' : ''}`}>{cat.name}</span>
                      <span className="text-xs text-muted ml-2">({cat.department?.name || 'No Dept'})</span>
                    </div>
                    {/* Status Badge */}
                    <span
                      style={{
                        backgroundColor: isCatActive ? '#dcfce7' : '#fee2e2',
                        color: isCatActive ? '#16a34a' : '#dc2626',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        marginLeft: '0.25rem'
                      }}
                    >
                      {isCatActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="btn btn-secondary text-xs flex items-center gap-1"
                      style={{ padding: '0.3rem 0.6rem' }}
                      onClick={() => handleOpenAddSub(cat.category_id)}
                      title="Add a new subcategory under this category"
                    >
                      <Plus size={14} /> Add Subcategory
                    </button>
                    <button
                      className="btn btn-secondary text-xs flex items-center gap-1"
                      style={{ padding: '0.3rem 0.6rem' }}
                      onClick={() => handleOpenEditCat(cat)}
                      title="Edit Category Details"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      className={`btn ${isCatActive ? 'btn-danger' : 'btn-success'} text-xs flex items-center gap-1`}
                      style={{ padding: '0.3rem 0.6rem' }}
                      onClick={() => handleToggleCatStatus(cat)}
                      title={isCatActive ? 'Deactivate this category' : 'Activate this category'}
                    >
                      {isCatActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      {isCatActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                {/* Subcategories Expansion */}
                {expandedCats[cat.category_id] && (
                  <div className="card-body pt-0">
                    {cat.description && (
                      <p className="text-xs text-muted mb-3 italic">{cat.description}</p>
                    )}

                    <div className="border border-slate-100 rounded bg-slate-50 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-semibold text-muted uppercase">
                          Subcategories ({cat.subCategories?.length || 0})
                        </p>
                      </div>

                      {(!cat.subCategories || cat.subCategories.length === 0) ? (
                        <p className="text-xs text-muted italic">No subcategories defined for this category.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {cat.subCategories.map((sub) => {
                            const isSubActive = sub.is_active !== false;

                            return (
                              <div
                                key={sub.sub_category_id}
                                className="bg-white p-2.5 rounded border flex justify-between items-center"
                                style={{
                                  borderColor: isSubActive ? '#e2e8f0' : '#fca5a5',
                                  backgroundColor: isSubActive ? '#ffffff' : '#fff5f5'
                                }}
                              >
                                <div className="pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className={`text-sm font-medium ${!isSubActive ? 'text-muted line-through' : ''}`}>
                                      {sub.name}
                                    </p>
                                    <span
                                      style={{
                                        backgroundColor: isSubActive ? '#dcfce7' : '#fee2e2',
                                        color: isSubActive ? '#16a34a' : '#dc2626',
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '3px',
                                        fontSize: '0.65rem',
                                        fontWeight: 600
                                      }}
                                    >
                                      {isSubActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                  </div>
                                  {sub.description && (
                                    <p className="text-xs text-muted mt-0.5">{sub.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    className="text-muted hover:text-primary p-1 rounded"
                                    onClick={() => handleOpenEditSub(sub)}
                                    title="Edit Subcategory"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    className={`p-1 rounded ${isSubActive ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
                                    onClick={() => handleToggleSubStatus(sub)}
                                    title={isSubActive ? 'Deactivate Subcategory' : 'Activate Subcategory'}
                                  >
                                    {isSubActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal */}
      {showCatModal && (
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
              <h3 className="text-lg font-bold">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowCatModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCatSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Category Name</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    required
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Parent Department</label>
                  <select
                    className="form-control text-sm"
                    required
                    value={catFormData.department_id}
                    onChange={(e) => setCatFormData({ ...catFormData, department_id: e.target.value })}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Description (Optional)</label>
                  <textarea
                    className="form-control text-sm"
                    rows={3}
                    value={catFormData.description}
                    onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  ></textarea>
                </div>

                {editingCat && (
                  <div className="form-group flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cat_active"
                      checked={catFormData.is_active}
                      onChange={(e) => setCatFormData({ ...catFormData, is_active: e.target.checked })}
                    />
                    <label htmlFor="cat_active" className="text-sm font-medium">Active Category</label>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowCatModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : editingCat ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subcategory Modal */}
      {showSubModal && (
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
          <div className="card" style={{ width: '100%', maxWidth: '450px', margin: '1rem' }}>
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-bold">{editingSub ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
              <button onClick={() => setShowSubModal(false)} className="text-muted hover:text-black font-bold text-lg">&times;</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubSubmit}>
                <div className="form-group">
                  <label className="form-label text-sm">Subcategory Name</label>
                  <input
                    type="text"
                    className="form-control text-sm"
                    required
                    value={subFormData.name}
                    onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-sm">Description (Optional)</label>
                  <textarea
                    className="form-control text-sm"
                    rows={2}
                    value={subFormData.description}
                    onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
                  ></textarea>
                </div>

                {editingSub && (
                  <div className="form-group flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sub_active"
                      checked={subFormData.is_active}
                      onChange={(e) => setSubFormData({ ...subFormData, is_active: e.target.checked })}
                    />
                    <label htmlFor="sub_active" className="text-sm font-medium">Active Subcategory</label>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowSubModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-sm" disabled={submitting}>
                    {submitting ? <div className="spinner"></div> : editingSub ? 'Update Subcategory' : 'Create Subcategory'}
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

export default AdminCategories;
