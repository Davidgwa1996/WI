import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
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
import Organizations from "./pages/Organizations";  // ✅ New import

import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />

            <Route
              path="/competitors"
              element={
                <ProtectedRoute>
                  <Competitors />
                </ProtectedRoute>
              }
            />

            <Route
              path="/watchlists"
              element={
                <ProtectedRoute>
                  <Watchlists />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/briefings"
              element={
                <ProtectedRoute>
                  <Briefings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/search-intel"
              element={
                <ProtectedRoute>
                  <SearchIntel />
                </ProtectedRoute>
              }
            />

            <Route
              path="/agent"
              element={
                <ProtectedRoute>
                  <AgentChat />
                </ProtectedRoute>
              }
            />

            <Route
              path="/workspace"
              element={
                <ProtectedRoute>
                  <WorkspaceSettings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <TeamInvites />
                </ProtectedRoute>
              }
            />

            <Route
              path="/members"
              element={
                <ProtectedRoute>
                  <RoleGuard roles={["owner", "admin"]}>
                    <TeamMembers />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />

            <Route
              path="/api-keys"
              element={
                <ProtectedRoute>
                  <APIKeys />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing/success"
              element={
                <ProtectedRoute>
                  <BillingSuccess />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing/cancel"
              element={
                <ProtectedRoute>
                  <BillingCancel />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute>
                  <RoleGuard roles={["owner", "admin"]}>
                    <AdminRoles />
                  </RoleGuard>
                </ProtectedRoute>
              }
            />

            <Route
              path="/api-docs"
              element={
                <ProtectedRoute>
                  <ApiDocsPage />
                </ProtectedRoute>
              }
            />

            {/* ✅ New Organizations route – only visible to owners (inside the page we enforce role) */}
            <Route
              path="/organizations"
              element={
                <ProtectedRoute>
                  <Organizations />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;