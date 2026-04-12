import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import { orgAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Organizations = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

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
      setSuccess("");
      setDebugInfo(null);

      const data = await orgAPI.listAll();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Organizations] Failed to load:", err);
      setOrganizations([]);
      setError(
        err.message ||
          "Failed to load organizations. Sign in with the right privileges to manage workspaces."
      );
      setDebugInfo({
        loadError: err.message,
        status: err.status,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Web3 Intel Platform | Organizations";
    loadOrgs();
  }, [loadOrgs]);

  const toggleSelect = (orgId) => {
    setSelectedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedOrgs.size === organizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(organizations.map((org) => org.id)));
    }
  };

  const deleteSelected = async () => {
    if (!isLoggedIn) {
      setError("You must be logged in to delete organizations.");
      return;
    }

    if (selectedOrgs.size === 0) {
      setError("No organizations selected.");
      return;
    }

    const count = selectedOrgs.size;
    const confirmed = window.confirm(
      `Delete ${count} organization(s)? This action cannot be undone.`
    );
    if (!confirmed) return;

    const payload = { org_ids: Array.from(selectedOrgs) };

    try {
      setDeleting(true);
      setError("");
      setSuccess("");
      setDebugInfo(null);

      await orgAPI.bulkDelete(payload);

      setSuccess(`${count} organization(s) deleted successfully.`);
      setSelectedOrgs(new Set());
      await loadOrgs();
    } catch (err) {
      console.error("[Organizations] Bulk delete error:", err);

      let errorMessage = err.message || "Failed to delete organizations.";
      if (err.status === 422) {
        errorMessage =
          "Invalid request format. The backend expects { org_ids: [...] }.";
      } else if (err.status === 403) {
        errorMessage =
          "You do not have permission to delete these organizations.";
      }

      setError(errorMessage);
      setDebugInfo({
        bulkDeleteError: err.message,
        status: err.status,
        payload,
      });
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (orgId, orgName) => {
    if (!isLoggedIn) {
      setError("You must be logged in to delete an organization.");
      return;
    }

    const confirmed = window.confirm(
      `Delete organization "${orgName}"? This will remove all associated data.`
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setDebugInfo(null);

      await orgAPI.delete(orgId);

      setSuccess(`Organization "${orgName}" deleted successfully.`);
      setSelectedOrgs((prev) => {
        const next = new Set(prev);
        next.delete(orgId);
        return next;
      });

      await loadOrgs();
    } catch (err) {
      console.error("[Organizations] Delete single error:", err);

      let errorMessage = err.message || "Failed to delete organization.";
      if (err.status === 403) {
        errorMessage =
          "You do not have permission to delete this organization.";
      } else if (err.status === 404) {
        errorMessage = "Organization not found.";
      }

      setError(errorMessage);
      setDebugInfo({
        singleDeleteError: err.message,
        status: err.status,
        orgId,
      });
    }
  };

  const allSelected =
    organizations.length > 0 && selectedOrgs.size === organizations.length;

  return (
    <div className="app-page xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            title="Organizations"
            subtitle="Browse workspaces and manage them if your role allows it."
          />

          <SectionCard
            title="All Workspaces"
            subtitle="Recruiters and reviewers can inspect the platform flow here. Deletion actions require the right account permissions."
          >
            {error ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
                {debugInfo && import.meta.env.DEV ? (
                  <details className="mt-3 text-xs text-red-700">
                    <summary className="cursor-pointer font-semibold">
                      Debug info
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 text-red-700">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ) : null}

            {success ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <div className="page-actions">
              <button
                type="button"
                onClick={selectAll}
                className="action-btn secondary"
                disabled={organizations.length === 0}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>

              <button
                type="button"
                onClick={loadOrgs}
                disabled={loading}
                className="action-btn refresh"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={deleteSelected}
                disabled={deleting || selectedOrgs.size === 0 || !isLoggedIn}
                className="action-btn danger"
              >
                {deleting
                  ? "Deleting..."
                  : `Delete Selected (${selectedOrgs.size})`}
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="mb-4 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">
                Public visitors can view this page. Sign in with an authorized
                account to manage or delete organizations.
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner-sm" />
                <span className="ml-3 text-slate-600">
                  Loading organizations...
                </span>
              </div>
            ) : organizations.length === 0 ? (
              <div className="app-panel p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <svg
                    className="h-7 w-7 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>

                <p className="mt-4 font-semibold text-slate-800">
                  No organizations found.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Create or access a workspace through the organization flow.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="app-panel flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedOrgs.has(org.id)}
                        onChange={() => toggleSelect(org.id)}
                        disabled={!isLoggedIn}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                      />

                      <div>
                        <div className="font-bold text-slate-900">{org.name}</div>

                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                          <span>Slug: {org.slug}</span>
                          <span>•</span>
                          <span>ID: {org.id}</span>
                          <span>•</span>
                          <span>Plan: {org.plan}</span>
                          <span>•</span>
                          <span>
                            Created:{" "}
                            {org.created_at
                              ? new Date(org.created_at).toLocaleString()
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteSingle(org.id, org.name)}
                      disabled={!isLoggedIn}
                      className="btn-danger self-start lg:self-center"
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