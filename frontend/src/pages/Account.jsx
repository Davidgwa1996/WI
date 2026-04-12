import React, { useMemo, useState } from "react";
import {
  FiMail,
  FiShield,
  FiUser,
  FiCheckCircle,
  FiTrash2,
  FiAlertTriangle,
  FiCrown,
} from "react-icons/fi";

import Sidebar from "../components/dashboard/Sidebar";
import DashboardShell from "../components/dashboard/DashboardShell";
import Topbar from "../components/dashboard/Topbar";
import SectionCard from "../components/settings/SectionCard";
import SettingsHeader from "../components/settings/SettingsHeader";
import { useDashboardStream } from "../hooks/useWebSocket";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";

const Account = () => {
  const { isConnected } = useDashboardStream();
  const { user, logout } = useAuth();

  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showDeleteBox, setShowDeleteBox] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const roleLabel = useMemo(() => {
    return user?.role ? String(user.role).toUpperCase() : "VIEWER";
  }, [user]);

  const isOwner = String(user?.role || "").toLowerCase() === "owner";
  const canDelete =
    !!user && confirmText.trim().toUpperCase() === "DELETE" && !deleting;

  const clearLocalSession = async () => {
    try {
      localStorage.removeItem("w3i_token");
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("currentUser");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not fully clear local session:", e);
    }

    try {
      await logout();
    } catch (e) {
      console.warn("Logout helper failed, continuing redirect:", e);
    }

    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      setError("No signed-in user was found.");
      return;
    }

    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setError('Please type DELETE to confirm account deletion.');
      return;
    }

    const finalConfirm = window.confirm(
      isOwner
        ? "You are the owner. This will permanently delete your account and may also remove or transfer ownership depending on backend rules. Continue?"
        : "This will permanently delete your account. Continue?"
    );
    if (!finalConfirm) return;

    try {
      setDeleting(true);
      setError("");
      setSuccess("");

      if (typeof adminAPI?.deleteMyAccount !== "function") {
        throw new Error("Delete account API is not available.");
      }

      try {
        await adminAPI.deleteMyAccount({ confirm: "DELETE" });
      } catch (firstErr) {
        try {
          await adminAPI.deleteMyAccount();
        } catch (secondErr) {
          throw secondErr?.message ? secondErr : firstErr;
        }
      }

      setSuccess("Your account has been deleted successfully. Redirecting...");
      setTimeout(() => {
        clearLocalSession();
      }, 1200);
    } catch (err) {
      console.error("Account deletion error:", err);
      setError(
        err?.message ||
          "Failed to delete account. Check the backend delete endpoint and try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-page xl:flex">
      <Sidebar />

      <div className="min-w-0 flex-1 app-content">
        <DashboardShell>
          <Topbar
            connected={isConnected}
            title="Account"
            subtitle="View your profile, role, and account controls."
          />

          <SettingsHeader
            title="Account & Identity"
            subtitle="Your signed-in identity, access role, and account controls."
          />

          <SectionCard
            title="Profile"
            subtitle="Core identity details for your current signed-in account."
          >
            <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
              <div className="app-panel p-6">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-lg">
                  <FiUser className="h-10 w-10" />
                </div>

                <div className="mt-5 text-center">
                  <div className="text-2xl font-black text-slate-900">
                    {user?.full_name || "Workspace User"}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {user?.email || "-"}
                  </div>
                </div>

                <div className="mt-5 flex justify-center">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700">
                    {roleLabel}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="app-panel-soft p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiUser className="h-4 w-4" />
                    Full Name
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.full_name || "-"}
                  </div>
                </div>

                <div className="app-panel-soft p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiMail className="h-4 w-4" />
                    Email
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.email || "-"}
                  </div>
                </div>

                <div className="app-panel-soft p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiShield className="h-4 w-4" />
                    Role
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.role || "-"}
                  </div>
                </div>

                <div className="app-panel-soft p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <FiCheckCircle className="h-4 w-4" />
                    Verification
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {user?.is_verified ? "Verified" : "Unverified"}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Owner Privilege"
            subtitle="The owner remains the highest authority inside the workspace."
            className="mt-8"
          >
            <div className="app-panel-soft p-5">
              <div className="flex items-start gap-3">
                <FiCrown className="mt-1 h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Ownership rule
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    The owner has the highest privileges in the platform, including
                    organization control, approval flow, access structure, and account
                    authority. This page allows the current signed-in account to delete
                    itself when backend permissions allow it.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Danger Zone"
            subtitle="Permanently delete your account. This cannot be undone."
            className="mt-8"
          >
            <div className="danger-zone">
              <div className="flex items-start gap-3">
                <FiAlertTriangle className="mt-1 h-5 w-5 text-red-600" />
                <div>
                  <h3 className="text-lg font-bold">Delete account</h3>
                  <p className="mt-2 text-sm">
                    This removes your current account permanently. If this is your
                    temporary account, you can delete it and create your real one afterward.
                    {isOwner ? (
                      <span className="block mt-2 font-medium">
                        You are currently signed in as an owner.
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                {!showDeleteBox ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteBox(true);
                      setError("");
                      setSuccess("");
                    }}
                    className="btn-danger"
                    disabled={!user}
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Open Delete Account
                  </button>
                ) : (
                  <div className="mt-2">
                    <div className="form-group">
                      <label htmlFor="delete-confirm">
                        Type <strong>DELETE</strong> to confirm
                      </label>
                      <input
                        id="delete-confirm"
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={!canDelete}
                        className="btn-danger"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        {deleting ? "Deleting..." : "Delete My Account"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteBox(false);
                          setConfirmText("");
                          setError("");
                          setSuccess("");
                        }}
                        className="btn-light"
                        disabled={deleting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {error ? <div className="error-text">{error}</div> : null}
              {success ? <div className="success-text">{success}</div> : null}
            </div>
          </SectionCard>
        </DashboardShell>
      </div>
    </div>
  );
};

export default Account;