import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import { invitesAPI } from "../services/api";
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

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_RULE_TEXT);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const result = await invitesAPI.accept({
        token,
        full_name: form.full_name,
        password: form.password,
      });

      localStorage.setItem("w3i_token", result.access_token);
      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err?.message || "Could not accept invite.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.12),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-10">
      <AuthCard
        title="Accept team invite"
        subtitle="Complete your account setup to join the workspace."
      >
        {!token ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Invite token is missing from the URL.
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Your full name"
                required
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                placeholder="Create a password"
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
              {submitting ? "Joining workspace..." : "Accept Invite"}
            </button>
          </form>
        )}
      </AuthCard>
    </div>
  );
};

export default AcceptInvite;