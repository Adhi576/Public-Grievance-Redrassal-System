import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Alert from '../components/Alert';

const NewGrievance = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    sub_category_id: '',
    priority: 'medium',
    location: ''
  });
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
    fetchCategories();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) setDepartments(res.data.data);
    } catch (err) {
      console.error('Error fetching departments', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  // When a department is selected, filter categories for that department
  // The system uses sub_category_id directly on the Grievance, but we need to select Category -> SubCategory
  const availableCategories = categories.filter(c => c.department_id === parseInt(formData.department_id));

  // When a category is selected, extract its sub_categories
  const selectedCategoryObj = categories.find(c => c.category_id === parseInt(formData.category_id));
  const availableSubCategories = selectedCategoryObj ? selectedCategoryObj.subCategories || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset sub-selections when parents change
    if (name === 'department_id') {
      setFormData(prev => ({ ...prev, category_id: '', sub_category_id: '' }));
    }
    if (name === 'category_id') {
      setFormData(prev => ({ ...prev, sub_category_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.sub_category_id) {
      setError('Please select a Sub-Category.');
      setLoading(false);
      return;
    }

    try {
      // API expects: title, description, sub_category_id, priority, location
      // Department is inferred or sent as required by backend (wait, backend expects sub_category_id, it infers dept via sub_cat -> cat -> dept, or requires it directly?)
      // Let's send what we have.
      const payload = {
        title: formData.title,
        description: formData.description,
        sub_category_id: parseInt(formData.sub_category_id),
        priority: formData.priority,
        location: formData.location
      };
      const response = await api.post('/grievances', payload);
      
      if (response.data.success) {
        navigate(`/grievances/${response.data.data.grievance_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit grievance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Submit New Grievance</h1>
        
        <Alert type="error" message={error} />
        
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  className="form-control" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  maxLength="255"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  name="department_id" 
                  className="form-control" 
                  value={formData.department_id} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {formData.department_id && (
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    name="category_id" 
                    className="form-control" 
                    value={formData.category_id || ''} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {availableCategories.map(c => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.category_id && (
                <div className="form-group">
                  <label className="form-label">Sub-Category</label>
                  <select 
                    name="sub_category_id" 
                    className="form-control" 
                    value={formData.sub_category_id} 
                    onChange={handleChange} 
                    required
                  >
                    <option value="">-- Select Sub-Category --</option>
                    {availableSubCategories.map(sc => (
                      <option key={sc.sub_category_id} value={sc.sub_category_id}>{sc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  name="priority" 
                  className="form-control" 
                  value={formData.priority} 
                  onChange={handleChange} 
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location (Optional)</label>
                <input 
                  type="text" 
                  name="location" 
                  className="form-control" 
                  value={formData.location} 
                  onChange={handleChange} 
                  placeholder="e.g. 123 Main St, City"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  name="description" 
                  className="form-control" 
                  value={formData.description} 
                  onChange={handleChange} 
                  required 
                  placeholder="Please provide detailed information about your grievance..."
                ></textarea>
              </div>

              <div className="flex justify-between items-center mt-8">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? <div className="spinner"></div> : 'Submit Grievance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewGrievance;
