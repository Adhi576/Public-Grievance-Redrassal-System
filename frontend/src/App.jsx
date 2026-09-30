import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute, { getRoleHome } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Citizen Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyGrievances from './pages/MyGrievances';
import NewGrievance from './pages/NewGrievance';
import GrievanceDetails from './pages/GrievanceDetails';

// Officer Pages
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerGrievances from './pages/OfficerGrievances';
import OfficerGrievanceDetails from './pages/OfficerGrievanceDetails';

// Department Head Pages
import HeadDashboard from './pages/HeadDashboard';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminDepartments from './pages/AdminDepartments';
import AdminOfficers from './pages/AdminOfficers';
import AdminCategories from './pages/AdminCategories';
import AdminEscalations from './pages/AdminEscalations';
import AdminReports from './pages/AdminReports';

const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleHome(user.role)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Citizen Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/grievances" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <MyGrievances />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/grievances/new" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <NewGrievance />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/grievances/:id" 
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <GrievanceDetails />
                  </ProtectedRoute>
                } 
              />

              {/* Officer Routes */}
              <Route 
                path="/officer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/officer/grievances" 
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerGrievances />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/officer/grievances/:id" 
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerGrievanceDetails />
                  </ProtectedRoute>
                } 
              />

              {/* Department Head Routes */}
              <Route 
                path="/head/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['department_head']}>
                    <HeadDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Administrator Routes (UC-01 to UC-08) */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/departments" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminDepartments />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/officers" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminOfficers />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/categories" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminCategories />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/escalations" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminEscalations />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute allowedRoles={['administrator']}>
                    <AdminReports />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
