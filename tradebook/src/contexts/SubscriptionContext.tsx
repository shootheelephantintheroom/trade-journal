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
  isPro as checkIsPro,
  isTrialing as checkIsTrialing,
  daysLeftInTrial as calcDaysLeft,
  type Profile,
} from "../lib/subscription";

interface SubscriptionContextType {
  profile: Profile | null;
  loading: boolean;
  isPro: boolean;
  isTrialing: boolean;
  daysLeftInTrial: number;
  refetchProfile: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const p = await getProfile(user.id);
    setProfile(p);
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
        loading,
        isPro: checkIsPro(profile),
        isTrialing: checkIsTrialing(profile),
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
