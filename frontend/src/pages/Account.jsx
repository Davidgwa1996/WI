import React from "react";
import { FiMail, FiShield, FiUser, FiCheckCircle } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";

const Account = () => {
  const { isConnected } = useDashboardStream();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
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
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-brand-gradient text-white shadow-lg shadow-cyan-500/20">
                  <FiUser className="h-10 w-10" />
                </div>

                <div className="mt-5 text-center">
                  <div className="text-2xl font-black text-slate-900">
                    {user?.full_name || "Workspace User"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {user?.email || "-"}
                  </div>
                </div>

                <div className="mt-5 flex justify-center">
                  <span className="rounded-full bg-cyan-100 px-4 py-1.5 text-xs font-semibold text-cyan-700">
                    {user?.role || "viewer"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiUser className="h-4 w-4" />
                    Full Name
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.full_name || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiMail className="h-4 w-4" />
                    Email
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.email || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiShield className="h-4 w-4" />
                    Role
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.role || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiCheckCircle className="h-4 w-4" />
                    Verification
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.is_verified ? "Verified" : "Unverified"}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Account;