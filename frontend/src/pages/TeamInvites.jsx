import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { invitesAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

const TeamInvites = () => {
  const { isConnected } = useDashboardStream();
  const [invites, setInvites] = useState([]);
  const [form, setForm] = useState({ email: "", role: "viewer" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await invitesAPI.list();
      setInvites(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load invites.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Team Invites | Web3 Intel Platform";
    load();
  }, []);

  const createInvite = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const invite = await invitesAPI.create(form);
      setSuccess(`Invite created for ${invite.email}`);
      setForm({ email: "", role: "viewer" });
      await load();
    } catch (err) {
      setError(err?.message || "Could not create invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar connected={isConnected} title="Team Invites" subtitle="Invite teammates into your secure workspace." />
          <SettingsHeader
            title="Team Management"
            subtitle="Invite analysts, admins, and viewers into your organization."
          />

          <SectionCard title="Create Invite" subtitle="Grant secure access to new workspace members.">
            <form onSubmit={createInvite} className="grid gap-5 md:grid-cols-[1.5fr_0.8fr_auto]">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="colleague@company.com"
                required
              />

              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="rounded-2xl border border-slate-300 px-4 py-3"
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white disabled:opacity-70"
              >
                {submitting ? "Sending..." : "Invite"}
              </button>
            </form>

            {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
            {success ? <div className="mt-4 text-sm text-emerald-600">{success}</div> : null}
          </SectionCard>

          <div className="mt-8">
            <SectionCard title="Pending & historical invites" subtitle="Track invite status and role assignment.">
              {loading ? (
                <div className="text-slate-500">Loading invites...</div>
              ) : invites.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                  No invites created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{invite.email}</div>
                          <div className="text-sm text-slate-500">
                            Role: {invite.role} · Expires: {new Date(invite.expires_at).toLocaleString()}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            invite.is_accepted
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {invite.is_accepted ? "Accepted" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default TeamInvites;