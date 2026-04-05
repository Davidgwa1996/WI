import React from "react";
import { FiZap } from "react-icons/fi";

const AIInsightsPanel = ({ insights = [] }) => {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiZap className="h-5 w-5 text-cyan-600" />
        <h2 className="text-xl font-bold text-slate-900">AI Insights</h2>
      </div>

      {!insights.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No AI insights yet. New signals will appear here when the backend publishes them.
        </div>
      ) : (
        <div className="space-y-3">
          {insights.slice(0, 8).map((insight, idx) => (
            <div
              key={`${insight}-${idx}`}
              className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700"
            >
              {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;