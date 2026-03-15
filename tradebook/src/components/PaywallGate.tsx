import type { ReactNode } from "react";
import { useSubscription } from "../contexts/SubscriptionContext";

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
  const { isPro, isTrialing } = useSubscription();

  if (isPro || isTrialing) return <>{children}</>;

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
        <p className="text-sm text-gray-400 mb-6">
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

        {/* CTA */}
        <button
          className="w-full rounded-xl bg-accent-500 px-6 py-3 text-sm font-semibold text-gray-950 transition-all hover:bg-accent-400 hover:shadow-[0_0_24px_rgba(0,200,83,0.25)] active:scale-[0.98]"
        >
          Upgrade to Pro
        </button>

        <p className="mt-3 text-[11px] text-gray-600">
          Your 14-day free trial has ended.
        </p>
      </div>
    </div>
  );
}
