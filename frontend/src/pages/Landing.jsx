import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiBarChart2,
  FiTrendingUp,
  FiActivity,
  FiCpu,
  FiHome,
  FiFolder,
  FiUsers,
  FiSearch,
  FiLogIn,
  FiBriefcase,
} from "react-icons/fi";

const FeatureCard = ({ icon: Icon, title, text }) => (
  <div className="glass-card p-6 transition-all duration-300 hover:scale-[1.02]">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/20">
      <Icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
    <p className="text-slate-300">{text}</p>
  </div>
);

const ExploreCard = ({ to, icon: Icon, title, text, wide = false }) => (
  <Link
    to={to}
    className={`group rounded-[28px] border border-cyan-400/15 bg-slate-900/45 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_20px_50px_rgba(6,182,212,0.12)] ${
      wide ? "md:col-span-2" : ""
    }`}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
      <Icon className="h-6 w-6" />
    </div>
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-2xl font-extrabold text-white">{title}</h3>
        <p className="mt-2 max-w-xl text-base leading-7 text-slate-300">{text}</p>
      </div>
      <FiArrowRight className="mt-2 h-5 w-5 shrink-0 text-cyan-300 transition-transform duration-300 group-hover:translate-x-1" />
    </div>
  </Link>
);

const Landing = () => {
  return (
    <div className="landing-page">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_25%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_28%),linear-gradient(180deg,#050816_0%,#0f172a_100%)]" />
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Enterprise AI Intelligence
              </div>

              <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
                Real-time Web3 intelligence
                <br />
                built for serious decision-making
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Track projects, score conviction, detect risk, monitor momentum,
                and turn fragmented Web3 signals into structured intelligence for
                teams, analysts, and global organizations.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link to="/organizations" className="btn-primary group">
                  Workspace Access
                  <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link to="/dashboard" className="btn-secondary">
                  Explore
                </Link>

                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-black text-cyan-300">AI</div>
                  <div className="mt-1 text-sm text-slate-300">Decision support</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-black text-cyan-300">Live</div>
                  <div className="mt-1 text-sm text-slate-300">Realtime tracking</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-black text-cyan-300">B2B</div>
                  <div className="mt-1 text-sm text-slate-300">Enterprise-ready</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-cyan-300">Opportunity Radar</div>
                  <div className="text-2xl font-black text-white">Live Intelligence Snapshot</div>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Live
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Project Atlas", score: "92%", tag: "High Conviction" },
                  { name: "ChainNova", score: "81%", tag: "Watchlist" },
                  { name: "DefiPulseX", score: "67%", tag: "Emerging" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-4 transition hover:border-cyan-400/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-300">{item.tag}</div>
                      </div>
                      <div className="text-xl font-black text-cyan-300">{item.score}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-900/35 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
                  <FiActivity className="h-4 w-4" />
                  AI briefing
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-300">
                  Developer activity is strengthening across tracked projects,
                  while only a smaller segment is showing strong multi-signal
                  conviction. This helps teams filter hype from real traction.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Explore the platform
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-slate-300">
            Public visitors can review the visible areas of the platform. Protected
            services unlock only after workspace approval and sign-in.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <ExploreCard
            to="/"
            icon={FiHome}
            title="Home"
            text="Return to the main landing experience."
          />
          <ExploreCard
            to="/dashboard"
            icon={FiBarChart2}
            title="Explore"
            text="Open the public dashboard preview and inspect the product."
          />
          <ExploreCard
            to="/projects"
            icon={FiFolder}
            title="Projects"
            text="Review project listings, detail pages, and intelligence views."
          />
          <ExploreCard
            to="/competitors"
            icon={FiUsers}
            title="Competitors"
            text="Inspect competitor-focused public analysis pages."
          />
          <ExploreCard
            to="/search-intel"
            icon={FiSearch}
            title="Search AI"
            text="Use the public AI-assisted search experience."
          />
          <ExploreCard
            to="/agent"
            icon={FiCpu}
            title="AI Agent"
            text="Open the public AI agent preview page."
          />
          <ExploreCard
            to="/organizations"
            icon={FiBriefcase}
            title="Workspace Access"
            text="Create workspace, choose your role path, or continue to sign in."
            wide
          />
          <ExploreCard
            to="/login"
            icon={FiLogIn}
            title="Sign In"
            text="Go directly to login if you already have an approved account."
            wide
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Built for modern intelligence teams
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
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

      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="flex items-center gap-2">
            <FiCpu className="h-4 w-4" /> FastAPI + React
          </span>
          <span className="flex items-center gap-2">
            <FiZap className="h-4 w-4" /> WebSocket Streaming
          </span>
          <span>© 2026 Web3 Intel. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;