import React from "react";
import { Link } from "react-router-dom";
import ConvictionBadge from "./ConvictionBadge";
import { formatMoneyCompact, getConvictionData } from "../../lib/intelligence";

const ProjectTable = ({ projects = [] }) => {
  const enrichedProjects = projects.map((project) => ({
    ...project,
    ...getConvictionData(project),
  }));

  return (
    <div className="glass-card p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900">Decision Table</h2>
        <p className="mt-1 text-sm text-slate-500">
          Live project coverage with conviction, risk context, and decision-ready signals.
        </p>
      </div>

      {!enrichedProjects.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
          No projects available.
        </div>
      ) : (
        <div className="table-shell">
          <div className="table-wrap">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  <th className="table-head-cell">Project</th>
                  <th className="table-head-cell">Conviction</th>
                  <th className="table-head-cell">Score</th>
                  <th className="table-head-cell">Sector</th>
                  <th className="table-head-cell">Stage</th>
                  <th className="table-head-cell">Twitter</th>
                  <th className="table-head-cell">GitHub</th>
                  <th className="table-head-cell">Discord</th>
                  <th className="table-head-cell">Market Cap</th>
                  <th className="table-head-cell">TVL</th>
                  <th className="table-head-cell">Action</th>
                </tr>
              </thead>

              <tbody>
                {enrichedProjects.map((project, idx) => (
                  <tr key={project.id || idx} className="table-row">
                    <td className="table-cell font-semibold text-slate-900">
                      {project.name || "Untitled"}
                    </td>

                    <td className="table-cell">
                      <ConvictionBadge conviction={project.conviction} />
                    </td>

                    <td className="table-cell font-semibold text-slate-900">
                      {project.convictionScore}%
                    </td>

                    <td className="table-cell">{project.sector || "-"}</td>

                    <td className="table-cell">{project.stage || "-"}</td>

                    <td className="table-cell">
                      {Number(project.twitter_followers || 0).toLocaleString()}
                    </td>

                    <td className="table-cell">
                      {Number(project.github_stars || 0).toLocaleString()}
                    </td>

                    <td className="table-cell">
                      {Number(project.discord_members || 0).toLocaleString()}
                    </td>

                    <td className="table-cell">
                      {formatMoneyCompact(project.market_cap)}
                    </td>

                    <td className="table-cell">
                      {formatMoneyCompact(project.tvl)}
                    </td>

                    <td className="table-cell">
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
                      >
                        View detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;