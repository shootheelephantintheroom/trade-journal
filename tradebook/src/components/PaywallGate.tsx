import { useState, type ReactNode } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { supabase } from "../lib/supabase";

interface PaywallGateProps {
  feature: string;
  children: ReactNode;
}

const PRO_FEATURES = [
  "Full analytics dashboard",
  "Advanced trade journal",
  "Screenshot attachments",
  "Advanced filters & search",
  "Small-cap specific fields",
  "Detailed performance breakdowns",
];

export default function PaywallGate({ feature, children }: PaywallGateProps) {
  const { isPro, isTrialing, profile } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");

  if (isPro || isTrialing) return <>{children}</>;

  const hadPaidSubscription =
    profile?.subscription_status === "canceled" ||
    (profile?.stripe_subscription_id != null && profile?.plan === "free");

  const statusMessage = hadPaidSubscription
    ? "Your Pro subscription has ended."
    : "Your free trial has ended.";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan }),
        }
      );

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800/80 bg-gray-900/60 p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10 border border-accent-500/20">
          <svg
            className="h-6 w-6 text-accent-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h3 className="text-lg font-bold font-display text-white mb-1">
          Unlock {feature}
        </h3>
        <p className="text-sm text-gray-400 mb-1">
          {statusMessage}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Upgrade to Pro for the full trading toolkit.
        </p>

        {/* Feature list */}
        <ul className="text-left space-y-2 mb-8">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-accent-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        {/* Plan toggle */}
        <div className="mb-4 flex items-center justify-center gap-1 rounded-lg bg-gray-800/60 p-1">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              plan === "monthly"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              plan === "yearly"
                ? "bg-gray-700 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Yearly
          </button>
        </div>

        {plan === "yearly" && (
          <p className="mb-3 text-xs font-medium text-accent-400">
            Save 17% with annual billing
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-gray-950 transition-all hover:bg-accent-400 hover:shadow-[0_0_24px_rgba(0,200,83,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Redirecting..."
            : plan === "monthly"
              ? "Upgrade to Pro — $29/mo"
              : "Upgrade to Pro — $290/yr"}
        </button>

        <p className="mt-3 text-[11px] text-gray-600">
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
