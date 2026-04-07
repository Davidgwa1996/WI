import React, { useEffect, useState } from "react";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import { useDashboardStream } from "../hooks/useWebSocket";
import api from "../services/api";

const roles = ["owner", "admin", "analyst", "viewer"];

const AdminRoles = () => {
  const { isConnected } = useDashboardStream();
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const data = await api.users.list();
    setUsers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (userId, role) => {
    await api.users.updateRole(userId, role);
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Admin Role Management"
            subtitle="Control enterprise team permissions."
          />

          <div className="glass-card p-6">
            <h2 className="mb-6 text-2xl font-black text-slate-900">User Roles</h2>

            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900">{user.full_name}</div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                  </div>

                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-cyan-500"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default AdminRoles;