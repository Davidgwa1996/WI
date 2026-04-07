import React, { useEffect, useState } from "react";
import { FiPlus, FiStar } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import { useDashboardStream } from "../hooks/useWebSocket";
import api from "../services/api";

const Watchlists = () => {
  const { isConnected } = useDashboardStream();
  const [watchlists, setWatchlists] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWatchlists = async () => {
    try {
      setLoading(true);
      const data = await api.watchlists.list();
      setWatchlists(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlists();
  }, []);

  const createWatchlist = async () => {
    if (!name.trim()) return;
    await api.watchlists.create({
      name: name.trim(),
      description: description.trim(),
      is_default: false,
    });
    setName("");
    setDescription("");
    loadWatchlists();
  };

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Watchlists"
            subtitle="Persistent strategic monitoring lists."
          />

          <div className="mb-8 glass-card p-6">
            <h2 className="mb-4 text-2xl font-black text-slate-900">Create Watchlist</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Watchlist name"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={createWatchlist}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white"
              >
                <FiPlus className="h-4 w-4" />
                Create
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="glass-card p-6 text-slate-500">Loading watchlists...</div>
            ) : watchlists.length === 0 ? (
              <div className="glass-card p-6 text-slate-500">No watchlists yet.</div>
            ) : (
              watchlists.map((item) => (
                <div key={item.id} className="glass-card p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <FiStar className="h-5 w-5 text-amber-500" />
                    <h3 className="text-xl font-bold text-slate-900">{item.name}</h3>
                  </div>
                  <p className="text-slate-600">{item.description || "No description."}</p>
                </div>
              ))
            )}
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Watchlists;