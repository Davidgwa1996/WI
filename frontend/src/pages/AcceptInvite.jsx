import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiShield, FiUsers } from "react-icons/fi";
import AuthCard from "../components/auth/AuthCard";
import { invitesAPI, authAPI } from "../services/api";
import { isStrongPassword, PASSWORD_RULE_TEXT } from "../lib/passwordRules";

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = useMemo(() => params.get("token") || "", [params]);

  const [form, setForm] = useState({
    full_name: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setAuthState = async (accessToken) => {
    if (!accessToken) return;

    localStorage.removeItem("token");
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_token");
    localStorage.setItem("w3i_token", accessToken);

    try {
      const me = await authAPI.me();
      if (me) {
        localStorage.removeItem("auth_user");
        localStorage.removeItem("currentUser");
        localStorage.setItem("user", JSON.stringify(me));
      }
    } catch (e) {
      console.warn("Could not preload user profile after invite acceptance:", e);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Invite token is missing from the URL.");
      return;
    }

    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_RULE_TEXT);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const result = await invitesAPI.accept({
        token,
        full_name: form.full_name.trim(),
        password: form.password,
      });

      if (!result?.access_token) {
        throw new Error("Invite accepted, but no access token was returned.");
      }

      await setAuthState(result.access_token);

      setSuccess("Invite accepted successfully. Redirecting to your workspace...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
        window.location.reload();
      }, 700);
    } catch (err) {
      setError(err?.message || "Could not accept invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_540px]">
        <div className="hidden lg:block">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Approved Workspace Access
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 xl:text-5xl">
              Join the workspace through an owner-approved invite
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              This page is for users who were invited by the workspace owner or an
              authorized admin. Public visitors should use the preview pages, while
              actual workspace users join through approved access like this.
            </p>

            <div className="mt-8 space-y-4">
              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiShield className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Secure organization access
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Your invite is tied to a workspace role chosen for you by the
                      owner or administrator.
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiUsers className="mt-1 h-5 w-5 text-cyan-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Role-based workspace entry
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      After acceptance, you will enter the platform with the role
                      assigned to you, such as admin, analyst, or viewer.
                    </p>
                  </div>
                </div>
              </div>

              <div className="app-panel-soft p-4">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="mt-1 h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-bold text-slate-900">
                      Public preview remains separate
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Home, Search AI, AI Agent, Projects, and Competitors can be
                      previewed publicly without creating this kind of account.
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
          title="Accept workspace invite"
          subtitle="Complete your account setup to join the approved organization workspace."
        >
          {!token ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Invite token is missing from the URL.
              </div>

              <p className="text-sm text-slate-500">
                Open the exact invite link sent by the workspace owner or admin.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/login" className="btn-light">
                  Go to Sign In
                </Link>
                <Link to="/organizations" className="btn-light">
                  Workspace Access
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                />
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
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500"
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                />
                <p className="mt-2 text-xs text-slate-500">{PASSWORD_RULE_TEXT}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                This access was granted by an approved workspace invitation.
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:opacity-95 disabled:opacity-70"
              >
                {submitting ? "Joining workspace..." : "Accept Invite"}
                {!submitting ? <FiArrowRight className="h-4 w-4" /> : null}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already accepted before?{" "}
                <Link to="/login" className="font-semibold text-cyan-700">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
};

export default AcceptInvite;