import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchCompetitors } from "../services/api";
import { useCompetitorUpdates, useDashboardStream } from "../hooks/useWebSocket";
import {
  FiUsers,
  FiTrendingUp,
  FiActivity,
  FiRefreshCw,
  FiBarChart2,
  FiAlertCircle,
} from "react-icons/fi";

import DashboardShell from "../components/dashboard/DashboardShell";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import KpiCard from "../components/dashboard/KpiCard";
import ErrorState from "../components/ErrorState";

const Competitors = () => {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { competitors: realtimeCompetitors } = useCompetitorUpdates();
  const { isConnected } = useDashboardStream();

  const loadCompetitors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchCompetitors();
      setCompetitors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Competitors] Load failed:", err);
      setError(
        err?.message || "Competitors data is not available right now."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Web3 Intel Platform | Competitors";
    loadCompetitors();
  }, [loadCompetitors]);

  useEffect(() => {
    if (!realtimeCompetitors?.length) return;

    setCompetitors((prev) => {
      const updated = [...prev];

      realtimeCompetitors.forEach((incoming) => {
        const incomingId = incoming?.id;
        const index = updated.findIndex((item) => item.id === incomingId);

        if (index >= 0) {
          updated[index] = { ...updated[index], ...incoming };
        } else {
          updated.unshift(incoming);
        }
      });

      return updated;
    });
  }, [realtimeCompetitors]);

  const handleRetry = () => {
    loadCompetitors();
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await loadCompetitors();
    } finally {
      setRefreshing(false);
    }
  };

  const totalCompetitors = competitors.length;

  const averageStrength = useMemo(() => {
    if (!competitors.length) return "0";

    const total = competitors.reduce(
      (sum, item) =>
        sum + Number(item.strengthScore ?? item.strength_score ?? 0),
      0
    );

    return Math.round(total / competitors.length).toString();
  }, [competitors]);

  const averageMarketShare = useMemo(() => {
    if (!competitors.length) return "0%";

    const total = competitors.reduce(
      (sum, item) =>
        sum + Number(item.marketShare ?? item.market_share ?? 0),
      0
    );

    return `${Math.round(total / competitors.length)}%`;
  }, [competitors]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <DashboardShell>
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="loading-spinner mx-auto" />
                <p className="mt-4 font-medium text-slate-600">
                  Loading competitors...
                </p>
              </div>
            </div>
          </DashboardShell>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <DashboardShell>
            <ErrorState
              error={error}
              onRetry={handleRetry}
              title="Competitor data unavailable"
              message={
                error.includes("not implemented")
                  ? "The competitors backend is not implemented yet. The page is ready and will work once those endpoints are added."
                  : error
              }
            />
          </DashboardShell>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            onRefresh={handleRefresh}
            loading={refreshing}
          />

          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Competitors"
              value={totalCompetitors}
              subtitle="Tracked entities"
              icon={FiUsers}
              color="from-cyan-500 to-cyan-600"
            />

            <KpiCard
              title="Average Strength"
              value={`${averageStrength}/100`}
              subtitle="Competitive score"
              icon={FiTrendingUp}
              color="from-emerald-500 to-emerald-600"
            />

            <KpiCard
              title="Average Market Share"
              value={averageMarketShare}
              subtitle="Estimated share"
              icon={FiBarChart2}
              color="from-blue-500 to-blue-600"
            />

            <KpiCard
              title="Live Updates"
              value={isConnected ? "Active" : "Offline"}
              subtitle="Realtime stream"
              icon={FiActivity}
              color="from-violet-500 to-violet-600"
            />
          </div>

          <div className="mb-8 glass-card p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Competitor Analysis
                </h2>
                <p className="text-sm text-slate-500">
                  Track and compare competitive intelligence in a structured view
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                {refreshing ? "Refreshing..." : "Reload"}
              </button>
            </div>

            {competitors.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
                  <FiUsers className="h-10 w-10 text-cyan-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  No competitors available
                </h3>
                <p className="mx-auto max-w-xl text-slate-500">
                  This page is ready, but no competitor data has been returned yet.
                  Once competitor endpoints are added to the backend, records will
                  appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {competitors.map((competitor, idx) => {
                  const name = competitor.name || "Unknown Competitor";
                  const rawMarketShare =
                    competitor.marketShare ?? competitor.market_share;
                  const rawStrengthScore =
                    competitor.strengthScore ?? competitor.strength_score ?? 75;
                  const description =
                    competitor.description || "No description available.";

                  const marketShare =
                    rawMarketShare === undefined || rawMarketShare === null
                      ? "N/A"
                      : rawMarketShare;

                  const strengthScore = Math.max(
                    0,
                    Math.min(100, Number(rawStrengthScore || 0))
                  );

                  return (
                    <div
                      key={competitor.id || idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all hover:-translate-y-1 hover:border-cyan-200 hover:bg-white hover:shadow-lg"
                    >
                      <div className="mb-4 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-bold text-white">
                          {name.charAt(0)}
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Market Share: {marketShare}
                            {marketShare === "N/A" ? "" : "%"}
                          </p>
                        </div>
                      </div>

                      <p className="mb-5 text-sm leading-6 text-slate-600">
                        {description}
                      </p>

                      <div className="mb-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            Strength Score
                          </span>
                          <span className="text-sm font-bold text-cyan-600">
                            {strengthScore}/100
                          </span>
                        </div>

                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500"
                            style={{ width: `${strengthScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                        <div className="text-sm text-slate-500">
                          Live tracking ready
                        </div>

                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-cyan-700 transition hover:bg-slate-50"
                        >
                          View Analysis
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isConnected && (
            <div className="glass-card flex items-start gap-3 p-4">
              <FiAlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <div className="font-semibold text-slate-900">
                  Realtime competitor updates are reconnecting
                </div>
                <div className="text-sm text-slate-500">
                  The page still works, but websocket updates are not currently connected.
                </div>
              </div>
            </div>
          )}
        </DashboardShell>
      </div>
    </div>
  );
};

export default Competitors;