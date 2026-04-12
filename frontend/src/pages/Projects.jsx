import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiFolder,
  FiRefreshCw,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiGithub,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";

import { projectsAPI } from "../services/api";
import { useDashboardStream } from "../hooks/useWebSocket";
import DashboardShell from "../components/dashboard/DashboardShell";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import KpiCard from "../components/dashboard/KpiCard";
import ConvictionBadge from "../components/dashboard/ConvictionBadge";
import RiskFlags from "../components/dashboard/RiskFlags";
import ErrorState from "../components/ErrorState";

import {
  formatMoneyCompact,
  getConvictionData,
} from "../lib/intelligence";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { isConnected, projectEvents } = useDashboardStream();

  const loadProjects = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await projectsAPI.getAll();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[Projects] Load failed:", err);
      setError(err?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Web3 Intel Platform | Projects";
    loadProjects();
  }, []);

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
        description:
          payload.description ?? (index >= 0 ? next[index]?.description : ""),
        website: payload.website ?? (index >= 0 ? next[index]?.website : ""),
        twitter_handle:
          payload.twitter_handle ?? (index >= 0 ? next[index]?.twitter_handle : ""),
        token_symbol:
          payload.token_symbol ?? (index >= 0 ? next[index]?.token_symbol : ""),
        sector: payload.sector || (index >= 0 ? next[index]?.sector : null),
        stage: payload.stage || (index >= 0 ? next[index]?.stage : null),
        overall_score:
          payload.overall_score ?? (index >= 0 ? next[index]?.overall_score : 0),
        llm_score: payload.llm_score ?? (index >= 0 ? next[index]?.llm_score : 0),
        sentiment_score:
          payload.sentiment_score ??
          (index >= 0 ? next[index]?.sentiment_score : 0),
        funding_prediction:
          payload.funding_prediction ??
          (index >= 0 ? next[index]?.funding_prediction : 0),
        momentum_score:
          payload.momentum_score ??
          (index >= 0 ? next[index]?.momentum_score : 0),
        twitter_followers:
          payload.twitter_followers ??
          (index >= 0 ? next[index]?.twitter_followers : 0),
        twitter_follower_growth_30d:
          payload.twitter_follower_growth_30d ??
          (index >= 0 ? next[index]?.twitter_follower_growth_30d : 0),
        github_stars:
          payload.github_stars ?? (index >= 0 ? next[index]?.github_stars : 0),
        github_star_growth_30d:
          payload.github_star_growth_30d ??
          (index >= 0 ? next[index]?.github_star_growth_30d : 0),
        discord_members:
          payload.discord_members ??
          (index >= 0 ? next[index]?.discord_members : 0),
        discord_growth_30d:
          payload.discord_growth_30d ??
          (index >= 0 ? next[index]?.discord_growth_30d : 0),
        market_cap:
          payload.market_cap ?? (index >= 0 ? next[index]?.market_cap : 0),
        total_volume:
          payload.total_volume ?? (index >= 0 ? next[index]?.total_volume : 0),
        tvl: payload.tvl ?? (index >= 0 ? next[index]?.tvl : 0),
        updated_at:
          payload.updated_at ?? (index >= 0 ? next[index]?.updated_at : null),
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
    loadProjects();
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await projectsAPI.refresh();
      await loadProjects();
    } catch (err) {
      console.error("[Projects] Refresh failed:", err);
      setError(err?.message || "Could not refresh projects.");
    } finally {
      setRefreshing(false);
    }
  };

  const enrichedProjects = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      ...getConvictionData(project),
    }));
  }, [projects]);

  const totalProjects = enrichedProjects.length;

  const highScoreProjects = useMemo(
    () =>
      enrichedProjects.filter((p) => Number(p.overall_score || 0) >= 80).length,
    [enrichedProjects]
  );

  const highConvictionProjects = useMemo(
    () => enrichedProjects.filter((p) => p.conviction === "High").length,
    [enrichedProjects]
  );

  const avgScore = useMemo(() => {
    if (!enrichedProjects.length) return "0%";
    const total = enrichedProjects.reduce(
      (sum, p) => sum + Number(p.overall_score || 0),
      0
    );
    return `${Math.round(total / enrichedProjects.length)}%`;
  }, [enrichedProjects]);

  const totalMarketCap = useMemo(() => {
    const total = enrichedProjects.reduce(
      (sum, p) => sum + Number(p.market_cap || 0),
      0
    );
    return formatMoneyCompact(total);
  }, [enrichedProjects]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <DashboardShell>
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="loading-spinner mx-auto" />
                <p className="mt-4 font-medium text-slate-400">
                  Loading projects...
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
      <div className="min-h-screen bg-dark-bg xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <DashboardShell>
            <ErrorState error={error} onRetry={handleRetry} />
          </DashboardShell>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text xl:flex">
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
              title="All Projects"
              value={totalProjects}
              subtitle="Tracked opportunities"
              icon={FiFolder}
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
              title="High Conviction"
              value={highConvictionProjects}
              subtitle="Strongest current signals"
              icon={FiShield}
              color="from-violet-500 to-violet-600"
            />

            <KpiCard
              title="Combined Market Cap"
              value={totalMarketCap}
              subtitle="Tracked market value"
              icon={FiDollarSign}
              color="from-amber-500 to-amber-600"
            />
          </div>

          <div className="glass-card p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400">
                  Project intelligence
                </div>
                <h2 className="text-3xl font-black tracking-tight text-dark-text">
                  Project Explorer
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Browse all tracked Web3 opportunities with conviction, risk
                  context, and intelligence-led summaries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-800 bg-dark-panel px-4 py-3 text-sm">
                  <span className="text-slate-400">Average Score: </span>
                  <span className="font-bold text-cyan-400">{avgScore}</span>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-dark-panel px-4 py-2.5 font-semibold text-dark-text transition hover:bg-slate-800 disabled:opacity-70"
                >
                  <FiRefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing..." : "Reload"}
                </button>
              </div>
            </div>

            {enrichedProjects.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-dark-panel p-10 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10">
                  <FiFolder className="h-10 w-10 text-cyan-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-dark-text">
                  No projects available
                </h3>
                <p className="text-slate-400">
                  No tracked projects were returned from the backend.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {enrichedProjects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="glass-card block p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-glow"
                  >
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <h3 className="text-2xl font-black tracking-tight text-dark-text">
                            {project.name || "Untitled Project"}
                          </h3>

                          {project.sector ? (
                            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                              {project.sector}
                            </span>
                          ) : null}

                          {project.stage ? (
                            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                              {project.stage}
                            </span>
                          ) : null}
                        </div>

                        <p className="max-w-2xl text-sm leading-6 text-slate-300">
                          {project.description ||
                            "No description available for this project."}
                        </p>
                      </div>

                      <ConvictionBadge conviction={project.conviction} />
                    </div>

                    <div className="mb-5 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-800 bg-dark-panel p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Conviction Score
                        </div>
                        <div className="mt-2 text-2xl font-black text-cyan-400">
                          {project.convictionScore}%
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-dark-panel p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          Market Cap
                        </div>
                        <div className="mt-2 text-2xl font-black text-dark-text">
                          {formatMoneyCompact(project.market_cap)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-dark-panel p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          TVL
                        </div>
                        <div className="mt-2 text-2xl font-black text-dark-text">
                          {formatMoneyCompact(project.tvl)}
                        </div>
                      </div>
                    </div>

                    <div className="mb-5 grid gap-4 sm:grid-cols-3">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-dark-panel p-4 text-sm text-slate-300">
                        <FiUsers className="h-4 w-4 text-slate-400" />
                        <span>
                          {Number(project.twitter_followers || 0).toLocaleString()}{" "}
                          Twitter followers
                        </span>
                      </div>

                      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-dark-panel p-4 text-sm text-slate-300">
                        <FiGithub className="h-4 w-4 text-slate-400" />
                        <span>
                          {Number(project.github_stars || 0).toLocaleString()}{" "}
                          GitHub stars
                        </span>
                      </div>

                      <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-dark-panel p-4 text-sm text-slate-300">
                        <FiDollarSign className="h-4 w-4 text-slate-400" />
                        <span>{formatMoneyCompact(project.tvl)} TVL</span>
                      </div>
                    </div>

                    <div className="mb-4 grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-800 bg-dark-panel p-4">
                        <div className="mb-2 text-sm font-bold text-dark-text">
                          Why now
                        </div>
                        <p className="text-sm leading-6 text-slate-300">
                          {project.whyNow}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-dark-panel p-4">
                        <div className="mb-2 text-sm font-bold text-dark-text">
                          Why caution
                        </div>
                        <p className="text-sm leading-6 text-slate-300">
                          {project.whyCaution}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="mb-2 text-sm font-bold text-dark-text">
                        Risk Flags
                      </div>
                      <RiskFlags flags={project.riskFlags} />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                      <span className="text-sm font-medium text-slate-400">
                        View full intelligence
                      </span>

                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">
                        Open <FiArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Projects;