import React, { useMemo, useState } from "react";
import { FiSearch, FiZap } from "react-icons/fi";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SettingsHeader from "../components/settings/SettingsHeader";
import EmptyIntelState from "../components/intelligence/EmptyIntelState";
import { useDashboardStream } from "../hooks/useWebSocket";

const demoResults = [
  {
    title: "High-conviction infrastructure projects",
    desc: "Projects with strong score, healthier traction, and better community quality.",
  },
  {
    title: "Emerging DeFi watchlist names",
    desc: "Projects with improving momentum but not yet fully proven.",
  },
];

const SearchIntel = () => {
  const { isConnected } = useDashboardStream();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return demoResults.filter((item) =>
      `${item.title} ${item.desc}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Search AI"
            subtitle="Ask the intelligence layer using natural language."
          />

          <SettingsHeader
            title="AI Search"
            subtitle="Search projects, sectors, risks, and opportunity patterns in a clean ChatGPT-style flow."
          />

          <div className="glass-card p-6 md:p-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <FiZap className="h-4 w-4" />
              AI-assisted intelligence search
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <FiSearch className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask AI: best high-conviction Web3 infrastructure projects"
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="mt-6">
              {!query.trim() ? (
                <EmptyIntelState
                  title="Ask the platform anything"
                  message="Try searches like: strongest DeFi projects, high-conviction infrastructure, or rising projects with low risk."
                />
              ) : results.length === 0 ? (
                <EmptyIntelState
                  title="No matching intelligence found"
                  message="Try broader wording or a different theme."
                />
              ) : (
                <div className="space-y-4">
                  {results.map((result) => (
                    <div
                      key={result.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="text-lg font-bold text-slate-900">
                        {result.title}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {result.desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default SearchIntel;