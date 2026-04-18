import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import DefaultLayout from './components/layout/DefaultLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ReportIssue from './pages/student/ReportIssue';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminIssues from './pages/admin/AdminIssues';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminWorkerRequests from './pages/admin/AdminWorkerRequests';
import AdminWorkerManagement from './pages/admin/AdminWorkerManagement';

// Supervisor Pages
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import SupervisorInventory from './pages/supervisor/SupervisorInventory';
import MaterialRequestForm from './pages/supervisor/MaterialRequestForm';

// Shared
import IssueDetails from './pages/shared/IssueDetails';
import NotificationCenter from './pages/shared/NotificationCenter';

function App() {
  const { user } = useAuth();

  // Smart redirect based on role
  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'supervisor': return '/supervisor/dashboard';
      default: return '/student/dashboard';
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Layout */}
      <Route element={
        <ProtectedRoute>
          <DefaultLayout />
        </ProtectedRoute>
      }>
        {/* Student Routes */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/report" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ReportIssue />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/issues" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminIssues />
          </ProtectedRoute>
        } />
        <Route path="/admin/worker-requests" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminWorkerRequests />
          </ProtectedRoute>
        } />
        <Route path="/admin/workers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminWorkerManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserManagement />
          </ProtectedRoute>
        } />

        {/* Supervisor Routes */}
        <Route path="/supervisor/dashboard" element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <SupervisorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/supervisor/inventory" element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <SupervisorInventory />
          </ProtectedRoute>
        } />
        <Route path="/supervisor/request-material" element={
          <ProtectedRoute allowedRoles={['supervisor']}>
            <MaterialRequestForm />
          </ProtectedRoute>
        } />

        {/* Shared Routes */}
        <Route path="/issue/:id" element={<IssueDetails />} />
        <Route path="/notifications" element={<NotificationCenter />} />
      </Route>

      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

export default App;
