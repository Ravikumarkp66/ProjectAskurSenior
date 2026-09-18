import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';
import SubjectsPage from './pages/SubjectsPage';
import EvaluationGroupsPage from './pages/EvaluationGroupsPage';
import EvaluationRulesPage from './pages/EvaluationRulesPage';
import MaterialsPage from './pages/MaterialsPage';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import AdminsPage from './pages/AdminsPage';
import SecurityPage from './pages/SecurityPage';
import AcademicStructurePage from './pages/AcademicStructurePage';
import InterviewsPage from './pages/InterviewsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import DashboardPage from './pages/DashboardPage';
import FeaturesPage from './pages/FeaturesPage';
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="structure" element={<AcademicStructurePage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="evaluation-groups" element={<EvaluationGroupsPage />} />
          <Route path="evaluation-rules" element={<EvaluationRulesPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="features" element={<FeaturesPage />} />
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
          <Route path="overview" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
