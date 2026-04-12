import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBriefcase, FiLock, FiArrowRight } from "react-icons/fi";
import AuthCard from "../components/auth/AuthCard";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_520px]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Workspace Access
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 xl:text-5xl">
              Sign in to use protected workspace services
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Public visitors can explore the platform without login. Protected services
              such as watchlists, reports, API keys, billing, audit logs, and organization
              controls require approved account access.
            </p>

            <div className="mt-8 space-y-4">
              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiBriefcase className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">Create workspace</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Only the platform owner email can create the owner workspace directly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiLock className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">Approved access only</div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Admins, analysts, and viewers should join through owner invitation and approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore" className="btn-light">
                Explore Public Pages
              </Link>
              <Link to="/register" className="btn-light">
                Create Workspace
              </Link>
            </div>
          </div>
        </div>

        <AuthCard
          title="Welcome back"
          subtitle="Sign in to access your intelligence workspace."
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-cyan-500"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Sign In"}
              {!submitting ? <FiArrowRight className="h-4 w-4" /> : null}
            </button>

            <p className="text-center text-sm text-slate-500">
              Need a workspace?{" "}
              <Link to="/register" className="font-semibold text-cyan-700">
                Create workspace
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;