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
  FiFolder,
  FiGrid,
  FiLogIn,
  FiUsers,
  FiSearch,
  FiMessageSquare,
} from "react-icons/fi";

const FeatureCard = ({ icon: Icon, title, text }) => (
  <div className="glass-card p-6 transition-all duration-300 hover:scale-[1.02]">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 shadow-lg shadow-brand-500/20">
      <Icon className="h-6 w-6 text-white" />
    </div>
    <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
    <p className="text-slate-400">{text}</p>
  </div>
);

const QuickLinkCard = ({ to, icon: Icon, title, text, primary = false }) => (
  <Link
    to={to}
    className={`group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 ${
      primary
        ? "border-brand-500/30 bg-brand-500/10 shadow-lg shadow-brand-500/10"
        : "border-slate-800 bg-slate-900/40 hover:border-brand-500/20"
    }`}
  >
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/70">
      <Icon className="h-5 w-5 text-brand-400" />
    </div>
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{text}</p>
      </div>
      <FiArrowRight className="h-5 w-5 text-brand-400 transition-transform duration-300 group-hover:translate-x-1" />
    </div>
  </Link>
);

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left column */}
            <div>
              <div className="mb-4 inline-flex rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-400">
                Enterprise AI Intelligence
              </div>

              <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
                <span className="gradient-text">Real-time Web3 intelligence</span>
                <br />
                built for serious decision-making
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Track projects, score conviction, detect risk, monitor momentum,
                and turn fragmented Web3 signals into structured intelligence for
                teams, analysts, and global organizations.
              </p>

              <div className="mt-4 max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm leading-7 text-slate-300">
                Reviewers, recruiters, and visitors can explore the public parts
                of the platform without creating an account. Public access is limited to
                Home, Search AI, AI Agent, Projects, and Competitors. To actually use
                the workspace system with roles, approvals, ownership, and protected services,
                continue through the organization flow.
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link to="/organizations" className="btn-primary group">
                  Launch Workspace
                  <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link to="/dashboard" className="btn-secondary">
                  Explore Home
                </Link>

                <Link to="/projects" className="btn-secondary">
                  View Projects
                </Link>

                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-black text-brand-400">AI</div>
                  <div className="mt-1 text-sm text-slate-400">Decision support</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-black text-brand-400">Live</div>
                  <div className="mt-1 text-sm text-slate-400">Realtime tracking</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-black text-brand-400">B2B</div>
                  <div className="mt-1 text-sm text-slate-400">Enterprise-ready</div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="glass-card p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-brand-400">
                    Opportunity Radar
                  </div>
                  <div className="text-2xl font-black text-white">
                    Live Intelligence Snapshot
                  </div>
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
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-brand-500/30"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-400">{item.tag}</div>
                      </div>
                      <div className="text-xl font-black text-brand-400">
                        {item.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-brand-500/20 bg-slate-900/30 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-brand-400">
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

      {/* Explore Section */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Explore the platform before signing in
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-slate-400">
            Anyone reviewing the product can open the public pages and inspect the
            interface. Protected workspace actions only unlock after organization
            access, owner approval, or invite acceptance.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <QuickLinkCard
            to="/dashboard"
            icon={FiGrid}
            title="Home"
            text="Open the public home preview and inspect the product."
            primary
          />
          <QuickLinkCard
            to="/projects"
            icon={FiFolder}
            title="Projects"
            text="Review project listings, project detail pages, and intelligence views."
          />
          <QuickLinkCard
            to="/competitors"
            icon={FiUsers}
            title="Competitors"
            text="Inspect competitor-focused public analysis pages."
          />
          <QuickLinkCard
            to="/search-intel"
            icon={FiSearch}
            title="Search AI"
            text="Use the public AI-assisted search experience."
          />
          <QuickLinkCard
            to="/agent"
            icon={FiMessageSquare}
            title="AI Agent"
            text="Open the public AI agent preview page."
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <QuickLinkCard
            to="/organizations"
            icon={FiUsers}
            title="Workspace Access"
            text="Create or join an organization for real usage, roles, approval, and protected services."
          />
          <QuickLinkCard
            to="/login"
            icon={FiLogIn}
            title="Sign In"
            text="Return as an owner, admin, analyst, or viewer after approval."
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white">
            <span className="gradient-text">Built for modern intelligence teams</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
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

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
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