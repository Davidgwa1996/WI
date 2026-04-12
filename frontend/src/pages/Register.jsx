import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiBriefcase, FiShield, FiUsers } from "react-icons/fi";
import AuthCard from "../components/auth/AuthCard";
import { useAuth } from "../context/AuthContext";
import { isStrongPassword, PASSWORD_RULE_TEXT } from "../lib/passwordRules";

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

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

  const suggestedSlug = useMemo(() => {
    return slugify(form.organization_name);
  }, [form.organization_name]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOrgNameChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, organization_name: value };

      if (!prev.organization_slug || prev.organization_slug === slugify(prev.organization_name)) {
        next.organization_slug = slugify(value);
      }

      return next;
    });
  };

  const validateForm = () => {
    if (!form.organization_name.trim()) {
      return "Organization name is required.";
    }

    if (!form.organization_slug.trim()) {
      return "Workspace slug is required.";
    }

    if (!/^[a-z0-9-]+$/.test(form.organization_slug.trim())) {
      return "Workspace slug can only contain lowercase letters, numbers, and hyphens.";
    }

    if (!form.full_name.trim()) {
      return "Full name is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!isStrongPassword(form.password)) {
      return PASSWORD_RULE_TEXT;
    }

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        organization_name: form.organization_name.trim(),
        organization_slug: form.organization_slug.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Workspace registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_560px]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Owner Workspace Setup
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 xl:text-5xl">
              Create your workspace and become the owner
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              This registration flow is for creating a real organization workspace.
              The person who creates the workspace becomes the owner and receives
              the highest privileges, including approvals, organization control,
              account authority, and full platform management.
            </p>

            <div className="mt-8 space-y-4">
              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiBriefcase className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Step 1: Create the workspace
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Set the organization name, workspace slug, owner identity,
                      and secure password.
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiShield className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Step 2: You become the owner
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      The workspace creator is assigned the owner role automatically
                      and can later approve access, manage settings, and control
                      deletion rights.
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiUsers className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Step 3: Invite others later
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Admins, analysts, and viewers should enter later through
                      approval or invite acceptance, not through public workspace
                      ownership creation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-light">
                Explore Public Pages
              </Link>
              <Link to="/login" className="btn-light">
                Sign In Instead
              </Link>
            </div>
          </div>
        </div>

        <AuthCard
          title="Create your workspace"
          subtitle="Launch a secure organization account and become the owner."
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Organization Name
                </label>
                <input
                  value={form.organization_name}
                  onChange={(e) => handleOrgNameChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                  placeholder="Acme Ventures"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Workspace Slug
                </label>
                <input
                  value={form.organization_slug}
                  onChange={(e) => updateField("organization_slug", slugify(e.target.value))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                  placeholder="acme-ventures"
                  required
                />
                {suggestedSlug ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Suggested slug: <span className="font-semibold">{suggestedSlug}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                value={form.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="jane@company.com"
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
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Choose a secure password"
                required
                autoComplete="new-password"
              />
              <p className="mt-2 text-xs text-slate-500">{PASSWORD_RULE_TEXT}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Creating this workspace makes you the <strong>owner</strong>. Other users
              should join later through approval or invite flow.
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
              {submitting ? "Creating workspace..." : "Create Workspace"}
              {!submitting ? <FiArrowRight className="h-4 w-4" /> : null}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-cyan-700">
                Sign in
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

export default Register;