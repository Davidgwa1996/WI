import React from "react";
import { FiArrowRight, FiStar } from "react-icons/fi";
import { Link } from "react-router-dom";

const WatchlistCard = ({ item }) => {
  return (
    <div className="glass-card p-6 transition-all duration-300 hover:-translate-y-1">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FiStar className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Watchlist item
            </span>
          </div>

          <h3 className="text-2xl font-black tracking-tight text-slate-900">
            {item.name}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {item.description}
          </p>
        </div>

        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
          {item.tag}
        </span>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Score</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{item.score}%</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Sector</div>
          <div className="mt-2 text-lg font-bold text-slate-900">{item.sector}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Stage</div>
          <div className="mt-2 text-lg font-bold text-slate-900">{item.stage}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm text-slate-500">{item.note}</span>
        <Link
          to={item.projectId ? `/projects/${item.projectId}` : "/projects"}
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700"
        >
          Open <FiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default WatchlistCard;