import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Alert from '../components/Alert';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await login(email, password);
      if (user.role === 'citizen') {
        navigate('/dashboard');
      } else if (user.role === 'officer') {
        navigate('/officer/dashboard');
      } else if (user.role === 'department_head') {
        navigate('/head/dashboard');
      } else if (user.role === 'administrator') {
        navigate('/admin/dashboard');
      } else {
        setError('Unknown role.');
      }
    } catch (err) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-header text-center">
          <h2 className="text-2xl">Citizen Portal Login</h2>
          <p className="text-muted mt-1 text-sm">Public Grievance Redressal System</p>
        </div>
        <div className="card-body">
          <Alert type="error" message={error} />
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-control" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary btn-block mt-4"
              disabled={loading}
            >
              {loading ? <div className="spinner"></div> : 'Log In'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            Don't have an account? <Link to="/register" className="font-medium">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
