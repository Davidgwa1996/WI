import React, { useEffect, useState } from "react";
import { FiPlus, FiStar } from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Watchlists = () => {
  const { isConnected } = useDashboardStream();
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [watchlists, setWatchlists] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadWatchlists = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.watchlists.list();
      setWatchlists(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Watchlists] Load failed:", err);
      setError(err?.message || "Failed to load watchlists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Watchlists | Web3 Intel Platform";
    loadWatchlists();
  }, []);

  const createWatchlist = async () => {
    if (!isLoggedIn) {
      setError("You must be logged in to create watchlists.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a watchlist name.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      await api.watchlists.create({
        name: name.trim(),
        description: description.trim(),
        is_default: false,
      });
      setSuccess(`Watchlist "${name.trim()}" created.`);
      setName("");
      setDescription("");
      await loadWatchlists();
    } catch (err) {
      console.error("[Watchlists] Create failed:", err);
      setError(err?.message || "Failed to create watchlist.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Watchlists"
            subtitle="Persistent strategic monitoring lists."
          />

          <div className="mb-8 glass-card p-6">
            <h2 className="mb-4 text-2xl font-black text-dark-text">Create Watchlist</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Watchlist name"
                disabled={!isLoggedIn || creating}
                className="rounded-2xl border border-slate-700 bg-dark-panel px-4 py-3 text-dark-text placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                disabled={!isLoggedIn || creating}
                className="rounded-2xl border border-slate-700 bg-dark-panel px-4 py-3 text-dark-text placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={createWatchlist}
                disabled={!isLoggedIn || creating || !name.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              >
                <FiPlus className="h-4 w-4" />
                {creating ? "Creating..." : "Create"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="glass-card p-6 text-center text-slate-400">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
                <p className="mt-2">Loading watchlists...</p>
              </div>
            ) : watchlists.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-400">
                <FiStar className="mx-auto h-12 w-12 text-slate-600" />
                <p className="mt-2">No watchlists yet.</p>
                <p className="mt-1 text-sm">Create your first watchlist above.</p>
              </div>
            ) : (
              watchlists.map((item) => (
                <div key={item.id} className="glass-card p-6 transition-all hover:border-cyan-500/30 hover:shadow-glow">
                  <div className="mb-2 flex items-center gap-2">
                    <FiStar className="h-5 w-5 text-amber-500" />
                    <h3 className="text-xl font-bold text-dark-text">{item.name}</h3>
                  </div>
                  <p className="text-slate-300">{item.description || "No description."}</p>
                  <div className="mt-4 text-sm text-slate-400">
                    Created: {new Date(item.created_at).toLocaleDateString()}
                  </div>
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