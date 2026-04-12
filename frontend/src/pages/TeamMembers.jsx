import React, { useEffect, useState } from "react";
import {
  FiMail,
  FiShield,
  FiUser,
  FiUsers,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { usersAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";

const roleStyles = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-cyan-100 text-cyan-700",
  analyst: "bg-emerald-100 text-emerald-700",
  viewer: "bg-slate-100 text-slate-700",
  member: "bg-slate-100 text-slate-700",
};

const editableRoles = ["owner", "admin", "analyst", "viewer"];

const TeamMembers = () => {
  const { isConnected } = useDashboardStream();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageMembers =
    currentUser?.role === "owner" || currentUser?.role === "admin";

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await usersAPI.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[TeamMembers] Failed to load users:", err);
      setUsers([]);
      setError(err?.message || "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Team Members | Web3 Intel Platform";
    loadUsers();
  }, []);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      setSavingRoleId(memberId);
      setError("");
      setSuccess("");

      await usersAPI.updateRole(memberId, newRole);
      setSuccess(`Role updated to ${newRole}.`);
      await loadUsers();
    } catch (err) {
      console.error("[TeamMembers] Role update failed:", err);
      setError(err?.message || "Failed to update role.");
    } finally {
      setSavingRoleId(null);
    }
  };

  const handleDeleteUser = async (member) => {
    const isSelf = currentUser?.id === member.id;

    const confirmed = window.confirm(
      isSelf
        ? "This is your own account. Use the Account page to delete yourself."
        : `Delete user "${member.full_name}" (${member.email})?`
    );

    if (!confirmed || isSelf) return;

    try {
      setDeletingUserId(member.id);
      setError("");
      setSuccess("");

      await usersAPI.deleteUser(member.id);
      setSuccess(`User "${member.full_name}" deleted successfully.`);
      await loadUsers();
    } catch (err) {
      console.error("[TeamMembers] Delete failed:", err);
      setError(err?.message || "Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="app-page xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Team Members"
            subtitle="View workspace members, roles, and access levels."
          />

          <SettingsHeader
            title="Team Members"
            subtitle="Manage your workspace membership structure and control who can access what."
          />

          <SectionCard
            title="Organization members"
            subtitle="Current users inside your intelligence workspace."
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
                onClick={loadUsers}
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
                <span className="ml-3 text-slate-600">Loading team members...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="app-panel p-6 text-slate-500">
                No users found in this workspace yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((member) => {
                  const isSelf = currentUser?.id === member.id;
                  const canDelete =
                    canManageMembers &&
                    !isSelf &&
                    !(currentUser?.role === "admin" && member.role === "owner");

                  const canEditRole =
                    canManageMembers &&
                    !(currentUser?.role === "admin" && member.role === "owner");

                  return (
                    <div
                      key={member.id}
                      className="app-panel p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg">
                            <FiUser className="h-6 w-6" />
                          </div>

                          <div>
                            <div className="text-lg font-bold text-slate-900">
                              {member.full_name}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                              <FiMail className="h-4 w-4" />
                              {member.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              roleStyles[member.role] || roleStyles.viewer
                            }`}
                          >
                            {member.role}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              member.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="app-panel-soft p-4">
                          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                            User ID
                          </div>
                          <div className="font-semibold text-slate-900">{member.id}</div>
                        </div>

                        <div className="app-panel-soft p-4">
                          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                            Verified
                          </div>
                          <div className="font-semibold text-slate-900">
                            {member.is_verified ? "Yes" : "No"}
                          </div>
                        </div>

                        <div className="app-panel-soft p-4">
                          <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                            Access Level
                          </div>
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <FiShield className="h-4 w-4 text-cyan-600" />
                            {member.role}
                          </div>
                        </div>
                      </div>

                      {canManageMembers ? (
                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <label className="text-sm font-medium text-slate-600">
                              Change role
                            </label>

                            <select
                              value={member.role}
                              disabled={!canEditRole || savingRoleId === member.id}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value)
                              }
                              className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-500"
                            >
                              {editableRoles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {isSelf ? (
                              <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                                Manage your own deletion from Account page
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(member)}
                                disabled={!canDelete || deletingUserId === member.id}
                                className="btn-danger"
                              >
                                <FiTrash2 className="h-4 w-4" />
                                {deletingUserId === member.id ? "Deleting..." : "Delete User"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <div className="mt-8">
            <SectionCard
              title="Team structure guidance"
              subtitle="Recommended way to assign enterprise roles."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: "Owner",
                    text: "Full workspace control including billing, API keys, invites, audit logs, and team ownership.",
                  },
                  {
                    title: "Admin",
                    text: "Can manage team setup, workspace settings, and most operational actions.",
                  },
                  {
                    title: "Analyst",
                    text: "Can review intelligence, use project workflows, and contribute to research activity.",
                  },
                  {
                    title: "Viewer",
                    text: "Read-only access for stakeholders, clients, executives, or observers.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="app-panel-soft p-5"
                  >
                    <div className="mb-2 flex items-center gap-2 text-slate-900">
                      <FiUsers className="h-5 w-5 text-cyan-600" />
                      <span className="font-bold">{item.title}</span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default TeamMembers;