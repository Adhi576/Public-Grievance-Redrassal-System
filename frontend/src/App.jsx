import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyGrievances from './pages/MyGrievances';
import NewGrievance from './pages/NewGrievance';
import GrievanceDetails from './pages/GrievanceDetails';

import OfficerDashboard from './pages/OfficerDashboard';
import OfficerGrievances from './pages/OfficerGrievances';
import OfficerGrievanceDetails from './pages/OfficerGrievanceDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
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
