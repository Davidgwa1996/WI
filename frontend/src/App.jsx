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
import Account from "./pages/Account";
import APIKeys from "./pages/APIKeys";
import Billing from "./pages/Billing";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import AuditLogs from "./pages/AuditLogs";
import ApiDocsPage from "./pages/ApiDocsPage";
import Organizations from "./pages/Organizations";
import AdminPanel from "./pages/AdminPanel";

import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function getStoredUser() {
  const keys = ["user", "auth_user", "currentUser"];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
    }
  }

  return null;
}

function getStoredToken() {
  return (
    localStorage.getItem("w3i_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

function RequireAuth({ children }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/organizations" replace />;
  }

  return children;
}

function RequireRole({ roles = [], children }) {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/organizations" replace />;
  }

  const userRole = String(user?.role || "").toLowerCase();
  const normalizedRoles = roles.map((role) => String(role).toLowerCase());

  if (!userRole) {
    return <Navigate to="/organizations" replace />;
  }

  if (normalizedRoles.length > 0 && !normalizedRoles.includes(userRole)) {
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
            {/* Public landing */}
            <Route path="/" element={<Landing />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* Public preview pages */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/search-intel" element={<SearchIntel />} />
            <Route path="/agent" element={<AgentChat />} />

            {/* Workspace / access flow */}
            <Route path="/organizations" element={<Organizations />} />
            <Route
              path="/launch-workspace"
              element={<Navigate to="/organizations" replace />}
            />
            <Route path="/explore" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/accept-invite" element={<AcceptInvite />} />

            {/* Protected workspace pages */}
            <Route
              path="/watchlists"
              element={
                <RequireAuth>
                  <Watchlists />
                </RequireAuth>
              }
            />
            <Route
              path="/reports"
              element={
                <RequireAuth>
                  <Reports />
                </RequireAuth>
              }
            />
            <Route
              path="/briefings"
              element={
                <RequireAuth>
                  <Briefings />
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
              path="/account"
              element={
                <RequireAuth>
                  <Account />
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

            {/* Admin / managed services */}
            <Route
              path="/api-keys"
              element={
                <RequireRole roles={["owner", "admin"]}>
                  <APIKeys />
                </RequireRole>
              }
            />
            <Route
              path="/billing"
              element={
                <RequireRole roles={["owner", "admin"]}>
                  <Billing />
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
              path="/api-docs"
              element={
                <RequireRole roles={["owner", "admin", "analyst"]}>
                  <ApiDocsPage />
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

            {/* Removed pages from final product flow */}
            <Route path="/team" element={<Navigate to="/organizations" replace />} />
            <Route
              path="/members"
              element={<Navigate to="/organizations" replace />}
            />
            <Route
              path="/admin/roles"
              element={<Navigate to="/organizations" replace />}
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