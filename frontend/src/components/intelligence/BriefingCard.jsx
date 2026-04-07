import React from "react";
import { FiZap } from "react-icons/fi";

const BriefingCard = ({ briefing }) => {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiZap className="h-5 w-5 text-cyan-600" />
        <h3 className="text-2xl font-bold text-slate-900">{briefing.title}</h3>
      </div>

      <p className="text-sm leading-7 text-slate-600">{briefing.summary}</p>

      <div className="mt-5 space-y-3">
        {briefing.points.map((point, index) => (
          <div
            key={`${point}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
          >
            {point}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BriefingCard;