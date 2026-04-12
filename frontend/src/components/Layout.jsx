import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiUsers,
  FiFileText,
  FiSearch,
  FiLayers,
  FiLogIn,
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: FiHome },
  { label: "Projects", to: "/projects", icon: FiFolder },
  { label: "Competitors", to: "/competitors", icon: FiUsers },
  { label: "Reports", to: "/reports", icon: FiFileText },
  { label: "Briefings", to: "/briefings", icon: FiLayers },
  { label: "Search Intel", to: "/search-intel", icon: FiSearch },
  { label: "Organizations", to: "/organizations", icon: FiUsers },
  { label: "Sign In", to: "/login", icon: FiLogIn },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const year = new Date().getFullYear();

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    if (to === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <div className="app-page lg:flex">
      <aside className="app-sidebar w-full border-b border-slate-200 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-6 py-7">
            <Link to="/" className="text-3xl font-black tracking-tight text-cyan-700">
              Web3 Intel
            </Link>
            <p className="mt-2 text-sm text-slate-500">
              AI-powered Web3 intelligence platform
            </p>
          </div>

          <nav className="flex-1 px-4 py-6">
            <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Explore Platform
            </div>

            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`nav-link ${
                      active
                        ? "active"
                        : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <div className="text-sm font-semibold text-cyan-700">
                Public preview mode
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Visitors can browse the core product pages. To use protected
                features like workspace actions, watchlists, billing, team
                controls, and API keys, continue through Organizations or Sign In.
              </p>

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  to="/organizations"
                  className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
                >
                  Launch Workspace
                </Link>

                <Link
                  to="/projects"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  View Projects
                </Link>
              </div>
            </div>
          </nav>

          <div className="border-t border-slate-100 px-6 py-5 text-sm text-slate-500">
            © {year} Web3 Intel Platform
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 app-content">{children}</main>
    </div>
  );
};

export default Layout;