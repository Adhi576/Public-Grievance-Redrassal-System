import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'citizen'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '2rem 0' }}>
        <div className="card-header text-center">
          <h2 className="text-2xl">Citizen Registration</h2>
          <p className="text-muted mt-1 text-sm">Create an account to submit grievances</p>
        </div>
        <div className="card-body">
          <Alert type="error" message={error} />
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="form-control" 
                value={formData.name}
                onChange={handleChange}
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                name="email"
                className="form-control" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                name="password"
                className="form-control" 
                value={formData.password}
                onChange={handleChange}
                required 
                minLength="6"
              />
              <span className="text-xs text-muted mt-1">Must be at least 6 characters.</span>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block mt-4"
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : 'Register'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            Already have an account? <Link to="/login" className="font-medium">Log in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
