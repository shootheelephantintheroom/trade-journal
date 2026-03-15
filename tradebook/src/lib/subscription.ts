import { supabase } from "./supabase";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: "free" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: "active" | "canceled" | "past_due" | "none";
  trial_ends_at: string;
  created_at: string;
  updated_at: string;
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
  if (profile.plan === "pro" && profile.subscription_status === "active") return true;
  if (new Date(profile.trial_ends_at) > new Date()) return true;
  return false;
}

export function isTrialing(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.plan === "free" && new Date(profile.trial_ends_at) > new Date();
}

export function daysLeftInTrial(profile: Profile | null): number {
  if (!profile) return 0;
  const ms = new Date(profile.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
