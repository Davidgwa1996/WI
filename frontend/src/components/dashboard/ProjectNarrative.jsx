import React from "react";
import { FiClock } from "react-icons/fi";

const kindStyles = {
  positive: "bg-emerald-500",
  neutral: "bg-cyan-500",
  caution: "bg-amber-500",
};

const ProjectNarrative = ({ items = [] }) => {
  if (!items.length) {
    return (
      <div className="glass-card p-6">
        <div className="mb-5 flex items-center gap-2">
          <FiClock className="h-5 w-5 text-cyan-600" />
          <h2 className="text-2xl font-bold text-slate-900">Project Narrative</h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
          No narrative events available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <FiClock className="h-5 w-5 text-cyan-600" />
        <h2 className="text-2xl font-bold text-slate-900">Project Narrative</h2>
      </div>

      <div className="space-y-5">
        {items.map((item, idx) => (
          <div key={`${item.title}-${idx}`} className="relative pl-8">
            <div className="absolute left-0 top-1.5 h-full w-px bg-slate-200" />
            <div
              className={`absolute left-[-5px] top-1.5 h-3 w-3 rounded-full ${
                kindStyles[item.kind] || kindStyles.neutral
              }`}
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 text-sm font-bold text-slate-900">
                {item.title}
              </div>
              <div className="mb-2 text-sm text-slate-600">{item.body}</div>
              <div className="text-xs text-slate-400">{item.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectNarrative;