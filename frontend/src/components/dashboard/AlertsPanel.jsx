import React from "react";
import { FiAlertCircle } from "react-icons/fi";

const AlertsPanel = ({ alerts = [] }) => {
  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <FiAlertCircle className="h-5 w-5 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Real-Time Alerts</h2>
      </div>

      {!alerts.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No live alerts detected yet.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.slice(0, 8).map((alert, idx) => (
            <div
              key={`${alert}-${idx}`}
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <FiAlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
              <div className="text-sm text-red-700">{alert}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsPanel;