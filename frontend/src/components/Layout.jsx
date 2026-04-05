import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiFolder,
  FiUsers,
  FiSettings,
} from "react-icons/fi";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: FiHome },
  { label: "Projects", to: "/projects", icon: FiFolder },
  { label: "Competitors", to: "/competitors", icon: FiUsers },
  { label: "Settings", to: "/dashboard", icon: FiSettings },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="w-full border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
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
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  location.pathname === item.to ||
                  (item.to !== "/" && location.pathname.startsWith(item.to));

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition ${
                      active
                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-100 px-6 py-5 text-sm text-slate-500">
            © {year} Web3 Intel Platform
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
};

export default Layout;