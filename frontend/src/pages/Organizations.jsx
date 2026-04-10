import React, { useEffect, useState } from "react";
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

  const loadOrgs = async () => {
    try {
      setLoading(true);
      // Assuming you have an endpoint to list all orgs for the user
      const data = await orgAPI.listAll(); // You may need to add this to api.js
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

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
    try {
      setDeleting(true);
      await orgAPI.bulkDelete({ org_ids: Array.from(selectedOrgs) });
      setSuccess(`${selectedOrgs.size} organization(s) deleted successfully`);
      setSelectedOrgs(new Set());
      await loadOrgs();
    } catch (err) {
      setError(err.message || "Failed to delete organizations");
    } finally {
      setDeleting(false);
    }
  };

  const deleteSingle = async (orgId, orgName) => {
    if (!window.confirm(`Delete organization "${orgName}"? This will delete all associated data.`)) {
      return;
    }
    try {
      await orgAPI.delete(orgId);
      setSuccess(`Organization "${orgName}" deleted`);
      await loadOrgs();
    } catch (err) {
      setError(err.message || "Failed to delete organization");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar title="Organizations" subtitle="Manage your workspaces" />
          <SectionCard title="Your Workspaces" subtitle="Delete test organizations or manage all workspaces">
            {error && <div className="mb-4 text-red-600">{error}</div>}
            {success && <div className="mb-4 text-emerald-600">{success}</div>}
            {loading ? (
              <div className="text-slate-500">Loading...</div>
            ) : organizations.length === 0 ? (
              <div className="text-slate-500">No organizations found.</div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <button
                    onClick={selectAll}
                    className="rounded-lg bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-700"
                  >
                    {selectedOrgs.size === organizations.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={deleteSelected}
                    disabled={deleting || selectedOrgs.size === 0}
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : `Delete Selected (${selectedOrgs.size})`}
                  </button>
                </div>
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedOrgs.has(org.id)}
                          onChange={() => toggleSelect(org.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{org.name}</div>
                          <div className="text-sm text-slate-500">Slug: {org.slug}</div>
                          <div className="text-xs text-slate-400">Created: {new Date(org.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSingle(org.id, org.name)}
                        className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Organizations;