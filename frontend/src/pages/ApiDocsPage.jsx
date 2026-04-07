import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import { useDashboardStream } from "../hooks/useWebSocket";

const apiBase = import.meta.env.VITE_API_URL || "";

const ApiDocsPage = () => {
  const { isConnected } = useDashboardStream();

  return (
    <div className="min-h-screen bg-slate-50 xl:flex">
      <Sidebar />
      <div className="flex-1">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="API Documentation"
            subtitle="Public developer entry points for your workspace platform."
          />

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="mb-3 text-2xl font-black text-slate-900">OpenAPI</h2>
              <p className="mb-4 text-slate-600">
                Use the built-in API documentation below for testing and integrations.
              </p>

              <div className="space-y-3 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900">Swagger Docs</div>
                  <a
                    href={`${apiBase.replace(/\/api\/v1$/, "")}/docs`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-700"
                  >
                    Open /docs
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900">ReDoc</div>
                  <a
                    href={`${apiBase.replace(/\/api\/v1$/, "")}/redoc`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-700"
                  >
                    Open /redoc
                  </a>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-semibold text-slate-900">OpenAPI JSON</div>
                  <a
                    href={`${apiBase}/openapi.json`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-700"
                  >
                    Open openapi.json
                  </a>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="mb-4 text-xl font-bold text-slate-900">Core Endpoints</h3>
              <div className="grid gap-3 text-sm text-slate-700">
                {[
                  "GET /projects",
                  "GET /projects/{id}",
                  "POST /projects/refresh",
                  "GET /watchlists",
                  "POST /watchlists",
                  "GET /reports",
                  "POST /reports",
                  "GET /briefings",
                  "GET /search/intel",
                  "GET /search/google",
                  "GET /exports/projects.csv",
                  "GET /exports/report.pdf",
                  "POST /agent/chat",
                  "POST /billing/checkout",
                  "POST /billing/portal",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    {item}
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