import React from "react";
import {
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiSearch,
  FiBell,
  FiEye,
} from "react-icons/fi";

const Topbar = ({
  connected = false,
  onRefresh,
  loading = false,
  title = "Home",
  subtitle = "Public platform preview and workspace intelligence",
  isPublicPreview = false,
}) => {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {connected ? (
              <FiWifi className="h-3.5 w-3.5" />
            ) : (
              <FiWifiOff className="h-3.5 w-3.5" />
            )}
            {connected ? "Live stream connected" : "Live stream reconnecting"}
          </div>

          {isPublicPreview ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <FiEye className="h-3.5 w-3.5" />
              Public preview
            </div>
          ) : null}
        </div>

        <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
          {title}
        </h1>

        <p className="mt-2 max-w-3xl text-base text-slate-500 md:text-lg">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <FiSearch className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">Search intelligence...</span>
        </div>

        <button
          type="button"
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <FiBell className="h-5 w-5" />
        </button>

        {typeof onRefresh === "function" ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Topbar;