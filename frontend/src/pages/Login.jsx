import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiBriefcase, FiLock, FiArrowRight } from "react-icons/fi";
import AuthCard from "../components/auth/AuthCard";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resolveRedirect = (result) => {
    const role = String(result?.user?.role || "").toLowerCase();

    if (!role) {
      return "/organizations";
    }

    return "/dashboard";
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const result = await login(form.email.trim(), form.password);
      navigate(resolveRedirect(result), { replace: true });
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
              Public visitors can explore Home, Search AI, AI Agent, Projects,
              and Competitors without an account. To use watchlists, reports,
              API keys, billing, audit logs, and workspace controls, sign in
              with your approved organization account.
            </p>

            <div className="mt-8 space-y-4">
              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiBriefcase className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      New to the platform?
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Create a workspace as the owner, then invite approved
                      users such as admins, analysts, and viewers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiLock className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Approved access only
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Protected services become available only after successful
                      sign-in and role-based authorization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-light">
                Explore Public Pages
              </Link>
              <Link to="/organizations" className="btn-light">
                Launch Workspace
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
                onChange={(e) => handleChange("email", e.target.value)}
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
                onChange={(e) => handleChange("password", e.target.value)}
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Sign In"}
              {!submitting ? <FiArrowRight className="h-4 w-4" /> : null}
            </button>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Public preview remains available without login. Sign in only when
              you want to use protected organization services.
            </div>

            <p className="text-center text-sm text-slate-500">
              No account yet?{" "}
              <Link to="/register" className="font-semibold text-cyan-700">
                Create workspace
              </Link>
            </p>

            <p className="text-center text-sm text-slate-500">
              Invited by an owner?{" "}
              <Link to="/accept-invite" className="font-semibold text-cyan-700">
                Accept invite
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;