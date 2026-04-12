import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiDollarSign,
  FiActivity,
  FiTrendingUp,
  FiZap,
  FiRefreshCw,
  FiEye,
} from "react-icons/fi";

import api, { projectsAPI, systemAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";

import DashboardShell from "../components/dashboard/DashboardShell";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import KpiCard from "../components/dashboard/KpiCard";
import LiveChart from "../components/dashboard/LiveChart";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import AIInsightsPanel from "../components/dashboard/AIInsightsPanel";
import ProjectTable from "../components/dashboard/ProjectTable";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import AdvancedIntelCharts from "../components/dashboard/AdvancedIntelCharts";

import ErrorState from "../components/ErrorState";
import { trackEvent } from "../lib/analytics";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [agentSummary, setAgentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const {
    isConnected,
    alerts: liveAlerts,
    insights: liveInsights,
    projectEvents,
  } = useDashboardStream();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [projectsData, metricsData, workspaceSummary] = await Promise.all([
        projectsAPI.getAll().catch(() => []),
        systemAPI.getMetrics().catch(() => null),
        api?.agent?.summary ? api.agent.summary().catch(() => null) : Promise.resolve(null),
      ]);

      const safeProjects = Array.isArray(projectsData) ? projectsData : [];

      setProjects(safeProjects);
      setMetrics(metricsData || null);
      setAgentSummary(workspaceSummary || null);

      trackEvent("dashboard_loaded", {
        projects_count: safeProjects.length,
      });
    } catch (err) {
      console.error("[Dashboard] Load failed:", err);
      setError(err?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Web3 Intel Platform | Home";
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!projectEvents?.length) return;

    const latest = projectEvents[0];
    const payload = latest?.data;
    if (!payload?.project_id) return;

    setProjects((prev) => {
      const next = [...prev];
      const index = next.findIndex((p) => p.id === payload.project_id);

      const updatedProject = {
        ...(index >= 0 ? next[index] : {}),
        id: payload.project_id,
        name: payload.name || (index >= 0 ? next[index]?.name : "Unnamed Project"),
        sector: payload.sector || (index >= 0 ? next[index]?.sector : null),
        stage: payload.stage || (index >= 0 ? next[index]?.stage : null),
        description: payload.description ?? (index >= 0 ? next[index]?.description : ""),
        overall_score: payload.overall_score ?? (index >= 0 ? next[index]?.overall_score : 0),
        llm_score: payload.llm_score ?? (index >= 0 ? next[index]?.llm_score : 0),
        sentiment_score:
          payload.sentiment_score ?? (index >= 0 ? next[index]?.sentiment_score : 0),
        funding_prediction:
          payload.funding_prediction ?? (index >= 0 ? next[index]?.funding_prediction : 0),
        momentum_score:
          payload.momentum_score ?? (index >= 0 ? next[index]?.momentum_score : 0),
        twitter_followers:
          payload.twitter_followers ?? (index >= 0 ? next[index]?.twitter_followers : 0),
        twitter_follower_growth_30d:
          payload.twitter_follower_growth_30d ??
          (index >= 0 ? next[index]?.twitter_follower_growth_30d : 0),
        github_stars:
          payload.github_stars ?? (index >= 0 ? next[index]?.github_stars : 0),
        github_star_growth_30d:
          payload.github_star_growth_30d ??
          (index >= 0 ? next[index]?.github_star_growth_30d : 0),
        discord_members:
          payload.discord_members ?? (index >= 0 ? next[index]?.discord_members : 0),
        discord_growth_30d:
          payload.discord_growth_30d ?? (index >= 0 ? next[index]?.discord_growth_30d : 0),
        market_cap: payload.market_cap ?? (index >= 0 ? next[index]?.market_cap : 0),
        total_volume: payload.total_volume ?? (index >= 0 ? next[index]?.total_volume : 0),
        tvl: payload.tvl ?? (index >= 0 ? next[index]?.tvl : 0),
      };

      if (index >= 0) {
        next[index] = updatedProject;
      } else {
        next.unshift(updatedProject);
      }

      return next;
    });
  }, [projectEvents]);

  const handleRetry = () => {
    loadDashboard();
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await projectsAPI.refresh();
      await loadDashboard();
      trackEvent("dashboard_refresh_triggered");
    } catch (err) {
      console.error("[Dashboard] Refresh failed:", err);
      setError(err?.message || "Could not refresh data.");
    } finally {
      setRefreshing(false);
    }
  };

  const totalProjects = projects.length;

  const highScoreProjects = useMemo(
    () => projects.filter((p) => Number(p.overall_score || 0) >= 80).length,
    [projects]
  );

  const totalMarketCap = useMemo(
    () => projects.reduce((sum, p) => sum + Number(p.market_cap || 0), 0),
    [projects]
  );

  const totalTVL = useMemo(
    () => projects.reduce((sum, p) => sum + Number(p.tvl || 0), 0),
    [projects]
  );

  const avgScore = useMemo(() => {
    if (!projects.length) return "0%";
    const total = projects.reduce((sum, p) => sum + Number(p.overall_score || 0), 0);
    return `${Math.round(total / projects.length)}%`;
  }, [projects]);

  const formatMoney = (value) => `$${Math.round(Number(value || 0)).toLocaleString()}`;

  if (loading) {
    return (
      <div className="app-page xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1 app-content">
          <DashboardShell>
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="spinner mx-auto" />
                <p className="mt-4 font-medium text-slate-600">Loading home preview...</p>
              </div>
            </div>
          </DashboardShell>
        </div>
      </div>
    );
  }

  if (error && !projects.length) {
    return (
      <div className="app-page xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1 app-content">
          <DashboardShell>
            <ErrorState error={error} onRetry={handleRetry} />
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
          <div id="overview">
            <Topbar
              connected={isConnected}
              onRefresh={handleRefresh}
              loading={refreshing}
              title="Home"
              subtitle="Public platform preview with real-time Web3 intelligence."
            />
          </div>

          <div className="page-actions">
            <button
              type="button"
              className="action-btn refresh"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>

            <div className="action-btn secondary">
              <FiEye />
              Public Preview
            </div>
          </div>

          {error ? (
            <div className="mb-6 app-panel p-4">
              <p className="error-text">{error}</p>
            </div>
          ) : null}

          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Tracked Projects"
              value={totalProjects}
              subtitle="Total in system"
              icon={FiBarChart2}
              color="from-cyan-500 to-cyan-600"
            />

            <KpiCard
              title="High Score Projects"
              value={highScoreProjects}
              subtitle="Score 80 and above"
              icon={FiTrendingUp}
              color="from-emerald-500 to-emerald-600"
            />

            <KpiCard
              title="Combined Market Cap"
              value={formatMoney(totalMarketCap)}
              subtitle="Tracked market value"
              icon={FiDollarSign}
              color="from-amber-500 to-amber-600"
            />

            <KpiCard
              title="Combined TVL"
              value={formatMoney(totalTVL)}
              subtitle="Total value locked"
              icon={FiActivity}
              color="from-violet-500 to-violet-600"
            />
          </div>

          {agentSummary ? (
            <div className="mb-8 app-panel p-6">
              <div className="mb-4 flex items-center gap-2 text-cyan-700">
                <FiZap className="h-5 w-5" />
                <h2 className="text-xl font-bold text-slate-900">AI Workspace Summary</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">Projects</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {agentSummary.projects ?? 0}
                  </div>
                </div>

                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">Watchlists</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {agentSummary.watchlists ?? 0}
                  </div>
                </div>

                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">Reports</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {agentSummary.reports ?? 0}
                  </div>
                </div>

                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">Briefings</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {agentSummary.briefings ?? 0}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mb-8 app-panel p-4 sm:p-6">
            <AdvancedIntelCharts projects={projects} />
          </div>

          <div className="mb-8 app-panel p-4 sm:p-6">
            <LiveChart data={projects} />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="app-panel p-4 sm:p-6">
              <AlertsPanel alerts={liveAlerts} />
            </div>

            <div className="app-panel p-4 sm:p-6">
              <AIInsightsPanel insights={liveInsights} />
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="app-panel p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Platform Summary</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">Average Score</div>
                  <div className="mt-1 text-3xl font-extrabold text-slate-900">{avgScore}</div>
                </div>

                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">AI Insights</div>
                  <div className="mt-1 text-3xl font-extrabold text-slate-900">
                    {liveInsights.length}
                  </div>
                </div>

                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">Live Alerts</div>
                  <div className="mt-1 text-3xl font-extrabold text-slate-900">
                    {liveAlerts.length}
                  </div>
                </div>

                <div className="app-panel-soft p-4">
                  <div className="text-sm text-slate-500">WebSocket Connections</div>
                  <div className="mt-1 text-3xl font-extrabold text-slate-900">
                    {metrics?.websocket_connections ?? 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="app-panel p-4 sm:p-6">
              <MetricsPanel metrics={metrics || {}} />
            </div>
          </div>

          <div className="mb-8 app-panel p-4 sm:p-6" id="projects">
            <ProjectTable projects={projects} />
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Dashboard;