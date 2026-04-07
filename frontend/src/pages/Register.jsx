import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import { useAuth } from "../context/AuthContext";
import { isStrongPassword, PASSWORD_RULE_TEXT } from "../lib/passwordRules";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    organization_name: "",
    organization_slug: "",
    full_name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_RULE_TEXT);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
      <AuthCard
        title="Create your workspace"
        subtitle="Launch a secure organization account for your team."
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Organization Name</label>
              <input
                value={form.organization_name}
                onChange={(e) => setForm((p) => ({ ...p, organization_name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Acme Ventures"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Workspace Slug</label>
              <input
                value={form.organization_slug}
                onChange={(e) => setForm((p) => ({ ...p, organization_slug: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="acme-ventures"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              placeholder="jane@company.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              placeholder="Choose a secure password"
              required
            />
            <p className="mt-2 text-xs text-slate-500">{PASSWORD_RULE_TEXT}</p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-brand-gradient px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-70"
          >
            {submitting ? "Creating workspace..." : "Create Workspace"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cyan-700">
              Sign in
            </Link>
          </p>
        </form>
      </AuthCard>
    </div>
  );
};

export default Register;