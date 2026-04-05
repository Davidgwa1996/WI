import React from "react";
import { FiActivity } from "react-icons/fi";

const MetricsPanel = ({ metrics = {} }) => {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiActivity className="h-5 w-5 text-cyan-600" />
        <h2 className="text-xl font-bold text-slate-900">System Metrics</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Application</div>
          <div className="mt-1 font-semibold text-slate-900">
            {metrics.app_name || "Web3 Intel Platform"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Environment</div>
          <div className="mt-1 font-semibold text-slate-900">
            {metrics.environment || "-"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Projects</div>
          <div className="mt-1 font-semibold text-slate-900">
            {metrics.projects ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">WebSocket Connections</div>
          <div className="mt-1 font-semibold text-slate-900">
            {metrics.websocket_connections ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">Redis Enabled</div>
          <div className="mt-1 font-semibold text-slate-900">
            {String(metrics.redis_enabled ?? false)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">AI Enabled</div>
          <div className="mt-1 font-semibold text-slate-900">
            {String(metrics.ai_enabled ?? false)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;