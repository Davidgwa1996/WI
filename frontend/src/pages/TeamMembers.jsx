import React, { useEffect, useState } from "react";
import { FiMail, FiShield, FiUser, FiUsers } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { usersAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

const roleStyles = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-cyan-100 text-cyan-700",
  analyst: "bg-emerald-100 text-emerald-700",
  viewer: "bg-slate-100 text-slate-700",
};

const TeamMembers = () => {
  const { isConnected } = useDashboardStream();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Team Members | Web3 Intel Platform";
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Team Members"
            subtitle="View workspace members, roles, and access levels."
          />

          <SettingsHeader
            title="Team Members"
            subtitle="Manage your workspace membership structure and understand who has access to what."
          />

          <SectionCard
            title="Organization members"
            subtitle="Current users inside your intelligence workspace."
          >
            {loading ? (
              <div className="text-slate-500">Loading team members...</div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                No users found in this workspace yet.
              </div>
            ) : (
              <div className="grid gap-4">
                {users.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-cyan-500/20">
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
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                          User ID
                        </div>
                        <div className="font-semibold text-slate-900">{member.id}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                          Verified
                        </div>
                        <div className="font-semibold text-slate-900">
                          {member.is_verified ? "Yes" : "No"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                          Access Level
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <FiShield className="h-4 w-4 text-cyan-600" />
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                    text: "Full workspace control including billing, API keys, invites, and audit oversight.",
                  },
                  {
                    title: "Admin",
                    text: "Can manage team setup, workspace settings, and most operational tasks.",
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
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
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