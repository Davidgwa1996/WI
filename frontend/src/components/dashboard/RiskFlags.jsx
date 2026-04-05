import React from "react";
import { FiAlertTriangle } from "react-icons/fi";

const RiskFlags = ({ flags = [] }) => {
  if (!flags.length) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        No major risk flags currently detected.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {flags.map((flag, index) => (
        <div
          key={`${flag}-${index}`}
          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
        >
          <FiAlertTriangle className="h-4 w-4" />
          {flag}
        </div>
      ))}
    </div>
  );
};

export default RiskFlags;