export const FREE_FEATURES = [
  "Manual trade logging",
  "Basic P&L tracking",
  "Win rate & streaks",
  "Trade grading (A–D)",
  "Emotional tagging",
  "CSV export",
  "Missed trade tracking",
];

export const PRO_FEATURES = [
  "Everything in Free",
  "Full analytics dashboard",
  "Time-of-day analysis",
  "Hold-time breakdowns",
  "Tilt detection",
  "Catalyst performance tracking",
  "Float & small-cap fields",
  "Screenshot attachments",
  "Advanced filters & search",
];

export const MOMENTUM_CALLOUTS = [
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
    title: "Know your best time windows",
    desc: "See exactly which hours you're most profitable. Stop trading the dead zones and double down on your hot windows.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
    ),
    title: "Stop revenge trading",
    desc: "Tilt detection flags when you're spiraling — consecutive losses, oversizing, or trading outside your plan. Catch it before it costs you.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
    ),
    title: "Find your edge by catalyst",
    desc: "Earnings, FDA, short squeezes — see which catalysts actually make you money and which ones you should stop chasing.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    ),
    title: "Track what the float tells you",
    desc: "Log float size on every trade. See how low-float vs. high-float plays perform in your own data — not someone else's.",
  },
];

export const FAQS = [
  {
    q: "Is MyTradeBook really free?",
    a: "Yes — the free tier is free forever. You get full trade logging, basic P&L, win rate tracking, and CSV export. No credit card required.",
  },
  {
    q: "What does Pro include?",
    a: "Pro unlocks the full analytics suite: time-of-day analysis, tilt detection, hold-time breakdowns, catalyst performance, float tracking, screenshot attachments, and advanced filters. It's $29/mo or $249/yr. You can start a free 14-day trial from your Account Settings.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel your Pro subscription anytime from your account settings. You'll keep Pro access through the end of your billing period, then drop back to the free tier. No lock-in.",
  },
  {
    q: "Is my data private?",
    a: "Your trades are stored securely and are only visible to you. We never share or sell your data.",
  },
  {
    q: "Can I export my trades?",
    a: "Yes. You can export your full trade history to CSV at any time — even on the free tier.",
  },
];
