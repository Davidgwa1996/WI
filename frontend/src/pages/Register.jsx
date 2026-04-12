import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import { useAuth } from "../context/AuthContext";
import { isStrongPassword, PASSWORD_RULE_TEXT } from "../lib/passwordRules";

const OWNER_EMAIL = "davidmaina@gmail.com";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    organization_name: "",
    organization_slug: "",
    full_name: "",
    email: "",
    password: "",
    role: "viewer",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const emailIsOwner = useMemo(
    () => form.email.trim().toLowerCase() === OWNER_EMAIL,
    [form.email]
  );

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_RULE_TEXT);
      return;
    }

    if (form.role === "owner" && !emailIsOwner) {
      setError(`Only ${OWNER_EMAIL} can register as owner.`);
      return;
    }

    if (form.role !== "owner") {
      setError(
        "Direct workspace creation is reserved for the owner. Admins, analysts, and viewers must be invited and approved by the owner."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_520px] items-center">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Create Workspace
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 xl:text-5xl">
              Owner-controlled workspace setup
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Only the approved owner email can create a direct owner workspace.
              All other roles such as admin, analyst, and viewer must enter through
              the invite and approval flow.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Owner email</div>
              <div className="mt-2 text-base text-cyan-700 font-bold">{OWNER_EMAIL}</div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Important</div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                If you are not the owner, do not register directly here. Use the sign-in
                flow after receiving an approval or invite link from the owner.
              </p>
            </div>
          </div>
        </div>

        <AuthCard
          title="Create workspace"
          subtitle="Only the owner can complete direct workspace registration."
        >
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Organization Name
                </label>
                <input
                  value={form.organization_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, organization_name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                  placeholder="Web3 Intel Holdings"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Workspace Slug
                </label>
                <input
                  value={form.organization_slug}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, organization_slug: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                  placeholder="web3-intel"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, full_name: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="David Maina"
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="davidmaina@gmail.com"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Desired Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Only the owner can complete direct registration. All other roles require invite approval.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
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
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-70"
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
    </div>
  );
};

export default Register;