import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useToast } from "./Toast";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const inputClass =
  "w-full rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors";
const labelClass =
  "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, isPro, isTrialing, daysLeftInTrial, refetchProfile } =
    useSubscription();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Display name
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name ?? ""
  );
  const [savingName, setSavingName] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Timezone
  const [timezone, setTimezone] = useState(profile?.timezone ?? "America/New_York");
  const [savingTimezone, setSavingTimezone] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleUpdateName() {
    if (!displayName.trim()) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    if (error) {
      showToast(error.message, "error");
      setSavingName(false);
      return;
    }
    if (user) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);
    }
    showToast("Display name updated", "success");
    setSavingName(false);
  }

  async function handleUpdateEmail() {
    if (!newEmail.trim()) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Confirmation email sent to your new address", "success");
      setNewEmail("");
    }
    setSavingEmail(false);
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Password updated", "success");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  async function handleUpdateTimezone() {
    if (!user) return;
    setSavingTimezone(true);
    const { error } = await supabase
      .from("profiles")
      .update({ timezone })
      .eq("id", user.id);
    if (error) {
      showToast(error.message, "error");
    } else {
      await refetchProfile();
      showToast("Timezone updated", "success");
    }
    setSavingTimezone(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        showToast("Not authenticated", "error");
        setDeleting(false);
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete account");
      }
      await signOut();
      navigate("/", { replace: true });
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete account",
        "error"
      );
      setDeleting(false);
    }
  }

  function planLabel() {
    if (isPro) return "Pro";
    if (isTrialing) return "Trial";
    return "Free";
  }

  function planBadgeClass() {
    if (isPro) return "bg-accent-500/15 text-accent-400 border-accent-500/30";
    if (isTrialing) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    return "bg-gray-700/40 text-gray-400 border-gray-600/30";
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        &larr; Back
      </button>

      <h2 className="text-xl font-bold text-white">Account Settings</h2>

      {/* Plan Status */}
      <div className="card-panel p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Current Plan</h3>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${planBadgeClass()}`}
          >
            {planLabel()}
          </span>
          {isTrialing && (
            <span className="text-xs text-gray-500">
              {daysLeftInTrial} day{daysLeftInTrial !== 1 ? "s" : ""} remaining
            </span>
          )}
          {isPro && !isTrialing && (
            <span className="text-xs text-gray-500">Active subscription</span>
          )}
          {!isPro && !isTrialing && (
            <span className="text-xs text-gray-500">
              Upgrade to unlock all features
            </span>
          )}
        </div>
      </div>

      {/* Display Name */}
      <div className="card-panel p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Display Name</h3>
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />
        </div>
        <button
          onClick={handleUpdateName}
          disabled={savingName || !displayName.trim()}
          className="bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {savingName ? "Saving..." : "Save Name"}
        </button>
      </div>

      {/* Email */}
      <div className="card-panel p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Email Address</h3>
        <p className="text-xs text-gray-500">
          Current: {user?.email ?? "—"}
        </p>
        <div>
          <label className={labelClass}>New Email</label>
          <input
            type="email"
            className={inputClass}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@email.com"
          />
        </div>
        <button
          onClick={handleUpdateEmail}
          disabled={savingEmail || !newEmail.trim()}
          className="bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {savingEmail ? "Sending..." : "Change Email"}
        </button>
      </div>

      {/* Password */}
      <div className="card-panel p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Password</h3>
        <div>
          <label className={labelClass}>New Password</label>
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className={labelClass}>Confirm Password</label>
          <input
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
        <button
          onClick={handleUpdatePassword}
          disabled={savingPassword || !newPassword}
          className="bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* Timezone */}
      <div className="card-panel p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Timezone</h3>
        <div>
          <label className={labelClass}>Timezone</label>
          <select
            className={inputClass}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
            {!TIMEZONES.some((tz) => tz.value === timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
          </select>
        </div>
        <button
          onClick={handleUpdateTimezone}
          disabled={savingTimezone}
          className="bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {savingTimezone ? "Saving..." : "Save Timezone"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card-panel border-red-900/50 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
        <p className="text-xs text-gray-500">
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <div>
          <label className={labelClass}>
            Type DELETE to confirm
          </label>
          <input
            className={inputClass}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
          />
        </div>
        <button
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== "DELETE" || deleting}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
