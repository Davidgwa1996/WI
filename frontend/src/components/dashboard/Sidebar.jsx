import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiCompass,
  FiFolder,
  FiUsers,
  FiSearch,
  FiCpu,
  FiStar,
  FiFileText,
  FiZap,
  FiSettings,
  FiUser,
  FiKey,
  FiCreditCard,
  FiShield,
  FiLogOut,
  FiBriefcase,
  FiChevronRight,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const isOwner = role === "owner";
  const isAdmin = role === "admin";

  const publicItems = [
    { label: "Home", to: "/", icon: FiHome },
    { label: "Explore", to: "/dashboard", icon: FiCompass },
    { label: "Projects", to: "/projects", icon: FiFolder },
    { label: "Competitors", to: "/competitors", icon: FiUsers },
    { label: "Search AI", to: "/search-intel", icon: FiSearch },
    { label: "AI Agent", to: "/agent", icon: FiCpu },
  ];

  const workspaceItems = isAuthenticated
    ? [
        { label: "Watchlists", to: "/watchlists", icon: FiStar },
        { label: "Reports", to: "/reports", icon: FiFileText },
        { label: "Briefings", to: "/briefings", icon: FiZap },
        { label: "Workspace", to: "/workspace", icon: FiSettings },
        { label: "Account", to: "/account", icon: FiUser },
      ]
    : [];

  const managedItems =
    isOwner || isAdmin
      ? [
          { label: "API Keys", to: "/api-keys", icon: FiKey },
          { label: "Billing", to: "/billing", icon: FiCreditCard },
        ]
      : [];

  const ownerItems = isOwner
    ? [
        { label: "Organizations", to: "/organizations", icon: FiBriefcase },
        { label: "Audit Logs", to: "/audit-logs", icon: FiShield },
        { label: "Admin", to: "/admin", icon: FaCrown },
      ]
    : [];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore logout failure and continue redirect
    }
    navigate("/login");
  };

  const renderNav = (items) =>
    items.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`
          }
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </div>
          <FiChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
        </NavLink>
      );
    });

  return (
    <aside className="hidden xl:flex xl:w-[300px] xl:flex-col xl:border-r xl:border-slate-200 xl:bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
            <FiShield className="h-5 w-5 text-white" />
          </div>

          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              Web3 Intel
            </div>
            <div className="text-sm text-slate-500">Platform navigation</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-semibold text-slate-900">
            {user?.full_name || "Public Visitor"}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {user?.email || "Preview mode"}
          </div>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 capitalize">
            {isOwner ? <FaCrown className="h-3.5 w-3.5 text-amber-500" /> : null}
            {user?.role || "public"}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Public Access
        </div>
        <nav className="space-y-2">{renderNav(publicItems)}</nav>

        {workspaceItems.length > 0 ? (
          <>
            <div className="mb-3 mt-7 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Workspace
            </div>
            <nav className="space-y-2">{renderNav(workspaceItems)}</nav>
          </>
        ) : null}

        {managedItems.length > 0 ? (
          <>
            <div className="mb-3 mt-7 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Managed Services
            </div>
            <nav className="space-y-2">{renderNav(managedItems)}</nav>
          </>
        ) : null}

        {ownerItems.length > 0 ? (
          <>
            <div className="mb-3 mt-7 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Owner Controls
            </div>
            <nav className="space-y-2">{renderNav(ownerItems)}</nav>
          </>
        ) : null}
      </div>

      <div className="border-t border-slate-200 px-4 py-4">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <FiLogOut className="h-5 w-5" />
            <span>Log Out</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <FiUser className="h-5 w-5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;