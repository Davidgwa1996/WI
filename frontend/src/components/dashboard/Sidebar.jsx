import React, { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiUsers,
  FiSettings,
  FiKey,
  FiCreditCard,
  FiFileText,
  FiLogOut,
  FiShield,
  FiUser,
  FiStar,
  FiZap,
  FiSearch,
  FiCpu,
  FiBriefcase,
  FiLayers,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const publicNavItems = [
  { label: "Home", to: "/dashboard", icon: FiHome },
  { label: "Search AI", to: "/search-intel", icon: FiSearch },
  { label: "AI Agent", to: "/agent", icon: FiCpu },
  { label: "Projects", to: "/projects", icon: FiFolder },
  { label: "Competitors", to: "/competitors", icon: FiUsers },
  { label: "Organizations", to: "/organizations", icon: FiBriefcase },
];

const protectedNavItems = [
  { label: "Watchlists", to: "/watchlists", icon: FiStar },
  { label: "Reports", to: "/reports", icon: FiFileText },
  { label: "Briefings", to: "/briefings", icon: FiZap },
  { label: "Workspace", to: "/workspace", icon: FiSettings },
  { label: "Account", to: "/account", icon: FiUser },
];

const adminNavItems = [
  { label: "API Keys", to: "/api-keys", icon: FiKey },
  { label: "Billing", to: "/billing", icon: FiCreditCard },
  { label: "Audit Logs", to: "/audit-logs", icon: FiLayers },
  { label: "API Docs", to: "/api-docs", icon: FiFileText },
];

const ownerNavItems = [
  { label: "Admin", to: "/admin", icon: FiShield },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = String(user?.role || "").toLowerCase();
  const isLoggedIn = !!user;
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isAnalyst = role === "analyst";

  const visibleProtectedNav = useMemo(() => {
    if (!isLoggedIn) return [];
    return protectedNavItems;
  }, [isLoggedIn]);

  const visibleAdminNav = useMemo(() => {
    if (!isLoggedIn) return [];

    if (isOwner || isAdmin) {
      return adminNavItems;
    }

    if (isAnalyst) {
      return adminNavItems.filter((item) => item.to === "/api-docs");
    }

    return [];
  }, [isLoggedIn, isOwner, isAdmin, isAnalyst]);

  const visibleOwnerNav = useMemo(() => {
    if (!isLoggedIn || !isOwner) return [];
    return ownerNavItems;
  }, [isLoggedIn, isOwner]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("w3i_token");
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("currentUser");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not fully clear local session:", e);
    }

    try {
      await logout();
    } catch (e) {
      console.warn("Logout helper failed:", e);
    }

    navigate("/");
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `nav-link ${
            isActive
              ? "active"
              : ""
          }`
        }
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="app-sidebar hidden xl:flex xl:w-[280px] xl:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
            <FiShield className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight text-slate-900">
              Web3 Intel
            </div>
            <div className="text-sm text-slate-500">AI-powered workspace</div>
          </div>
        </div>

        <div className="sidebar-card p-4">
          <div className="text-sm font-semibold text-slate-900">
            {user?.full_name || "Public Visitor"}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {user?.email || "Preview mode"}
          </div>
          <div className="mt-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
            {user?.role || "public"}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Public Preview
        </div>

        <nav className="space-y-2">
          {publicNavItems.map(renderNavItem)}
        </nav>

        {visibleProtectedNav.length > 0 ? (
          <>
            <div className="mb-3 mt-6 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Workspace
            </div>
            <nav className="space-y-2">
              {visibleProtectedNav.map(renderNavItem)}
            </nav>
          </>
        ) : null}

        {visibleAdminNav.length > 0 ? (
          <>
            <div className="mb-3 mt-6 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Managed Services
            </div>
            <nav className="space-y-2">
              {visibleAdminNav.map(renderNavItem)}
            </nav>
          </>
        ) : null}

        {visibleOwnerNav.length > 0 ? (
          <>
            <div className="mb-3 mt-6 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Owner Controls
            </div>
            <nav className="space-y-2">
              {visibleOwnerNav.map(renderNavItem)}
            </nav>
          </>
        ) : null}
      </div>

      <div className="border-t border-slate-200 px-4 py-4">
        {isLoggedIn ? (
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
            onClick={() => navigate("/organizations")}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <FiBriefcase className="h-5 w-5" />
            <span>Launch Workspace</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;