import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Home, FileText, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between">
        <Link to="/dashboard" className="navbar-brand">
          PGRS Citizen Portal
        </Link>
        <div className="nav-links">
          {user.role === 'citizen' && (
            <>
              <Link to="/dashboard" className="nav-link flex items-center gap-1">
                <Home size={18} />
                Dashboard
              </Link>
              <Link to="/grievances" className="nav-link flex items-center gap-1">
                <FileText size={18} />
                My Grievances
              </Link>
              <Link to="/grievances/new" className="nav-link flex items-center gap-1">
                <PlusCircle size={18} />
                New Grievance
              </Link>
            </>
          )}

          {user.role === 'officer' && (
            <>
              <Link to="/officer/dashboard" className="nav-link flex items-center gap-1">
                <Home size={18} />
                Officer Dashboard
              </Link>
              <Link to="/officer/grievances" className="nav-link flex items-center gap-1">
                <FileText size={18} />
                Assigned Grievances
              </Link>
            </>
          )}
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 1rem' }}></div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Hi, {user.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary flex items-center gap-1" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
