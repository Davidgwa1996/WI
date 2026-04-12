import React, { useEffect, useState, useCallback } from "react";
import {
  FiShield,
  FiUsers,
  FiCheckCircle,
  FiRefreshCw,
  FiTrash2,
  FiHome,
} from "react-icons/fi";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import { orgAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const roleCards = [
  {
    title: "Owner",
    text: "Full control of the platform workspace, approvals, deletes, organization control, and final account authority.",
    badge: "Full access",
  },
  {
    title: "Admin",
    text: "Operational management access after approval by the owner, with workspace-level administrative control.",
    badge: "Managed access",
  },
  {
    title: "Analyst",
    text: "Can use intelligence workflows, reports, and analysis features after the workspace grants approval.",
    badge: "Research access",
  },
  {
    title: "Viewer",
    text: "Read-only workspace participation after approval or invite acceptance.",
    badge: "Read only",
  },
];

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
        err?.message ||
          "Failed to load organizations. Sign in with the correct privileges to manage workspaces."
      );
      setDebugInfo({
        loadError: err?.message,
        status: err?.status,
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

      let errorMessage = err?.message || "Failed to delete organizations.";
      if (err?.status === 422) {
        errorMessage =
          "Invalid request format. The backend expects { org_ids: [...] }.";
      } else if (err?.status === 403) {
        errorMessage =
          "You do not have permission to delete these organizations.";
      }

      setError(errorMessage);
      setDebugInfo({
        bulkDeleteError: err?.message,
        status: err?.status,
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

      let errorMessage = err?.message || "Failed to delete organization.";
      if (err?.status === 403) {
        errorMessage =
          "You do not have permission to delete this organization.";
      } else if (err?.status === 404) {
        errorMessage = "Organization not found.";
      }

      setError(errorMessage);
      setDebugInfo({
        singleDeleteError: err?.message,
        status: err?.status,
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
            subtitle="Create or access a workspace, view the role structure, and manage organizations if your permissions allow it."
          />

          <SectionCard
            title="Workspace Access Flow"
            subtitle="Public visitors can inspect the platform flow here. Real workspace use begins after organization approval, invite acceptance, or owner access."
          >
            <div className="mb-6 app-panel-soft p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <FiHome className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    How access works
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Public users can view Home, Search AI, AI Agent, Projects,
                    and Competitors. To use protected workspace features such as
                    Watchlists, Reports, API Keys, Audit Logs, Billing, and
                    organization management, the user must sign in through the
                    workspace flow and be approved by the owner or invited into
                    the organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {roleCards.map((role) => (
                <div key={role.title} className="app-panel p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FiShield className="h-5 w-5 text-cyan-600" />
                      <span className="text-lg font-bold text-slate-900">
                        {role.title}
                      </span>
                    </div>
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-100">
                      {role.badge}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{role.text}</p>
                </div>
              ))}
            </div>

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
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={deleteSelected}
                disabled={deleting || selectedOrgs.size === 0 || !isLoggedIn}
                className="action-btn danger"
              >
                <FiTrash2 />
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
                  <FiUsers className="h-7 w-7 text-slate-500" />
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
                      <FiTrash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 app-panel-soft p-5">
              <div className="flex items-start gap-3">
                <FiCheckCircle className="mt-1 h-5 w-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Final platform rule
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    The owner remains the highest authority in the workspace and
                    can manage approvals, access structure, organization control,
                    and deletion rights. Public users may inspect the platform,
                    but protected services only open after the correct workspace
                    access path is completed.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Organizations;