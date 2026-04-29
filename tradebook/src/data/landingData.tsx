export const FREE_FEATURES = [
  "Log trades in 30 seconds",
  "Real-time P&L tracking",
  "Win rate and streak tracking",
  "Grade trades A–D to build self-awareness",
  "Emotion tagging to spot costly patterns",
  "CSV export — your data is yours",
  "Missed trade logging",
];

export const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Full analytics dashboard",
  "Time-of-day analysis to find your best hours",
  "Hold-time breakdowns to fix entries and exits",
  "Tilt detection before revenge trading starts",
  "Catalyst performance breakdown",
  "Float-size tracking by setup",
  "Screenshot attachments for visual review",
  "Advanced filters to isolate what works",
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
    title: "Trade fewer hours, make more money",
    desc: "Most traders are profitable in one time window and bleed the rest. Your data shows exactly when to trade and when to stop.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
    ),
    title: "Stop giving back green days",
    desc: "Tilt detection flags consecutive losses, oversizing, and off-plan trades before a green day turns red.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
    ),
    title: "Know which catalysts pay",
    desc: "Earnings plays might be your edge — or your biggest leak. Catalyst breakdowns show you which to keep and which to cut.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    ),
    title: "Size with confidence",
    desc: "When you know your win rate by float and setup, you stop guessing and start sizing based on your own track record.",
  },
];

export const FAQS = [
  {
    q: "Is it really free?",
    a: "Yes. The free tier is free forever. Trade logging, P&L tracking, win rate, streaks, trade grading, and CSV export — all included.",
  },
  {
    q: "What does Pro include?",
    a: "Time-of-day analysis, tilt detection, hold-time breakdowns, catalyst and float tracking, screenshot attachments, and advanced filters. $15/mo or $129/yr with a 14-day free trial.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from account settings anytime. You keep Pro through the end of your billing period, then revert to Free. No lock-in.",
  },
  {
    q: "Is my data private?",
    a: "Your trades are encrypted and visible only to you. We never share, sell, or analyze your data.",
  },
  {
    q: "I already use a spreadsheet. Why switch?",
    a: "Spreadsheets can't surface time-of-day patterns, detect tilt, or break down performance by catalyst. MyTradeBook turns raw trades into actionable insights in seconds.",
  },
];
