import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { apiKeysAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

const APIKeys = () => {
  const { isConnected } = useDashboardStream();
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiKeysAPI.list();
      setKeys(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "API Keys | Web3 Intel Platform";
    load();
  }, []);

  const createKey = async () => {
    const result = await apiKeysAPI.create({ name });
    setGeneratedKey(result.api_key);
    setName("");
    await load();
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar connected={isConnected} title="API Keys" subtitle="Manage secure access for integrations and enterprise use." />
          <SettingsHeader
            title="API Access"
            subtitle="Generate and manage API keys for external systems, clients, or internal integrations."
          />

          <SectionCard title="Create API Key" subtitle="This key will only be shown once. Store it securely.">
            <div className="flex flex-col gap-4 md:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3"
                placeholder="e.g. Internal analytics integration"
              />
              <button
                onClick={createKey}
                className="rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white"
              >
                Generate Key
              </button>
            </div>

            {generatedKey ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 text-sm font-semibold text-amber-800">
                  Store this key securely. It will not be shown again.
                </div>
                <code className="break-all text-sm text-amber-900">{generatedKey}</code>
              </div>
            ) : null}
          </SectionCard>

          <div className="mt-8">
            <SectionCard title="Existing API Keys" subtitle="Review prefixes and usage status.">
              {loading ? (
                <div className="text-slate-500">Loading API keys...</div>
              ) : keys.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
                  No API keys created yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {keys.map((key) => (
                    <div key={key.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="font-bold text-slate-900">{key.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        Prefix: {key.key_prefix} · Status: {key.is_active ? "Active" : "Disabled"}
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

export default APIKeys;