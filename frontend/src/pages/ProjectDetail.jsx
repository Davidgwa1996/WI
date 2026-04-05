import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiActivity,
  FiRefreshCw,
  FiGlobe,
  FiUsers,
  FiGithub,
  FiDollarSign,
  FiMessageSquare,
} from "react-icons/fi";

import { projectsAPI } from "../services/api";
import { useProjectUpdates } from "../hooks/useWebSocket";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import ConvictionBadge from "../components/dashboard/ConvictionBadge";
import RiskFlags from "../components/dashboard/RiskFlags";
import ProjectNarrative from "../components/dashboard/ProjectNarrative";
import ErrorState from "../components/ErrorState";

import {
  buildProjectNarrative,
  formatMoneyCompact,
  getConvictionData,
} from "../lib/intelligence";

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </div>
    <div className="text-2xl font-black text-slate-900">{value}</div>
  </div>
);

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { updates, isConnected } = useProjectUpdates(id);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await projectsAPI.getById(id);
      setProject(data);
    } catch (err) {
      console.error("[ProjectDetail] Load failed:", err);
      setError(err?.message || "Failed to load project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Web3 Intel Platform | Project Detail";
    loadProject();
  }, [id]);

  useEffect(() => {
    if (!updates?.length) return;

    const latest = updates[updates.length - 1];
    const payload = latest?.data || latest;

    if (!payload) return;

    setProject((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        ...payload,
        id: payload.project_id || prev.id,
        name: payload.name || prev.name,
      };
    });
  }, [updates]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await projectsAPI.refresh();
      await loadProject();
    } catch (err) {
      console.error("[ProjectDetail] Refresh failed:", err);
      setError(err?.message || "Could not refresh project.");
    } finally {
      setRefreshing(false);
    }
  };

  const conviction = useMemo(
    () => (project ? getConvictionData(project) : null),
    [project]
  );

  const narrative = useMemo(
    () => (project ? buildProjectNarrative(project) : []),
    [project]
  );

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
                  Loading project...
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
            <ErrorState error={error} onRetry={loadProject} />
          </DashboardShell>
        </div>
      </div>
    );
  }

  if (!project || !conviction) {
    return (
      <div className="min-h-screen bg-slate-50 xl:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <DashboardShell>
            <ErrorState error="Project not found." onRetry={loadProject} />
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

          <button
            onClick={() => navigate("/projects")}
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Projects
          </button>

          <div className="glass-card mb-8 p-6 md:p-8">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  {project.sector ? (
                    <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-600">
                      {project.sector}
                    </span>
                  ) : null}

                  {project.stage ? (
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600">
                      {project.stage}
                    </span>
                  ) : null}

                  {project.token_symbol ? (
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600">
                      {project.token_symbol}
                    </span>
                  ) : null}
                </div>

                <h1 className="text-4xl font-black tracking-tight text-slate-900">
                  {project.name || "Untitled Project"}
                </h1>

                <p className="mt-3 max-w-4xl text-slate-600">
                  {project.description ||
                    "No description available for this project yet."}
                </p>
              </div>

              <ConvictionBadge conviction={conviction.conviction} />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StatCard
                label="Conviction Score"
                value={`${conviction.convictionScore}%`}
                icon={FiActivity}
              />
              <StatCard
                label="Overall Score"
                value={`${Math.round(Number(project.overall_score || 0))}%`}
                icon={FiActivity}
              />
              <StatCard
                label="Market Cap"
                value={formatMoneyCompact(project.market_cap)}
                icon={FiDollarSign}
              />
              <StatCard
                label="TVL"
                value={formatMoneyCompact(project.tvl)}
                icon={FiDollarSign}
              />
              <StatCard
                label="Funding Prediction"
                value={`${Math.round(Number(project.funding_prediction || 0))}%`}
                icon={FiTrendingUp}
              />
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Twitter Followers"
                value={Number(project.twitter_followers || 0).toLocaleString()}
                icon={FiUsers}
              />
              <StatCard
                label="Discord Members"
                value={Number(project.discord_members || 0).toLocaleString()}
                icon={FiMessageSquare}
              />
              <StatCard
                label="GitHub Stars"
                value={Number(project.github_stars || 0).toLocaleString()}
                icon={FiGithub}
              />
              <StatCard
                label="Momentum Score"
                value={`${Math.round(Number(project.momentum_score || 0))}%`}
                icon={FiTrendingUp}
              />
            </div>

            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-2 text-sm font-bold text-slate-900">
                  Why now
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {conviction.whyNow}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-2 text-sm font-bold text-slate-900">
                  Why caution
                </div>
                <p className="text-sm leading-7 text-slate-600">
                  {conviction.whyCaution}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="mb-3 text-sm font-bold text-slate-900">
                Risk Flags
              </div>
              <RiskFlags flags={conviction.riskFlags} />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 text-sm font-bold text-slate-900">
                  Key Drivers
                </div>
                {!conviction.drivers.length ? (
                  <p className="text-sm text-slate-500">
                    No strong drivers detected yet.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-600">
                    {conviction.drivers.map((item, index) => (
                      <li key={`${item}-${index}`}>• {item}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 text-sm font-bold text-slate-900">
                  Project Links
                </div>

                <div className="space-y-3 text-sm">
                  {project.website ? (
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      <FiGlobe className="h-4 w-4" />
                      Open Website
                    </a>
                  ) : (
                    <div className="text-slate-500">No website available</div>
                  )}

                  {project.twitter_handle ? (
                    <a
                      href={`https://x.com/${project.twitter_handle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      <FiUsers className="h-4 w-4" />
                      @{project.twitter_handle.replace(/^@/, "")}
                    </a>
                  ) : (
                    <div className="text-slate-500">No Twitter handle available</div>
                  )}

                  {project.github_repo ? (
                    <a
                      href={`https://github.com/${project.github_repo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 font-medium text-cyan-700 hover:text-cyan-800"
                    >
                      <FiGithub className="h-4 w-4" />
                      {project.github_repo}
                    </a>
                  ) : (
                    <div className="text-slate-500">No GitHub repository available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ProjectNarrative items={narrative} />

          {isConnected && updates.length > 0 ? (
            <div className="glass-card mt-8 p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Live Update Feed
              </h2>

              <div className="space-y-3">
                {updates.slice(-5).reverse().map((update, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-600">
                      {JSON.stringify(update, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </DashboardShell>
      </div>
    </div>
  );
};

export default ProjectDetail;