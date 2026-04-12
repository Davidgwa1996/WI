import React, { useEffect, useState } from "react";
import {
  FiShield,
  FiClock,
  FiActivity,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { auditAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";

const AuditLogs = () => {
  const { isConnected } = useDashboardStream();
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const role = String(user?.role || "").toLowerCase();
  const isOwner = role === "owner";

  const loadLogs = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      const data = await auditAPI.list();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[AuditLogs] Failed to load logs:", err);
      setLogs([]);
      setError(err?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    document.title = "Audit Logs | Web3 Intel Platform";
    if (isOwner) {
      loadLogs();
    } else {
      setLoading(false);
    }
  }, [isOwner]);

  if (!isOwner) {
    return (
      <div className="app-page xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1 app-content">
          <DashboardShell>
            <Topbar
              connected={isConnected}
              title="Audit Logs"
              subtitle="Owner-only traceability and security event review."
            />

            <SettingsHeader
              title="Audit Logs"
              subtitle="This section is restricted to the workspace owner."
            />

            <SectionCard
              title="Restricted Access"
              subtitle="Only the owner can access security and governance logs."
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="mt-1 h-5 w-5" />
                  <div>
                    <div className="font-bold">Owner permission required</div>
                    <p className="mt-2 text-sm leading-7">
                      Audit logs are visible only to the owner account. Admins,
                      analysts, and viewers cannot access this section.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </DashboardShell>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Audit Logs"
            subtitle="Track critical workspace actions, governance activity, and security-relevant events."
          />

          <SettingsHeader
            title="Audit Logs"
            subtitle="Owner-only visibility into recent organization actions for traceability, compliance, and platform oversight."
          />

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="content-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Total Events
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {loading ? "—" : logs.length}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <FiActivity className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Access Level
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    Owner
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <FiShield className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Log Window
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    100
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <FiClock className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <SectionCard
            title="Recent Activity"
            subtitle="Latest workspace events and administrative actions."
            actions={
              <button
                type="button"
                onClick={() => loadLogs({ silent: true })}
                disabled={refreshing}
                className="action-btn refresh"
              >
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            }
          >
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="spinner-sm" />
                <span className="ml-3 text-slate-600">Loading audit logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <FiShield className="h-7 w-7 text-slate-500" />
                </div>
                <div className="mt-4 text-lg font-bold text-slate-900">
                  No audit logs available yet
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Security and administrative actions will appear here as the
                  workspace is used.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="content-card p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">
                            {log.action || "Unknown action"}
                          </h3>

                          {log.target_type ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {log.target_type}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {log.message || "No message provided."}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                          <div className="app-panel-soft p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Log ID
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">
                              {log.id}
                            </div>
                          </div>

                          <div className="app-panel-soft p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Actor User ID
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">
                              {log.actor_user_id ?? "-"}
                            </div>
                          </div>

                          <div className="app-panel-soft p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Target ID
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900 break-all">
                              {log.target_id ?? "-"}
                            </div>
                          </div>

                          <div className="app-panel-soft p-4">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              <FiClock className="h-3.5 w-3.5" />
                              Timestamp
                            </div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default AuditLogs;