import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getRoleHome } from './ProtectedRoute';
import {
  LogOut,
  Home,
  FileText,
  PlusCircle,
  Shield,
  Users,
  Building,
  UserCheck,
  Tag,
  ShieldAlert,
  FileBarChart
} from 'lucide-react';

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
        <Link to={getRoleHome(user.role)} className="navbar-brand">
          PGRS Portal
        </Link>
        <div className="nav-links flex items-center gap-1 flex-wrap">
          {user.role === 'citizen' && (
            <>
              <Link to="/dashboard" className="nav-link flex items-center gap-1">
                <Home size={16} />
                Dashboard
              </Link>
              <Link to="/grievances" className="nav-link flex items-center gap-1">
                <FileText size={16} />
                My Grievances
              </Link>
              <Link to="/grievances/new" className="nav-link flex items-center gap-1">
                <PlusCircle size={16} />
                New Grievance
              </Link>
            </>
          )}

          {user.role === 'officer' && (
            <>
              <Link to="/officer/dashboard" className="nav-link flex items-center gap-1">
                <Home size={16} />
                Dashboard
              </Link>
              <Link to="/officer/grievances" className="nav-link flex items-center gap-1">
                <FileText size={16} />
                Assigned Grievances
              </Link>
            </>
          )}

          {user.role === 'department_head' && (
            <>
              <Link to="/head/dashboard" className="nav-link flex items-center gap-1">
                <Home size={16} />
                Dashboard
              </Link>
              <Link to="/head/grievances" className="nav-link flex items-center gap-1">
                <FileText size={16} />
                Complaints
              </Link>
              <Link to="/head/officers" className="nav-link flex items-center gap-1">
                <UserCheck size={16} />
                Officers
              </Link>
              <Link to="/head/reports" className="nav-link flex items-center gap-1">
                <FileBarChart size={16} />
                Reports
              </Link>
            </>
          )}

          {user.role === 'administrator' && (
            <>
              <Link to="/admin/dashboard" className="nav-link flex items-center gap-1">
                <Shield size={16} />
                Dashboard
              </Link>
              <Link to="/admin/users" className="nav-link flex items-center gap-1">
                <Users size={16} />
                Users
              </Link>
              <Link to="/admin/departments" className="nav-link flex items-center gap-1">
                <Building size={16} />
                Departments
              </Link>
              <Link to="/admin/officers" className="nav-link flex items-center gap-1">
                <UserCheck size={16} />
                Officers
              </Link>
              <Link to="/admin/categories" className="nav-link flex items-center gap-1">
                <Tag size={16} />
                Categories
              </Link>
              <Link to="/admin/escalations" className="nav-link flex items-center gap-1">
                <ShieldAlert size={16} />
                Escalations
              </Link>
              <Link to="/admin/reports" className="nav-link flex items-center gap-1">
                <FileBarChart size={16} />
                Reports
              </Link>
            </>
          )}
          
          <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.3)', margin: '0 0.5rem' }}></div>
          <div className="flex items-center gap-3">
            <span className="text-xs">Hi, {user.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary flex items-center gap-1" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
