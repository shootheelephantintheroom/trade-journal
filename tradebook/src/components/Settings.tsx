import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { startProTrial, invokeEdgeFunction } from "../lib/subscription";
import { get24hClock, set24hClock } from "../lib/clockFormat";
import { cn } from "../lib/utils";
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
  "w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-base sm:text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors";
const labelClass =
  "block text-[13px] font-medium text-secondary mb-1.5";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { profile, isPro, isTrialing, canStartTrial, daysLeftInTrial, refetchProfile } =
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

  // Upgrade
  const [upgradePlan, setUpgradePlan] = useState<"monthly" | "yearly">("yearly");
  const [upgrading, setUpgrading] = useState(false);

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Clock format
  const [use24h, setUse24h] = useState(get24hClock);

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
      const { error } = await invokeEdgeFunction<void>("delete-account");
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
      const { data, error } = await invokeEdgeFunction<{ url: string }>("create-portal-session");
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

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const { data, error } = await invokeEdgeFunction<{ url: string }>("create-checkout-session", { plan: upgradePlan });
      if (error || !data?.url) {
        showToast(error ?? "Failed to start checkout", "error");
      } else {
        window.location.href = data.url;
      }
    } catch {
      showToast("Something went wrong. Please try again.", "error");
    }
    setUpgrading(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be under 2 MB", "error");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      showToast("Failed to upload image", "error");
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      showToast("Failed to save avatar", "error");
    } else {
      await refetchProfile();
      showToast("Profile picture updated", "success");
    }
    setUploadingAvatar(false);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
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

      {/* Profile Picture */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-secondary">Profile Picture</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative h-16 w-16 rounded-full bg-surface-3 border border-white/[0.06] flex items-center justify-center overflow-hidden group hover:border-white/[0.15] transition-colors shrink-0"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-zinc-300">
                {user?.user_metadata?.display_name?.charAt(0)?.toUpperCase() ??
                  user?.email?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
            >
              {uploadingAvatar ? "Uploading..." : "Upload Photo"}
            </button>
            <p className="text-[11px] text-tertiary mt-1">JPG, PNG, or GIF. Max 2 MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
      </div>

      <div className="h-px bg-white/[0.04]" />

      {/* Plan Status */}
      <div className="space-y-4">
        <h3 className="text-[13px] font-medium text-secondary">Current Plan</h3>
        <div className="flex items-center gap-3">
          <span className="text-[11px] px-1.5 py-0.5 bg-brand/10 text-brand rounded-[4px] font-medium">
            {planLabel()}
          </span>
        </div>

        {/* Trial info */}
        {isTrialing && (
          <p className="text-[13px] text-secondary">
            Free trial · {daysLeftInTrial} day{daysLeftInTrial !== 1 ? "s" : ""} remaining
          </p>
        )}

        {/* Pro — manage subscription */}
        {isPro && !isTrialing && (
          <button
            onClick={handleManageSubscription}
            disabled={managingSubscription}
            className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
          >
            {managingSubscription ? "Opening..." : "Manage Subscription"}
          </button>
        )}

        {/* Upgrade section for non-paid users */}
        {(!isPro || isTrialing) && (
          <div className="space-y-3">
            {canStartTrial && (
              <button
                onClick={handleStartTrial}
                disabled={startingTrial}
                className="w-full text-[13px] px-3 py-2 border border-brand/20 bg-brand-muted text-brand rounded-[6px] hover:bg-brand/15 disabled:opacity-40 transition-colors"
              >
                {startingTrial ? "Starting..." : "Start 14-Day Pro Trial"}
              </button>
            )}

            <div className="flex h-[34px] rounded-[6px] border border-white/[0.04] bg-transparent p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => setUpgradePlan("monthly")}
                className={cn(
                  "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
                  upgradePlan === "monthly"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-400"
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setUpgradePlan("yearly")}
                className={cn(
                  "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
                  upgradePlan === "yearly"
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-400"
                )}
              >
                Yearly
              </button>
            </div>

            {upgradePlan === "yearly" && (
              <p className="text-[11px] text-profit font-medium">Save 28% with annual billing</p>
            )}

            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full rounded-[6px] bg-brand px-3 py-2 text-[13px] font-medium text-surface-0 transition-colors hover:bg-brand/90 disabled:opacity-40"
            >
              {upgrading
                ? "Redirecting..."
                : upgradePlan === "monthly"
                  ? "Upgrade to Pro — $15/mo"
                  : "Upgrade to Pro — $129/yr"}
            </button>
          </div>
        )}
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
              <option key={tz.value} value={tz.value} className="bg-[#1a1a1a] text-white">
                {tz.label}
              </option>
            ))}
            {!TIMEZONES.some((tz) => tz.value === timezone) && (
              <option value={timezone} className="bg-[#1a1a1a] text-white">{timezone}</option>
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

      {/* Clock Format */}
      <div className="h-px bg-white/[0.04]" />
      <div className="space-y-3">
        <h3 className="text-[13px] font-medium text-secondary">Clock Format</h3>
        <div className="flex h-[34px] rounded-[6px] border border-white/[0.04] bg-transparent p-0.5 gap-0.5 max-w-[200px]">
          <button
            type="button"
            onClick={() => { set24hClock(false); setUse24h(false); }}
            className={cn(
              "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
              !use24h ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            12h
          </button>
          <button
            type="button"
            onClick={() => { set24hClock(true); setUse24h(true); }}
            className={cn(
              "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
              use24h ? "bg-white/[0.08] text-white" : "text-zinc-500 hover:text-zinc-400"
            )}
          >
            24h
          </button>
        </div>
        <p className="text-[11px] text-tertiary">
          Controls time display across the app
        </p>
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
