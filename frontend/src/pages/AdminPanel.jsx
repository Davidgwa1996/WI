import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.email === "davidmaina3713413@gmail.com") {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const data = await adminAPI.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Delete user ${userEmail}? This will also delete their workspace.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setSuccess(`User ${userEmail} deleted`);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMyAccount = async () => {
    if (!window.confirm("Delete your own account and workspace? This cannot be undone.")) return;
    try {
      await adminAPI.deleteMyAccount();
      localStorage.removeItem("w3i_token");
      window.location.href = "/login";
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.email !== "davidmaina3713413@gmail.com") {
    return <div className="p-8 text-center">Access denied. Super admin only.</div>;
  }

  return (
    <div className="min-h-screen bg-dark-bg xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar title="Admin Panel" subtitle="Manage users, workspaces, invites" />
          <SectionCard title="All Users" subtitle="Delete any user account">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-500 mb-4">{success}</div>}
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex justify-between items-center border-b border-slate-700 py-2">
                    <div>
                      <div>{u.email}</div>
                      <div className="text-sm text-slate-400">Role: {u.role}</div>
                    </div>
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      className="bg-red-600 px-3 py-1 rounded text-white text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <hr className="my-6 border-slate-700" />
            <button onClick={deleteMyAccount} className="bg-red-700 px-4 py-2 rounded text-white">
              Delete My Own Account & Workspace
            </button>
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default AdminPanel;