import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiBarChart2,
  FiTrendingUp,
} from "react-icons/fi";

const FeatureCard = ({ icon: Icon, title, text }) => (
  <div className="glass-card p-6">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient shadow-lg shadow-cyan-500/20">
      <Icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
    <p className="text-slate-600">{text}</p>
  </div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.15),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.12),_transparent_25%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                Enterprise AI Intelligence
              </div>

              <h1 className="text-5xl font-black tracking-tight text-slate-900 md:text-6xl">
                Real-time Web3 intelligence built for serious decision-making
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Track projects, score conviction, detect risk, monitor momentum,
                and turn fragmented Web3 signals into structured intelligence for
                teams, analysts, and global organizations.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95"
                >
                  Launch Workspace
                  <FiArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                  <div className="text-2xl font-black text-slate-900">AI</div>
                  <div className="mt-1 text-sm text-slate-500">Decision support</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                  <div className="text-2xl font-black text-slate-900">Live</div>
                  <div className="mt-1 text-sm text-slate-500">Realtime tracking</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
                  <div className="text-2xl font-black text-slate-900">B2B</div>
                  <div className="mt-1 text-sm text-slate-500">Enterprise-ready</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-cyan-700">
                    Opportunity Radar
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    Live Intelligence Snapshot
                  </div>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    name: "Project Atlas",
                    score: "92%",
                    tag: "High Conviction",
                  },
                  {
                    name: "ChainNova",
                    score: "81%",
                    tag: "Watchlist",
                  },
                  {
                    name: "DefiPulseX",
                    score: "67%",
                    tag: "Emerging",
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{item.tag}</div>
                      </div>
                      <div className="text-xl font-black text-cyan-700">
                        {item.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-500">
                  AI briefing
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-600">
                  Developer activity is strengthening across tracked projects,
                  while only a smaller segment is showing strong multi-signal
                  conviction. This helps teams filter hype from real traction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight text-slate-900">
            Built for modern intelligence teams
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            From project discovery to risk monitoring, every workflow is designed
            for clarity, speed, and enterprise adoption.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={FiShield}
            title="Secure workspaces"
            text="Role-based access, API keys, audit logs, and organization-level control."
          />
          <FeatureCard
            icon={FiZap}
            title="Live signals"
            text="Track project changes, community metrics, and market movement in real time."
          />
          <FeatureCard
            icon={FiBarChart2}
            title="Structured intelligence"
            text="Turn raw signals into conviction, risk flags, and actionable insights."
          />
          <FeatureCard
            icon={FiTrendingUp}
            title="Business-ready reporting"
            text="Support teams, clients, and decision-makers with organized intelligence outputs."
          />
        </div>
      </section>
    </div>
  );
};

export default Landing;