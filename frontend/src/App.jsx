import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

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
import AdminPanel from "./pages/AdminPanel";

import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function getStoredUser() {
  try {
    return (
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(localStorage.getItem("auth_user")) ||
      JSON.parse(localStorage.getItem("currentUser")) ||
      null
    );
  } catch {
    return null;
  }
}

function getStoredToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

function RequireAuth({ children }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RequireRole({ roles = [], children }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role) {
    return <Navigate to="/organizations" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing only */}
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* Public access/auth entry */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />
            <Route path="/organizations" element={<Organizations />} />

            {/* Public preview routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/briefings" element={<Briefings />} />
            <Route path="/search-intel" element={<SearchIntel />} />
            <Route path="/api-docs" element={<ApiDocsPage />} />

            {/* Protected real-use routes */}
            <Route
              path="/watchlists"
              element={
                <RequireAuth>
                  <Watchlists />
                </RequireAuth>
              }
            />
            <Route
              path="/agent"
              element={
                <RequireAuth>
                  <AgentChat />
                </RequireAuth>
              }
            />
            <Route
              path="/workspace"
              element={
                <RequireAuth>
                  <WorkspaceSettings />
                </RequireAuth>
              }
            />
            <Route
              path="/team"
              element={
                <RequireAuth>
                  <TeamInvites />
                </RequireAuth>
              }
            />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <Account />
                </RequireAuth>
              }
            />
            <Route
              path="/api-keys"
              element={
                <RequireAuth>
                  <APIKeys />
                </RequireAuth>
              }
            />
            <Route
              path="/billing"
              element={
                <RequireAuth>
                  <Billing />
                </RequireAuth>
              }
            />
            <Route
              path="/billing/success"
              element={
                <RequireAuth>
                  <BillingSuccess />
                </RequireAuth>
              }
            />
            <Route
              path="/billing/cancel"
              element={
                <RequireAuth>
                  <BillingCancel />
                </RequireAuth>
              }
            />

            {/* Owner / admin routes */}
            <Route
              path="/members"
              element={
                <RequireRole roles={["owner", "admin"]}>
                  <TeamMembers />
                </RequireRole>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <RequireRole roles={["owner", "admin"]}>
                  <AuditLogs />
                </RequireRole>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <RequireRole roles={["owner", "admin"]}>
                  <AdminRoles />
                </RequireRole>
              }
            />

            {/* Owner only */}
            <Route
              path="/admin"
              element={
                <RequireRole roles={["owner"]}>
                  <AdminPanel />
                </RequireRole>
              }
            />

            {/* Helpful aliases */}
            <Route path="/launch-workspace" element={<Navigate to="/organizations" replace />} />
            <Route path="/explore" element={<Navigate to="/dashboard" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;