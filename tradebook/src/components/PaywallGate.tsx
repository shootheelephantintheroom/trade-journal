import { useState, type ReactNode } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";
import { startProTrial, invokeEdgeFunction } from "../lib/subscription";
import { cn } from "../lib/utils";

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
  const { isPro, isTrialing, canStartTrial, profile, refetchProfile } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");

  if (isPro || isTrialing) return <>{children}</>;

  const hadPaidSubscription =
    profile?.subscription_status === "canceled" ||
    (profile?.stripe_subscription_id != null && profile?.plan === "free");
  const hadTrial = profile?.trial_ends_at !== null;

  const statusMessage = hadPaidSubscription
    ? "Your Pro subscription has ended."
    : hadTrial
      ? "Your free trial has ended."
      : "This is a Pro feature.";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const { data, error } = await invokeEdgeFunction(
        "create-checkout-session",
        { plan }
      );

      if (error) throw new Error(error);
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
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-muted">
          <svg
            className="h-6 w-6 text-brand"
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
        <h3 className="text-base font-medium text-primary mb-1">
          Unlock {feature}
        </h3>
        <p className="text-[13px] text-secondary mb-1">
          {statusMessage}
        </p>
        <p className="text-[13px] text-tertiary mb-6">
          Upgrade to Pro for the full trading toolkit.
        </p>

        {/* Feature list */}
        <ul className="text-left space-y-2 mb-8">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-secondary">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-brand"
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

        {/* Free trial CTA */}
        {canStartTrial && (
          <button
            onClick={async () => {
              setTrialLoading(true);
              try {
                const result = await startProTrial();
                if (result.success) {
                  await refetchProfile();
                } else {
                  alert(result.error || "Could not start trial. Please try again.");
                }
              } catch {
                alert("Something went wrong. Please try again.");
              } finally {
                setTrialLoading(false);
              }
            }}
            disabled={trialLoading}
            className="mb-4 w-full rounded-md border border-brand/20 bg-brand-muted px-6 py-3 text-[13px] font-medium text-brand transition-colors hover:bg-brand/15 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {trialLoading ? "Starting trial..." : "Start 14-day free trial"}
          </button>
        )}

        {/* Plan toggle */}
        <div className="mb-4 flex items-center justify-center gap-1 rounded-md bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setPlan("monthly")}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-[13px] font-medium transition-colors",
              plan === "monthly"
                ? "bg-surface-3 text-primary"
                : "text-tertiary hover:text-secondary"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPlan("yearly")}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-[13px] font-medium transition-colors",
              plan === "yearly"
                ? "bg-surface-3 text-primary"
                : "text-tertiary hover:text-secondary"
            )}
          >
            Yearly
          </button>
        </div>

        {plan === "yearly" && (
          <p className="mb-3 text-xs font-medium text-profit">
            Save 28% with annual billing
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-md bg-brand px-6 py-3 text-[13px] font-medium text-surface-0 transition-colors hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Redirecting..."
            : plan === "monthly"
              ? "Upgrade to Pro — $29/mo"
              : "Upgrade to Pro — $249/yr"}
        </button>

        <p className="mt-3 text-[11px] text-tertiary">
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
