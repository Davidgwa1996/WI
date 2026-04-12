import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import PublicRoute from "./components/auth/PublicRoute";
import RoleGuard from "./components/auth/RoleGuard";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AcceptInvite from "./pages/AcceptInvite";

import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Competitors from "./pages/Competitors";
import Watchlists from "./pages/Watchlists";
import Reports from "./pages/Reports";
import Briefings from "./pages/Briefings";
import SearchIntel from "./pages/SearchIntel";
import AgentChat from "./pages/AgentChat";
import WorkspaceSettings from "./pages/WorkspaceSettings";
import TeamInvites from "./pages/TeamInvites";
import TeamMembers from "./pages/TeamMembers";
import Account from "./pages/Account";
import APIKeys from "./pages/APIKeys";
import Billing from "./pages/Billing";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import AuditLogs from "./pages/AuditLogs";
import AdminRoles from "./pages/AdminRoles";
import ApiDocsPage from "./pages/ApiDocsPage";
import Organizations from "./pages/Organizations";
import AdminPanel from "./pages/AdminPanel"; // Super admin panel

import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes – no authentication required */}
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* All other routes are publicly viewable (preview mode) */}
            <Route
              path="/dashboard"
              element={
                <PublicRoute>
                  <Dashboard />
                </PublicRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <PublicRoute>
                  <Projects />
                </PublicRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <PublicRoute>
                  <ProjectDetail />
                </PublicRoute>
              }
            />
            <Route
              path="/competitors"
              element={
                <PublicRoute>
                  <Competitors />
                </PublicRoute>
              }
            />
            <Route
              path="/watchlists"
              element={
                <PublicRoute>
                  <Watchlists />
                </PublicRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PublicRoute>
                  <Reports />
                </PublicRoute>
              }
            />
            <Route
              path="/briefings"
              element={
                <PublicRoute>
                  <Briefings />
                </PublicRoute>
              }
            />
            <Route
              path="/search-intel"
              element={
                <PublicRoute>
                  <SearchIntel />
                </PublicRoute>
              }
            />
            <Route
              path="/agent"
              element={
                <PublicRoute>
                  <AgentChat />
                </PublicRoute>
              }
            />
            <Route
              path="/workspace"
              element={
                <PublicRoute>
                  <WorkspaceSettings />
                </PublicRoute>
              }
            />
            <Route
              path="/team"
              element={
                <PublicRoute>
                  <TeamInvites />
                </PublicRoute>
              }
            />
            <Route
              path="/members"
              element={
                <PublicRoute>
                  <RoleGuard roles={["owner", "admin"]}>
                    <TeamMembers />
                  </RoleGuard>
                </PublicRoute>
              }
            />
            <Route
              path="/account"
              element={
                <PublicRoute>
                  <Account />
                </PublicRoute>
              }
            />
            <Route
              path="/api-keys"
              element={
                <PublicRoute>
                  <APIKeys />
                </PublicRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <PublicRoute>
                  <Billing />
                </PublicRoute>
              }
            />
            <Route
              path="/billing/success"
              element={
                <PublicRoute>
                  <BillingSuccess />
                </PublicRoute>
              }
            />
            <Route
              path="/billing/cancel"
              element={
                <PublicRoute>
                  <BillingCancel />
                </PublicRoute>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <PublicRoute>
                  <AuditLogs />
                </PublicRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <PublicRoute>
                  <RoleGuard roles={["owner", "admin"]}>
                    <AdminRoles />
                  </RoleGuard>
                </PublicRoute>
              }
            />
            <Route
              path="/api-docs"
              element={
                <PublicRoute>
                  <ApiDocsPage />
                </PublicRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <PublicRoute>
                  <Organizations />
                </PublicRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PublicRoute>
                  <AdminPanel />
                </PublicRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;