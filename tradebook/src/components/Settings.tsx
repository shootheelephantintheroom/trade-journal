import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { startProTrial, invokeEdgeFunction } from "../lib/subscription";
import { useToast } from "./Toast";
import { cn } from "../lib/utils";

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
  "w-full rounded-lg border border-transparent bg-surface-2 px-3 py-2.5 text-sm text-primary placeholder-tertiary hover:border-border-hover focus:border-brand focus:outline-none transition-colors";
const labelClass =
  "block text-xs font-medium text-secondary uppercase tracking-wide mb-1.5";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, subscription, isPro, isTrialing, canStartTrial, daysLeftInTrial, refetchProfile } =
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

  // Start trial
  const [startingTrial, setStartingTrial] = useState(false);

  // Manage subscription
  const [managingSubscription, setManagingSubscription] = useState(false);

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
      const { error } = await invokeEdgeFunction("delete-account");
      if (error) {
        throw new Error("Failed to delete account");
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

  async function handleStartTrial() {
    if (!user) return;
    setStartingTrial(true);
    try {
      const result = await startProTrial();
      if (result.success) {
        await refetchProfile();
        showToast("Your 14-day Pro trial is now active!", "success");
      } else {
        showToast(result.error ?? "Failed to start trial. Please try again.", "error");
      }
    } catch {
      showToast("Failed to start trial. Please try again.", "error");
    }
    setStartingTrial(false);
  }

  async function handleManageSubscription() {
    setManagingSubscription(true);
    try {
      const { data, error } = await invokeEdgeFunction("create-portal-session");
      if (error || !data?.url) {
        showToast(error ?? "Failed to open billing portal", "error");
      } else {
        window.location.href = data.url;
      }
    } catch {
      showToast("Failed to open billing portal", "error");
    }
    setManagingSubscription(false);
  }

  function formatRenewalDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function planLabel() {
    if (isTrialing) return "Free Trial";
    if (isPro) return "Pro";
    return "Free";
  }

  function planBadgeClass() {
    if (isTrialing) return "bg-amber-muted text-amber border-amber/20";
    if (isPro) return "bg-brand-muted text-brand border-brand/20";
    return "bg-surface-2 text-tertiary border-border";
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-tertiary hover:text-secondary transition-colors"
      >
        &larr; Back
      </button>

      <h2 className="text-xl font-semibold text-primary">Account Settings</h2>

      {/* Plan Status */}
      <div className="bg-surface-1 rounded-lg p-6 space-y-4">
        <h3 className="text-sm font-semibold text-primary">Current Plan</h3>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-block px-2.5 py-1 rounded-md text-xs font-medium border",
              planBadgeClass()
            )}
          >
            {planLabel()}
          </span>
        </div>

        {/* Subscription renewal / cancellation info for Pro users */}
        {isPro && !isTrialing && subscription?.current_period_end && (
          <p className="text-sm text-secondary">
            {subscription.cancel_at_period_end
              ? `Your subscription will be cancelled on ${formatRenewalDate(subscription.current_period_end)}`
              : `Your subscription will auto renew on ${formatRenewalDate(subscription.current_period_end)}`}
          </p>
        )}

        {/* Trial info */}
        {isTrialing && (
          <p className="text-sm text-secondary">
            Free trial · {daysLeftInTrial} day{daysLeftInTrial !== 1 ? "s" : ""} remaining
          </p>
        )}

        {/* Free user prompt */}
        {!isPro && !isTrialing && (
          <p className="text-sm text-secondary">
            Upgrade to unlock all features
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canStartTrial && (
            <button
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-surface-0 font-medium text-sm px-4 py-2 rounded-md transition-colors"
            >
              {startingTrial ? "Starting..." : "Start 14-Day Pro Trial"}
            </button>
          )}
          {isPro && !isTrialing && (
            <button
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="bg-surface-2 hover:bg-surface-3 disabled:opacity-40 text-primary font-medium text-sm px-4 py-2 rounded-md transition-colors"
            >
              {managingSubscription ? "Opening..." : "Manage Subscription"}
            </button>
          )}
        </div>
      </div>

      {/* Display Name */}
      <div className="bg-surface-1 rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold text-primary">Display Name</h3>
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
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-surface-0 font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          {savingName ? "Saving..." : "Save Name"}
        </button>
      </div>

      {/* Email */}
      <div className="bg-surface-1 rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold text-primary">Email Address</h3>
        <p className="text-xs text-tertiary">
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
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-surface-0 font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          {savingEmail ? "Sending..." : "Change Email"}
        </button>
      </div>

      {/* Password */}
      <div className="bg-surface-1 rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold text-primary">Password</h3>
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
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-surface-0 font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* Timezone */}
      <div className="bg-surface-1 rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold text-primary">Timezone</h3>
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
          className="bg-brand hover:bg-brand-hover disabled:opacity-40 text-surface-0 font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          {savingTimezone ? "Saving..." : "Save Timezone"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface-1 rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold text-loss">Danger Zone</h3>
        <p className="text-xs text-tertiary">
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
          className="bg-loss hover:bg-loss/90 disabled:opacity-40 text-primary font-medium text-sm px-4 py-2 rounded-md transition-colors"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
