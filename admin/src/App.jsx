import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import SubjectsPage from './pages/SubjectsPage';
import MaterialsPage from './pages/MaterialsPage';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminsPage from './pages/AdminsPage';
import SecurityPage from './pages/SecurityPage';
import SuperAdminRoute from './components/SuperAdminRoute';
import SessionReplacedModal from './components/SessionReplacedModal';

export function App() {
  return (
    <>
      <SessionReplacedModal />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/users" replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route
            path="admins"
            element={
              <SuperAdminRoute>
                <AdminsPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="security"
            element={
              <SuperAdminRoute>
                <SecurityPage />
              </SuperAdminRoute>
            }
          />
          <Route path="overview" element={<Navigate to="/users" replace />} />
          <Route path="dashboard" element={<Navigate to="/users" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </>
  );
}

export default App;
