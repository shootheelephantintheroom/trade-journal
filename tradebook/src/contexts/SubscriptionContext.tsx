import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getProfile,
  getSubscription,
  isPro as checkIsPro,
  isTrialing as checkIsTrialing,
  daysLeftInTrial as calcDaysLeft,
  canStartTrial as checkCanStartTrial,
  type Profile,
  type Subscription,
} from "../lib/subscription";

interface SubscriptionContextType {
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  isPro: boolean;
  isPastDue: boolean;
  isTrialing: boolean;
  canStartTrial: boolean;
  daysLeftInTrial: number;
  refetchProfile: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setSubscription(null);
      setLoading(false);
      return;
    }
    const [p, sub] = await Promise.all([
      getProfile(user.id),
      getSubscription(user.id),
    ]);
    setProfile(p);
    setSubscription(sub);
    setLoading(false);
  }, [user]);

  // Fetch on auth change
  useEffect(() => {
    setLoading(true);
    fetchProfile();
  }, [fetchProfile]);

  // Re-fetch when window regains focus (returning from Stripe checkout, etc.)
  useEffect(() => {
    const onFocus = () => {
      if (user) fetchProfile();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user, fetchProfile]);

  return (
    <SubscriptionContext.Provider
      value={{
        profile,
        subscription,
        loading,
        isPro: checkIsPro(profile),
        isPastDue: profile?.subscription_status === "past_due",
        isTrialing: checkIsTrialing(profile),
        canStartTrial: checkCanStartTrial(profile),
        daysLeftInTrial: calcDaysLeft(profile),
        refetchProfile: fetchProfile,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx)
    throw new Error(
      "useSubscription must be used within SubscriptionProvider"
    );
  return ctx;
}
