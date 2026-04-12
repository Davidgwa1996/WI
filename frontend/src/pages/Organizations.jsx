import React, { useEffect, useState, useCallback } from "react";
import {
  FiArrowRight,
  FiLogIn,
  FiShield,
  FiEye,
  FiBarChart2,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiLock,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import { Link } from "react-router-dom";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import { orgAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const OWNER_EMAIL = "davidmaina@gmail.com";

const RoleCard = ({ icon: Icon, title, text, badge, accent = "cyan" }) => {
  const accentMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const accentClass = accentMap[accent] || accentMap.cyan;

  return (
    <div className="content-card p-6">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClass}`}
      >
        <Icon className="h-6 w-6" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {badge}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
};

const Organizations = () => {
  const { user, isAuthenticated } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const email = String(user?.email || "").toLowerCase();

  const isOwner = role === "owner";
  const isOwnerEmail = email === OWNER_EMAIL;
  const canSeeManagement = isAuthenticated && isOwner && isOwnerEmail;

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadOrgs = useCallback(async () => {
    if (!canSeeManagement) return;

    try {
      setLoading(true);
      setError("");
      const data = await orgAPI.listAll();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Organizations] Failed to load:", err);
      setOrganizations([]);
      setError(err?.message || "Failed to load organizations.");
    } finally {
      setLoading(false);
    }
  }, [canSeeManagement]);

  useEffect(() => {
    document.title = "Workspace Access | Web3 Intel Platform";
    loadOrgs();
  }, [loadOrgs]);

  const deleteOrg = async (orgId, orgName) => {
    const confirmed = window.confirm(
      `Delete organization "${orgName}" permanently? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingOrgId(orgId);
      setError("");
      setSuccess("");
      await orgAPI.delete(orgId);
      setSuccess(`Organization "${orgName}" deleted successfully.`);
      await loadOrgs();
    } catch (err) {
      console.error("[Organizations] Delete failed:", err);
      setError(err?.message || "Failed to delete organization.");
    } finally {
      setDeletingOrgId(null);
    }
  };

  return (
    <div className="app-page xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            title="Workspace Access"
            subtitle="Create a workspace, understand role access, or sign in with an approved account."
          />

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <SectionCard
              title="Create Workspace"
              subtitle="Owner workspace creation is restricted to the platform owner email."
            >
              <div className="content-card p-6">
                <div className="flex items-start gap-3">
                  <FaCrown className="mt-1 h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Owner restriction
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Only <strong>{OWNER_EMAIL}</strong> can create and hold the
                      direct owner workspace role. Other users should join through
                      owner invitation and approval.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <div className="flex items-start gap-3">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 text-cyan-700" />
                    <div>
                      <div className="font-semibold text-cyan-900">
                        Correct platform flow
                      </div>
                      <p className="mt-1 text-sm leading-6 text-cyan-800">
                        Use <strong>Create Workspace</strong> if you are the owner.
                        Use <strong>Sign In</strong> if you already have an approved account.
                        Admins, analysts, and viewers should not create owner workspaces.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/register" className="btn-primary">
                    Create Workspace
                    <FiArrowRight className="h-4 w-4" />
                  </Link>

                  <Link to="/login" className="btn-light">
                    <FiLogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Role Access"
              subtitle="Understand how each role should enter and use the platform."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <RoleCard
                  icon={FaCrown}
                  title="Owner"
                  badge="Restricted"
                  accent="amber"
                  text={`Only ${OWNER_EMAIL} can create and operate the owner workspace directly. The owner has full control, including organizations, audit visibility, role structure, and deletions.`}
                />

                <RoleCard
                  icon={FiShield}
                  title="Admin"
                  accent="cyan"
                  text="Admins can manage analysts and viewers, use protected services, and support daily workspace operations. Admins cannot manage or delete the owner."
                />

                <RoleCard
                  icon={FiBarChart2}
                  title="Analyst"
                  accent="emerald"
                  text="Analysts can work with intelligence, reports, watchlists, and research workflows after approval by the workspace owner or admin."
                />

                <RoleCard
                  icon={FiEye}
                  title="Viewer"
                  accent="slate"
                  text="Viewers have read-focused access after approval or invite acceptance. This is ideal for stakeholders and review-only users."
                />
              </div>
            </SectionCard>
          </div>

          <div className="mt-8">
            <SectionCard
              title="Approval Rules"
              subtitle="Protected access follows owner-controlled approval."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="content-card p-5">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FiLock className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Public access</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Visitors can explore Home, Dashboard, Projects, Competitors,
                    Search AI, and AI Agent without protected workspace control.
                  </p>
                </div>

                <div className="content-card p-5">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <FiShield className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Approved roles</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Admin, analyst, and viewer accounts should enter through invite
                    and approval, then sign in to use their permitted services.
                  </p>
                </div>

                <div className="content-card p-5">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                    <FaCrown className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Owner authority</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    The owner can approve access, manage organizations, view audit
                    logs, and control the full platform structure.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          {canSeeManagement ? (
            <div className="mt-8">
              <SectionCard
                title="Organization Management"
                subtitle="Owner-only access to organization records and deletion control."
              >
                {error ? (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
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
                    onClick={loadOrgs}
                    disabled={loading}
                    className="action-btn refresh"
                  >
                    <FiRefreshCw className={loading ? "animate-spin" : ""} />
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="spinner-sm" />
                    <span className="ml-3 text-slate-600">
                      Loading organizations...
                    </span>
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="content-card p-6 text-slate-500">
                    No organizations found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className="content-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{org.name}</h3>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {org.plan}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
                            <span>Slug: {org.slug}</span>
                            <span>•</span>
                            <span>ID: {org.id}</span>
                            {org.created_at ? (
                              <>
                                <span>•</span>
                                <span>
                                  Created: {new Date(org.created_at).toLocaleDateString()}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteOrg(org.id, org.name)}
                          disabled={deletingOrgId === org.id}
                          className="btn-danger"
                        >
                          <FiTrash2 className="h-4 w-4" />
                          {deletingOrgId === org.id
                            ? "Deleting..."
                            : "Delete Organization"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          ) : null}
        </DashboardShell>
      </div>
    </div>
  );
};

export default Organizations;