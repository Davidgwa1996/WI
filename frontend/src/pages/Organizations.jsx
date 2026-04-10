import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import { orgAPI } from "../services/api";

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrgs, setSelectedOrgs] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  const loadOrgs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setDebugInfo(null);
      console.log("[Organizations] Loading organizations...");
      const data = await orgAPI.listAll(); // Uses /organizations/all
      console.log("[Organizations] Loaded:", data);
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Organizations] Failed to load:", err);
      setError(err.message || "Failed to load organizations. Make sure you are logged in as an owner or super admin.");
      setDebugInfo({ loadError: err.message, status: err.status });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const toggleSelect = (orgId) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const selectAll = () => {
    if (selectedOrgs.size === organizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(organizations.map(o => o.id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedOrgs.size === 0) {
      setError("No organizations selected");
      return;
    }
    if (!window.confirm(`Delete ${selectedOrgs.size} organization(s)? This action cannot be undone.`)) {
      return;
    }
    const payload = { org_ids: Array.from(selectedOrgs) };
    console.log("[Organizations] Bulk delete payload:", payload);
    try {
      setDeleting(true);
      setError("");
      setDebugInfo(null);
      await orgAPI.bulkDelete(payload);
      setSuccess(`${selectedOrgs.size} organization(s) deleted successfully`);
      setSelectedOrgs(new Set());
      await loadOrgs();
    } catch (err) {
      console.error("[Organizations] Bulk delete error:", err);
      let errorMessage = err.message || "Failed to delete organizations";
      if (err.status === 422) {
        errorMessage = "Invalid request format. Please ensure the payload matches { org_ids: [...] }.";
      } else if (err.status === 403) {
        errorMessage = "You don't have permission to delete these organizations. Only owners or super admins can delete.";
      }
      setError(errorMessage);
      setDebugInfo({ bulkDeleteError: err.message, status: err.status, payload });
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (orgId, orgName) => {
    if (!window.confirm(`Delete organization "${orgName}"? This will delete all associated data.`)) {
      return;
    }
    console.log("[Organizations] Deleting single org:", orgId);
    try {
      await orgAPI.delete(orgId);
      setSuccess(`Organization "${orgName}" deleted successfully`);
      await loadOrgs();
    } catch (err) {
      console.error("[Organizations] Delete single error:", err);
      let errorMessage = err.message || "Failed to delete organization";
      if (err.status === 403) {
        errorMessage = "You don't have permission to delete this organization. Only owners or super admins can delete.";
      } else if (err.status === 404) {
        errorMessage = "Organization not found.";
      }
      setError(errorMessage);
      setDebugInfo({ singleDeleteError: err.message, status: err.status, orgId });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar 
            title="Organizations" 
            subtitle="Manage all workspaces (super admin view)" 
          />
          <SectionCard 
            title="All Workspaces" 
            subtitle="View, select, and delete any organization (super admin privilege)"
          >
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
                {debugInfo && process.env.NODE_ENV === "development" && (
                  <details className="mt-2 text-xs text-red-500">
                    <summary>Debug info</summary>
                    <pre className="mt-1 overflow-auto rounded bg-red-100 p-2">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-600">
                {success}
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="rounded-lg bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700 hover:bg-cyan-200"
                >
                  {selectedOrgs.size === organizations.length ? "Deselect All" : "Select All"}
                </button>
                <button
                  onClick={loadOrgs}
                  disabled={loading}
                  className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <button
                onClick={deleteSelected}
                disabled={deleting || selectedOrgs.size === 0}
                className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : `Delete Selected (${selectedOrgs.size})`}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600"></div>
                <span className="ml-3 text-slate-500">Loading organizations...</span>
              </div>
            ) : organizations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
                <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="mt-2">No organizations found.</p>
                <p className="mt-1 text-sm">You need to be logged in as a super admin to see all workspaces.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedOrgs.has(org.id)}
                        onChange={() => toggleSelect(org.id)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{org.name}</div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500">
                          <span>Slug: {org.slug}</span>
                          <span>•</span>
                          <span>ID: {org.id}</span>
                          <span>•</span>
                          <span>Plan: {org.plan}</span>
                          <span>•</span>
                          <span>Created: {new Date(org.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSingle(org.id, org.name)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Organizations;