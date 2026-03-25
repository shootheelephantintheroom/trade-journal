import { supabase } from "./supabase";

/** Call a Supabase Edge Function with a guaranteed-fresh auth token */
export async function invokeEdgeFunction(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: any; error: string | null }> {
  // refreshSession() forces a token refresh so we never send an expired JWT
  let session: { access_token: string } | null = null;
  const { data: refreshed } = await supabase.auth.refreshSession();
  session = refreshed.session;
  if (!session) {
    // fallback: try cached session (covers edge cases where refresh fails but session is still valid)
    const { data: cached } = await supabase.auth.getSession();
    session = cached.session;
  }
  if (!session) return { data: null, error: "Not authenticated" };

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) return { data: null, error: data?.error ?? `HTTP ${res.status}` };
  return { data, error: null };
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: "active" | "canceled" | "past_due" | "none";
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  onboarded: boolean;
  trading_styles: string[];
  default_shares: number | null;
  default_commission: number | null;
  timezone: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as Profile;
}

export function isPro(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.plan === "pro" && (profile.subscription_status === "active" || profile.subscription_status === "past_due")) return true;
  if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) return true;
  return false;
}

export function isTrialing(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.plan === "free" && !!profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date();
}

export function daysLeftInTrial(profile: Profile | null): number {
  if (!profile || !profile.trial_ends_at) return 0;
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Returns true if the user has never started a Pro trial */
export function canStartTrial(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.plan === "free" && profile.trial_ends_at === null && profile.subscription_status === "none";
}

/** Starts a 14-day Pro trial for the user via Edge Function */
export async function startProTrial(): Promise<{ success: boolean; error?: string }> {
  const { error } = await invokeEdgeFunction("start-trial");
  if (error) return { success: false, error };
  return { success: true };
}
