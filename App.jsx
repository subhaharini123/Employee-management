import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Loader from './components/Loader';

// Component imports
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Page imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import Departments from './pages/Departments';
import AttendanceTracker from './pages/AttendanceTracker';
import SalaryManager from './pages/SalaryManager';

// Layout for authenticated users
const ProtectedLayout = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return <Loader fullPage />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Navbar onToggleSidebar={toggleSidebar} />
        <main className="page-wrapper">{children}</main>
      </div>
    </div>
  );
};

// Layout for public route (Login)
const PublicLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicLayout>
                <Login />
              </PublicLayout>
            }
          />

          {/* Protected General Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedLayout>
                <AttendanceTracker />
              </ProtectedLayout>
            }
          />
          <Route
            path="/salary"
            element={
              <ProtectedLayout>
                <SalaryManager />
              </ProtectedLayout>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/employees"
            element={
              <ProtectedLayout adminOnly>
                <EmployeeList />
              </ProtectedLayout>
            }
          />
          <Route
            path="/employees/new"
            element={
              <ProtectedLayout adminOnly>
                <EmployeeForm />
              </ProtectedLayout>
            }
          />
          <Route
            path="/employees/edit/:id"
            element={
              <ProtectedLayout adminOnly>
                <EmployeeForm />
              </ProtectedLayout>
            }
          />
          <Route
            path="/departments"
            element={
              <ProtectedLayout adminOnly>
                <Departments />
              </ProtectedLayout>
            }
          />

          {/* Redirects */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
