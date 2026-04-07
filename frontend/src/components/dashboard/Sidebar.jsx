import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiUsers,
  FiSettings,
  FiKey,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiLogOut,
  FiShield,
  FiUser,
  FiStar,
  FiZap,
  FiSearch,
  FiCpu,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Home", to: "/", icon: FiHome },
  { label: "Search AI", to: "/search-intel", icon: FiSearch },
  { label: "AI Agent", to: "/agent", icon: FiCpu },
  { label: "Dashboard", to: "/dashboard", icon: FiHome },
  { label: "Projects", to: "/projects", icon: FiFolder },
  { label: "Competitors", to: "/competitors", icon: FiUsers },
  { label: "Watchlists", to: "/watchlists", icon: FiStar },
  { label: "Reports", to: "/reports", icon: FiFileText },
  { label: "Briefings", to: "/briefings", icon: FiZap },
  { label: "Workspace", to: "/workspace", icon: FiSettings },
  { label: "Team", to: "/team", icon: FiGrid },
  { label: "Members", to: "/members", icon: FiUsers },
  { label: "Account", to: "/account", icon: FiUser },
  { label: "API Keys", to: "/api-keys", icon: FiKey },
  { label: "Billing", to: "/billing", icon: FiCreditCard },
  { label: "Audit Logs", to: "/audit-logs", icon: FiFileText },
  { label: "API Docs", to: "/api-docs", icon: FiFileText },
  { label: "Admin Roles", to: "/admin/roles", icon: FiShield },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden xl:flex xl:w-[280px] xl:flex-col xl:border-r xl:border-slate-200 xl:bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-cyan-500/20">
            <FiShield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              Web3 Intel
            </div>
            <div className="text-sm text-slate-500">AI-powered workspace</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            {user?.full_name || "Workspace User"}
          </div>
          <div className="mt-1 text-sm text-slate-500">{user?.email || "-"}</div>
          <div className="mt-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
            {user?.role || "viewer"}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Navigation
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-gradient text-white shadow-lg shadow-cyan-500/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 px-4 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
        >
          <FiLogOut className="h-5 w-5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;