import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";

const docsLinks = [
  {
    title: "Swagger Docs",
    href: "/docs",
    description: "Interactive API testing interface.",
  },
  {
    title: "ReDoc",
    href: "/redoc",
    description: "Structured API reference documentation.",
  },
  {
    title: "OpenAPI JSON",
    href: "/openapi.json",
    description: "Raw OpenAPI schema for integrations and tooling.",
  },
];

const endpoints = [
  "GET /api/v1/projects",
  "GET /api/v1/projects/{id}",
  "GET /api/v1/projects/summary",
  "GET /api/v1/metrics",
  "POST /api/v1/auth/login",
  "POST /api/v1/auth/register",
  "GET /api/v1/users/me",
  "DELETE /api/v1/users/me",
];

const ApiDocsPage = () => {
  return (
    <div className="app-page xl:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            title="API Docs"
            subtitle="Platform API references and documentation access."
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="app-panel p-6">
              <h2 className="text-2xl font-black text-slate-900">OpenAPI</h2>
              <div className="mt-5 space-y-4">
                {docsLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-300 hover:shadow-sm"
                  >
                    <div className="text-lg font-bold text-slate-900">{item.title}</div>
                    <div className="mt-1 text-cyan-700">{item.href}</div>
                    <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                  </a>
                ))}
              </div>
            </div>

            <div className="app-panel p-6">
              <h2 className="text-2xl font-black text-slate-900">Core Endpoints</h2>
              <div className="mt-5 space-y-3">
                {endpoints.map((ep) => (
                  <div
                    key={ep}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700"
                  >
                    {ep}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DashboardShell>
      </div>
    </div>
  );
};

export default ApiDocsPage;