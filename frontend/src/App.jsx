import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

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

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

function RequireRole({ roles = [], children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.role) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing and preview */}
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/explore" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
      <Route path="/competitors" element={<Competitors />} />
      <Route path="/search-intel" element={<SearchIntel />} />
      <Route path="/agent" element={<AgentChat />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />

      {/* Access flow */}
      <Route path="/organizations" element={<Organizations />} />
      <Route path="/launch-workspace" element={<Navigate to="/organizations" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
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

      {/* Admin / owner */}
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

      {/* Owner only */}
      <Route
        path="/audit-logs"
        element={
          <RequireRole roles={["owner"]}>
            <AuditLogs />
          </RequireRole>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireRole roles={["owner", "admin"]}>
            <AdminPanel />
          </RequireRole>
        }
      />
      <Route
        path="/organizations/manage"
        element={
          <RequireRole roles={["owner"]}>
            <Organizations />
          </RequireRole>
        }
      />

      {/* Removed old flow */}
      <Route path="/team" element={<Navigate to="/organizations" replace />} />
      <Route path="/members" element={<Navigate to="/organizations" replace />} />
      <Route path="/admin/roles" element={<Navigate to="/admin" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;