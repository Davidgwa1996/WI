import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiActivity,
  FiTrendingUp,
  FiZap,
  FiBarChart2,
  FiGlobe,
} from "react-icons/fi";

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="hero-shell hero-grid">
        <div className="hero-orb left-[-80px] top-16 h-64 w-64 bg-cyan-500/20" />
        <div className="hero-orb right-[-40px] top-24 h-72 w-72 bg-emerald-500/20" />
        <div className="hero-orb bottom-[-80px] left-1/3 h-72 w-72 bg-violet-500/10" />

        <div className="section-container section-padding relative z-10">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <div className="mb-5 status-badge bg-white/10 text-cyan-200 border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Real-time AI intelligence for modern Web3 workflows
              </div>

              <h1 className="text-balance mb-6 text-5xl font-black leading-tight text-white md:text-6xl xl:text-7xl">
                Web3 Intel Platform
              </h1>

              <p className="mb-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                Monitor Web3 projects, track market and community momentum,
                detect anomalies, and surface AI-driven intelligence from one
                premium control center.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/dashboard" className="btn-primary">
                  Open Dashboard
                  <FiArrowRight className="h-4 w-4" />
                </Link>

                <Link to="/projects" className="btn-secondary">
                  View Projects
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "Signals", value: "Real-time" },
                  { label: "AI Scoring", value: "Automated" },
                  { label: "Streaming", value: "WebSocket" },
                  { label: "Stack", value: "FastAPI + React" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {item.label}
                    </div>
                    <div className="mt-2 text-sm font-bold text-white">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="glass-card overflow-hidden p-6 bg-white/10 border-white/10 backdrop-blur-2xl">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">
                      Live Intelligence Preview
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-white">
                      Market + Community + AI
                    </h3>
                  </div>
                  <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Live
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      icon: FiActivity,
                      title: "Momentum Signals",
                      value: "92%",
                    },
                    {
                      icon: FiTrendingUp,
                      title: "Funding Potential",
                      value: "High",
                    },
                    {
                      icon: FiBarChart2,
                      title: "Project Health",
                      value: "Stable",
                    },
                    {
                      icon: FiGlobe,
                      title: "Community Reach",
                      value: "Growing",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                      >
                        <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                        <div className="text-sm text-slate-300">{item.title}</div>
                        <div className="mt-2 text-2xl font-bold text-white">
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    <FiZap className="h-4 w-4" />
                    AI Insight
                  </div>
                  <p className="text-sm leading-7 text-slate-300">
                    “Projects with rising GitHub velocity and stable TVL show the
                    strongest early-stage upside in the current market snapshot.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container section-padding">
        <div className="mb-10">
          <div className="status-badge mb-4">Platform Overview</div>
          <h2 className="mb-3 text-4xl font-bold text-slate-900">
            Designed like a serious intelligence product
          </h2>
          <p className="max-w-3xl text-slate-600">
            Built for modern analysts, researchers, founders, and teams who need
            a cleaner way to observe Web3 project quality and momentum.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: FiActivity,
              title: "Live Data Signals",
              text: "Follow project movement, community activity, and core market changes in realtime.",
            },
            {
              icon: FiTrendingUp,
              title: "AI-Driven Scoring",
              text: "Bring sentiment, funding probability, and momentum into one clear decision layer.",
            },
            {
              icon: FiZap,
              title: "Realtime Alerts",
              text: "Surface anomalies, spikes, and meaningful updates before they become obvious.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="glass-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Landing;