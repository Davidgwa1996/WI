import React, { useState } from "react";
import { FiMail, FiShield, FiUser, FiCheckCircle, FiTrash2 } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";

const Account = () => {
  const { isConnected } = useDashboardStream();
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "⚠️ WARNING: This will permanently delete your account and all associated workspaces, projects, invites, and data. This action cannot be undone. Are you absolutely sure?"
    );
    if (!confirm) return;

    try {
      setDeleting(true);
      setError("");
      await adminAPI.deleteMyAccount();
      setSuccess("Your account and workspace have been permanently deleted.");
      // Log out after a short delay
      setTimeout(() => {
        logout();
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      console.error("Account deletion error:", err);
      setError(err.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Account"
            subtitle="View your profile, role, and workspace identity."
          />

          <SettingsHeader
            title="Account & Identity"
            subtitle="Your current user identity and workspace-level access details."
          />

          <SectionCard
            title="Profile"
            subtitle="Core identity details for your current signed-in account."
          >
            <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
              <div className="glass-card p-6">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-r from-brand-500 to-teal-500 text-white shadow-lg shadow-brand-500/20">
                  <FiUser className="h-10 w-10" />
                </div>

                <div className="mt-5 text-center">
                  <div className="text-2xl font-black text-dark-text">
                    {user?.full_name || "Workspace User"}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">
                    {user?.email || "-"}
                  </div>
                </div>

                <div className="mt-5 flex justify-center">
                  <span className="rounded-full bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400">
                    {user?.role || "viewer"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-dark-panel p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <FiUser className="h-4 w-4" />
                    Full Name
                  </div>
                  <div className="text-lg font-bold text-dark-text">
                    {user?.full_name || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-dark-panel p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <FiMail className="h-4 w-4" />
                    Email
                  </div>
                  <div className="text-lg font-bold text-dark-text">
                    {user?.email || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-dark-panel p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <FiShield className="h-4 w-4" />
                    Role
                  </div>
                  <div className="text-lg font-bold text-dark-text">
                    {user?.role || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-dark-panel p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    <FiCheckCircle className="h-4 w-4" />
                    Verification
                  </div>
                  <div className="text-lg font-bold text-dark-text">
                    {user?.is_verified ? "Verified" : "Unverified"}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Danger Zone – Delete Account */}
          <SectionCard
            title="Danger Zone"
            subtitle="Permanently delete your account and all associated data."
            className="mt-8 border-red-500/30"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-red-400">Delete account</div>
                <div className="text-sm text-slate-400">
                  Once deleted, all your workspaces, projects, invites, and personal data will be permanently removed. This action cannot be undone.
                </div>
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !user}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <FiTrash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete My Account & Workspace"}
              </button>
            </div>
            {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
            {success && <div className="mt-4 text-sm text-emerald-400">{success}</div>}
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Account;