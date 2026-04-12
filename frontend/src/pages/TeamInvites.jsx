import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { invitesAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";

const TeamInvites = () => {
  const { isConnected } = useDashboardStream();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [invites, setInvites] = useState([]);
  const [form, setForm] = useState({ email: "", role: "viewer" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("[TeamInvites] Loading invites...");
      const data = await invitesAPI.list();
      console.log("[TeamInvites] Invites loaded:", data);
      setInvites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[TeamInvites] Failed to load invites:", err);
      setError(err?.message || "Failed to load invites.");
      setDebugInfo({
        message: err?.message,
        status: err?.status,
        stack: err?.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Team Invites | Web3 Intel Platform";
    load();
  }, []);

  const createInvite = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError("You must be logged in to create invites.");
      return;
    }
    if (!form.email || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    console.log("[TeamInvites] Creating invite with payload:", form);
    
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setDebugInfo(null);
      
      const invite = await invitesAPI.create(form);
      
      console.log("[TeamInvites] Invite created successfully:", invite);
      
      setSuccess(`Invite created for ${invite.email || form.email}`);
      setForm({ email: "", role: "viewer" });
      
      await load();
      
    } catch (err) {
      console.error("[TeamInvites] Failed to create invite:", err);
      
      let errorMessage = err?.message || "Could not create invite.";
      
      if (err?.status === 401) {
        errorMessage = "You are not authenticated. Please log in again.";
      } else if (err?.status === 403) {
        errorMessage = "You don't have permission to create invites.";
      } else if (err?.status === 400) {
        errorMessage = err.message || "Invalid request. Please check the email and role.";
      } else if (err?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setError(errorMessage);
      setDebugInfo({
        message: err?.message,
        status: err?.status,
        payload: form,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteInvite = async (inviteId) => {
    if (!isLoggedIn) {
      setError("You must be logged in to delete invites.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this invite? This action cannot be undone.")) {
      return;
    }
    
    try {
      setDeletingId(inviteId);
      setError("");
      setSuccess("");
      
      await invitesAPI.cancel(inviteId);
      
      setSuccess("Invite deleted successfully");
      await load(); // Refresh list
      
    } catch (err) {
      console.error("[TeamInvites] Failed to delete invite:", err);
      setError(err?.message || "Failed to delete invite.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setForm((p) => ({ ...p, role: newRole }));
    console.log("[TeamInvites] Role changed to:", newRole);
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setForm((p) => ({ ...p, email: newEmail }));
    if (error) setError("");
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/20 text-purple-300";
      case "analyst":
        return "bg-blue-500/20 text-blue-300";
      case "viewer":
        return "bg-gray-500/20 text-gray-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar 
            connected={isConnected} 
            title="Team Invites" 
            subtitle="Invite teammates into your secure workspace." 
          />
          <SettingsHeader
            title="Team Management"
            subtitle="Invite analysts, admins, and viewers into your organization."
          />

          <SectionCard title="Create Invite" subtitle="Grant secure access to new workspace members.">
            <form onSubmit={createInvite} className="grid gap-5 md:grid-cols-[1.5fr_0.8fr_auto]">
              <input
                type="email"
                value={form.email}
                onChange={handleEmailChange}
                className="rounded-2xl border border-slate-700 bg-dark-panel px-4 py-3 text-dark-text focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                placeholder="colleague@company.com"
                required
                disabled={submitting || !isLoggedIn}
              />

              <select
                value={form.role}
                onChange={handleRoleChange}
                className="rounded-2xl border border-slate-700 bg-dark-panel px-4 py-3 text-dark-text focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                disabled={submitting || !isLoggedIn}
              >
                <option value="viewer">Viewer (Read-only access)</option>
                <option value="analyst">Analyst (Can view and analyze data)</option>
                <option value="admin">Admin (Full workspace access)</option>
              </select>

              <button
                type="submit"
                disabled={submitting || !isLoggedIn}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Invite"
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="text-sm text-red-400">{error}</div>
                {debugInfo && process.env.NODE_ENV === "development" && (
                  <details className="mt-2 text-xs text-red-300">
                    <summary>Debug info</summary>
                    <pre className="mt-1 overflow-auto rounded bg-red-900/20 p-2">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            {success && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-sm text-emerald-400">{success}</div>
              </div>
            )}
          </SectionCard>

          <div className="mt-8">
            <SectionCard title="Pending & historical invites" subtitle="Track invite status and role assignment.">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500"></div>
                  <span className="ml-3 text-slate-400">Loading invites...</span>
                </div>
              ) : invites.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-dark-panel p-12 text-center text-slate-400">
                  <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <p className="mt-2">No invites created yet.</p>
                  <p className="mt-1 text-sm">Use the form above to invite team members.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-slate-800 bg-dark-panel p-5 transition-all hover:border-cyan-500/30 hover:shadow-glow"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-bold text-dark-text">{invite.email}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(invite.role)}`}>
                              {invite.role?.charAt(0).toUpperCase() + invite.role?.slice(1)}
                            </span>
                            <span>•</span>
                            <span>Expires: {new Date(invite.expires_at).toLocaleString()}</span>
                            <span>•</span>
                            <span>Created: {new Date(invite.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              invite.is_accepted
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {invite.is_accepted ? "✓ Accepted" : "⏳ Pending"}
                          </span>
                          {!invite.is_accepted && (
                            <button
                              onClick={() => deleteInvite(invite.id)}
                              disabled={deletingId === invite.id || !isLoggedIn}
                              className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/30 disabled:opacity-50"
                            >
                              {deletingId === invite.id ? (
                                <svg className="h-3 w-3 animate-spin inline" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                "Delete"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default TeamInvites;