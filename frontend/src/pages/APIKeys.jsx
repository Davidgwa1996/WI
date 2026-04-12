import React, { useEffect, useMemo, useState } from "react";
import {
  FiKey,
  FiPlus,
  FiCopy,
  FiRefreshCw,
  FiShield,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiSlash,
} from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import { apiKeysAPI } from "../services/api";

const APIKeys = () => {
  const { isConnected } = useDashboardStream();
  const { user } = useAuth();

  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role = String(user?.role || "").toLowerCase();
  const canManageApiKeys = role === "owner" || role === "admin";

  const totalKeys = useMemo(() => keys.length, [keys]);
  const activeKeys = useMemo(
    () => keys.filter((item) => item.is_active !== false).length,
    [keys]
  );
  const revokedKeys = useMemo(
    () => keys.filter((item) => item.is_active === false).length,
    [keys]
  );

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await apiKeysAPI.list();
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[APIKeys] Failed to load keys:", err);
      setKeys([]);
      setError(err?.message || "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Web3 Intel Platform | API Keys";
    loadKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();

    if (!canManageApiKeys) {
      setError("Only owner or admin can create API keys.");
      return;
    }

    const name = newKeyName.trim();
    if (!name) {
      setError("Please enter a key name.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      setNewlyCreatedKey("");

      const result = await apiKeysAPI.create({ name });

      setSuccess("API key created successfully.");
      setNewlyCreatedKey(result?.api_key || "");
      setNewKeyName("");

      await loadKeys();
    } catch (err) {
      console.error("[APIKeys] Failed to create key:", err);
      setError(err?.message || "Failed to create API key.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId, keyName) => {
    if (!canManageApiKeys) {
      setError("Only owner or admin can revoke API keys.");
      return;
    }

    const confirmed = window.confirm(
      `Revoke API key "${keyName}"? It will remain in records but will no longer work.`
    );
    if (!confirmed) return;

    try {
      setRevokingId(keyId);
      setError("");
      setSuccess("");

      await apiKeysAPI.revoke(keyId);

      setSuccess(`API key "${keyName}" revoked successfully.`);
      await loadKeys();
    } catch (err) {
      console.error("[APIKeys] Failed to revoke key:", err);
      setError(err?.message || "Failed to revoke API key.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async (value, label = "Value") => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setSuccess(`${label} copied to clipboard.`);
      setError("");
    } catch (err) {
      console.error("[APIKeys] Copy failed:", err);
      setError(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Never";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="app-page xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            onRefresh={loadKeys}
            loading={loading}
            title="API Keys"
            subtitle="Create, review, and revoke secure workspace API access keys."
          />

          <SettingsHeader
            title="API Key Management"
            subtitle="Secure machine-to-machine access for integrations, backend services, and automation."
          />

          {!canManageApiKeys ? (
            <SectionCard
              title="Restricted Access"
              subtitle="API keys are managed only by owner and admin accounts."
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="mt-1 h-5 w-5" />
                  <div>
                    <div className="font-bold">Permission required</div>
                    <p className="mt-2 text-sm leading-7">
                      Your current role does not allow API key management.
                      Contact the workspace owner or an admin if you need service access.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="content-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Total Keys
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {loading ? "—" : totalKeys}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <FiKey className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Active Keys
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {loading ? "—" : activeKeys}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <FiCheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="content-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Revoked Keys
                  </div>
                  <div className="mt-2 text-3xl font-black text-slate-900">
                    {loading ? "—" : revokedKeys}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                  <FiSlash className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {newlyCreatedKey ? (
            <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    Newly created secret key
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Copy and store this now. For security reasons, the full secret
                    should only be shown once.
                  </p>
                  <div className="mt-3 break-all rounded-xl border border-cyan-200 bg-white px-4 py-3 font-mono text-sm text-slate-900">
                    {newlyCreatedKey}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopy(newlyCreatedKey, "API key")}
                    className="btn-light"
                  >
                    <FiCopy className="h-4 w-4" />
                    Copy Key
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewlyCreatedKey("")}
                    className="btn-light"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
            <SectionCard
              title="Create API Key"
              subtitle="Generate a new secure key for backend services or automation."
            >
              <form onSubmit={handleCreateKey} className="space-y-5">
                <div className="form-group">
                  <label htmlFor="api-key-name">Key Name</label>
                  <input
                    id="api-key-name"
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Example: Production Integration"
                    disabled={!canManageApiKeys || creating}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Use clear names like Production API, Reporting Service, or
                  Analyst Automation so you can identify each key later.
                </div>

                <button
                  type="submit"
                  disabled={!canManageApiKeys || creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-60"
                >
                  <FiPlus className="h-4 w-4" />
                  {creating ? "Creating..." : "Create API Key"}
                </button>
              </form>
            </SectionCard>

            <SectionCard
              title="Existing API Keys"
              subtitle="Review active and revoked keys, visible prefixes, and recent usage."
            >
              <div className="page-actions">
                <button
                  type="button"
                  onClick={loadKeys}
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
                  <span className="ml-3 text-slate-600">Loading API keys...</span>
                </div>
              ) : keys.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <FiKey className="h-7 w-7 text-slate-500" />
                  </div>
                  <div className="mt-4 text-lg font-bold text-slate-900">
                    No API keys yet
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Create your first key to enable secure service integrations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {keys.map((item) => {
                    const isActive = item.is_active !== false;

                    return (
                      <div key={item.id} className="content-card p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-lg font-bold text-slate-900">
                                {item.name}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {isActive ? "Active" : "Revoked"}
                              </span>
                            </div>

                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                              <div className="app-panel-soft p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Prefix
                                </div>
                                <div className="mt-2 break-all font-mono text-sm font-bold text-slate-900">
                                  {item.key_prefix || "-"}
                                </div>
                              </div>

                              <div className="app-panel-soft p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Created
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {formatDate(item.created_at)}
                                </div>
                              </div>

                              <div className="app-panel-soft p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  <FiClock className="h-3.5 w-3.5" />
                                  Last Used
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {formatDate(item.last_used_at)}
                                </div>
                              </div>

                              <div className="app-panel-soft p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  <FiShield className="h-3.5 w-3.5" />
                                  Status
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">
                                  {isActive ? "Usable" : "Disabled"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {item.key_prefix ? (
                              <button
                                type="button"
                                onClick={() => handleCopy(item.key_prefix, "Key prefix")}
                                className="btn-light"
                              >
                                <FiCopy className="h-4 w-4" />
                                Copy Prefix
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleRevokeKey(item.id, item.name)}
                              disabled={revokingId === item.id || !isActive}
                              className="btn-danger"
                            >
                              <FiSlash className="h-4 w-4" />
                              {revokingId === item.id ? "Revoking..." : "Revoke"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default APIKeys;