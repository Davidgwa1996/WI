import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { auditAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

const AuditLogs = () => {
  const { isConnected } = useDashboardStream();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    document.title = "Audit Logs | Web3 Intel Platform";
    auditAPI.list().then((data) => setLogs(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar connected={isConnected} title="Audit Logs" subtitle="Track critical workspace actions and security-relevant events." />
          <SettingsHeader
            title="Audit Logs"
            subtitle="View recent organization actions for traceability, governance, and compliance."
          />

          <SectionCard title="Recent activity" subtitle="Latest workspace events and administrative actions.">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                No audit logs available yet.
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{log.action}</div>
                        <div className="mt-1 text-sm text-slate-500">{log.message}</div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
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