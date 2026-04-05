import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import ConvictionBadge from "./ConvictionBadge";

const RadarColumn = ({ title, subtitle, items, accent }) => {
  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <div className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accent}`}>
          {title}
        </div>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {!items.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No projects currently in this bucket.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-cyan-200 hover:bg-white"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900">{project.name}</h3>
                <ConvictionBadge conviction={project.conviction} />
              </div>
              <p className="mb-2 text-sm text-slate-500">
                Score: {project.convictionScore}% · {project.sector || "Unknown sector"}
              </p>
              <div className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700">
                View project <FiArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const OpportunityRadar = ({ buckets }) => {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <RadarColumn
        title="Emerging"
        subtitle="Projects showing early but incomplete signals."
        items={buckets?.emerging || []}
        accent="bg-slate-100 text-slate-700"
      />
      <RadarColumn
        title="Watchlist"
        subtitle="Projects worth close monitoring as conviction builds."
        items={buckets?.watchlist || []}
        accent="bg-amber-100 text-amber-700"
      />
      <RadarColumn
        title="High Conviction"
        subtitle="Projects with the clearest multi-signal strength."
        items={buckets?.highConviction || []}
        accent="bg-emerald-100 text-emerald-700"
      />
    </div>
  );
};

export default OpportunityRadar;