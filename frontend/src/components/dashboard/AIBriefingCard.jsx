import React from "react";
import { FiZap, FiTrendingUp, FiAlertTriangle } from "react-icons/fi";

const toneMap = {
  positive: {
    icon: FiTrendingUp,
    badge: "Positive signal",
    badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  },
  cautious: {
    icon: FiAlertTriangle,
    badge: "Caution signal",
    badgeClass: "bg-amber-500/15 text-amber-700 border-amber-200",
  },
  neutral: {
    icon: FiZap,
    badge: "Neutral signal",
    badgeClass: "bg-cyan-500/15 text-cyan-700 border-cyan-200",
  },
};

const AIBriefingCard = ({ briefing }) => {
  const tone = toneMap[briefing?.tone || "neutral"];
  const Icon = tone.icon;

  return (
    <div className="glass-card p-6 md:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Daily intelligence</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {briefing?.headline || "AI Briefing"}
            </h2>
          </div>
        </div>

        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badgeClass}`}>
          {tone.badge}
        </div>
      </div>

      <p className="max-w-4xl text-base leading-8 text-slate-600">
        {briefing?.summary}
      </p>
    </div>
  );
};

export default AIBriefingCard;