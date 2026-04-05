import React from "react";
import { FiRefreshCw } from "react-icons/fi";

const Topbar = ({ connected, onRefresh, loading = false }) => {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div
          className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {connected ? "Live stream connected" : "Live stream reconnecting"}
        </div>

        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">
          Dashboard
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Real-time project intelligence for Web3 Intel Platform
        </p>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <FiRefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Refreshing..." : "Refresh Data"}
      </button>
    </div>
  );
};

export default Topbar;