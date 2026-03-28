import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { startProTrial, invokeEdgeFunction } from "../lib/subscription";
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
  "w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors";
const labelClass =
  "block text-[13px] font-medium text-secondary mb-1.5";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, subscription, isPro, isTrialing, canStartTrial, daysLeftInTrial, refetchProfile } =
    useSubscription();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Refetch subscription data on mount (catches Stripe portal changes)
  useEffect(() => {
    refetchProfile();
  }, [refetchProfile]);

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


  return (
    <div className="max-w-md mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="text-[13px] text-tertiary hover:text-secondary transition-colors"
      >
        &larr; Back
      </button>

      <h2 className="text-base font-medium text-primary">Account Settings</h2>

      {/* Plan Status */}
      <div className="space-y-4">
        <h3 className="text-[13px] font-medium text-secondary mb-3">Current Plan</h3>
        <div className="flex items-center gap-3">
          <span className="text-[11px] px-1.5 py-0.5 bg-brand/10 text-brand rounded-[4px] font-medium">
            {planLabel()}
          </span>
        </div>

        {/* Subscription renewal / cancellation info for Pro users */}
        {isPro && !isTrialing && subscription?.current_period_end && (
          <p className="text-[13px] text-secondary">
            {subscription.cancel_at_period_end
              ? `Your subscription will expire on ${formatRenewalDate(subscription.current_period_end)}`
              : `Your subscription will auto renew on ${formatRenewalDate(subscription.current_period_end)}`}
          </p>
        )}

        {/* Trial info */}
        {isTrialing && (
          <p className="text-[13px] text-secondary">
            Free trial · {daysLeftInTrial} day{daysLeftInTrial !== 1 ? "s" : ""} remaining
          </p>
        )}

        {/* Free user prompt */}
        {!isPro && !isTrialing && (
          <p className="text-[13px] text-secondary">
            Upgrade to unlock all features
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {canStartTrial && (
            <button
              onClick={handleStartTrial}
              disabled={startingTrial}
              className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
            >
              {startingTrial ? "Starting..." : "Start 14-Day Pro Trial"}
            </button>
          )}
          {isPro && !isTrialing && (
            <button
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
            >
              {managingSubscription ? "Opening..." : "Manage Subscription"}
            </button>
          )}
        </div>
      </div>

      {/* Display Name */}
      <div className="h-px bg-white/[0.04]" />
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-secondary">Display Name</h3>
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
          className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
        >
          {savingName ? "Saving..." : "Save Name"}
        </button>
      </div>

      {/* Email */}
      <div className="h-px bg-white/[0.04]" />
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-secondary">Email Address</h3>
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
          className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
        >
          {savingEmail ? "Sending..." : "Change Email"}
        </button>
      </div>

      {/* Password */}
      <div className="h-px bg-white/[0.04]" />
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-secondary">Password</h3>
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
          className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
        >
          {savingPassword ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* Timezone */}
      <div className="h-px bg-white/[0.04]" />
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-secondary">Timezone</h3>
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
          className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
        >
          {savingTimezone ? "Saving..." : "Save Timezone"}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="h-px bg-white/[0.04]" />
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-loss">Danger Zone</h3>
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
          className="text-[13px] px-3 py-1.5 bg-loss/10 text-loss rounded-[6px] hover:bg-loss/20 disabled:opacity-40 transition-colors"
        >
          {deleting ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}
