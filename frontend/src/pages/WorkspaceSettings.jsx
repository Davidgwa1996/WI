import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import ErrorState from "../components/ErrorState";
import { workspaceAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

const WorkspaceSettings = () => {
  const { isConnected } = useDashboardStream();
  const [form, setForm] = useState({
    default_alerts_enabled: true,
    weekly_report_enabled: false,
    branding_primary_color: "#06b6d4",
    custom_domain: "",
    report_logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await workspaceAPI.getSettings();
      setForm({
        default_alerts_enabled: data.default_alerts_enabled,
        weekly_report_enabled: data.weekly_report_enabled,
        branding_primary_color: data.branding_primary_color || "#06b6d4",
        custom_domain: data.custom_domain || "",
        report_logo_url: data.report_logo_url || "",
      });
    } catch (err) {
      setError(err?.message || "Failed to load workspace settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Workspace Settings | Web3 Intel Platform";
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await workspaceAPI.updateSettings(form);
      setSuccess("Workspace settings saved successfully.");
    } catch (err) {
      setError(err?.message || "Could not save workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 xl:flex">
        <Sidebar />
        <div className="flex-1">
          <DashboardShell>
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="loading-spinner" />
            </div>
          </DashboardShell>
        </div>
      </div>
    );
  }

  if (error && !saving && !success && !form) {
    return <ErrorState error={error} onRetry={load} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar connected={isConnected} title="Workspace Settings" subtitle="Manage branding, reporting, and workspace behavior." />
          <SettingsHeader
            title="Workspace Settings"
            subtitle="Control defaults, reporting behavior, and enterprise presentation settings."
          />

          <SectionCard
            title="Branding & reporting"
            subtitle="Configure the visual identity and report output for your organization."
            actions={
              <button
                onClick={save}
                disabled={saving}
                className="rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Primary Brand Color</label>
                <input
                  type="text"
                  value={form.branding_primary_color}
                  onChange={(e) => setForm((p) => ({ ...p, branding_primary_color: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Custom Domain</label>
                <input
                  value={form.custom_domain}
                  onChange={(e) => setForm((p) => ({ ...p, custom_domain: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                  placeholder="intel.yourcompany.com"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Report Logo URL</label>
              <input
                value={form.report_logo_url}
                onChange={(e) => setForm((p) => ({ ...p, report_logo_url: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="https://..."
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.default_alerts_enabled}
                  onChange={(e) => setForm((p) => ({ ...p, default_alerts_enabled: e.target.checked }))}
                />
                <span className="text-sm font-medium text-slate-700">Enable default alerts</span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={form.weekly_report_enabled}
                  onChange={(e) => setForm((p) => ({ ...p, weekly_report_enabled: e.target.checked }))}
                />
                <span className="text-sm font-medium text-slate-700">Enable weekly reports</span>
              </label>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default WorkspaceSettings;