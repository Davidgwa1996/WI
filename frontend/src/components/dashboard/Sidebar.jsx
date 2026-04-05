import React from "react";
import { FiGrid, FiBarChart2, FiZap, FiActivity } from "react-icons/fi";

const Sidebar = () => {
  const items = [
    { label: "Overview", icon: FiGrid, href: "#overview" },
    { label: "Projects", icon: FiBarChart2, href: "#projects" },
    { label: "Alerts", icon: FiZap, href: "#alerts" },
    { label: "Metrics", icon: FiActivity, href: "#metrics" }
  ];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-6 xl:block">
      <div className="mb-8 text-xl font-extrabold text-slate-900">
        Web3 Intel Platform
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 text-sm font-semibold text-slate-900">
          Platform Focus
        </div>
        <p className="text-sm text-slate-500">
          AI-powered, real-time Web3 intelligence built on live market, developer,
          social, and community signals.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;