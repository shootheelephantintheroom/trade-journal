export const FREE_FEATURES = [
  "Log trades in under 30 seconds",
  "See your real P&L — no more mental math",
  "Track win rate and streaks so you know where you stand",
  "Grade every trade A-D to build self-awareness",
  "Tag emotions to spot when feelings cost you money",
  "Export to CSV anytime — your data is yours",
  "Log missed trades so you stop hesitating on winners",
];

export const PRO_FEATURES = [
  "Everything in Free, plus:",
  "Full analytics dashboard — see the whole picture",
  "Find your most profitable hours with time-of-day analysis",
  "Know if you're holding too long or cutting too early",
  "Get flagged before revenge trading spirals your day",
  "See which catalysts actually make you money",
  "Track float size to learn which plays fit your style",
  "Attach screenshots so you can review setups visually",
  "Advanced filters to drill into exactly what's working",
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
    desc: "Most traders are profitable in one time window and bleed the rest of the day. Your data will show you exactly when to trade and when to walk away.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
    ),
    title: "Stop giving back your green days",
    desc: "Tilt detection flags consecutive losses, oversizing, and trading outside your plan — before a $500 green day turns into a $200 red one.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
    ),
    title: "Stop chasing catalysts that burn you",
    desc: "Earnings plays might be your edge — or your biggest leak. Your catalyst breakdown shows you the truth so you can cut what's not working.",
  },
  {
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    ),
    title: "Size into the right plays with confidence",
    desc: "When you know your win rate on low-float runners vs. large-caps, you stop guessing and start sizing positions based on your own track record.",
  },
];

export const FAQS = [
  {
    q: "Is MyTradeBook really free?",
    a: "Yes — the free tier is free forever with no catch. You get full trade logging, P&L tracking, win rate, streaks, trade grading, and CSV export. No credit card, no trial expiration.",
  },
  {
    q: "What results do Pro users see?",
    a: "Pro gives you the analytics that turn raw trade logs into actionable changes: time-of-day analysis to find your best hours, tilt detection to flag spiraling days early, hold-time breakdowns to fix your exits, and catalyst + float tracking to learn which setups actually fit your edge. It's $29/mo or $249/yr with a 14-day free trial.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings whenever you want. You keep Pro through the end of your billing period, then drop back to Free. No lock-in, no cancellation fees.",
  },
  {
    q: "Is my data private?",
    a: "Your trades are encrypted and only visible to you. We never share, sell, or analyze your data for any purpose other than showing it back to you.",
  },
  {
    q: "I already use a spreadsheet. Why switch?",
    a: "Spreadsheets can't show you time-of-day patterns, detect tilt in real time, or break down performance by catalyst. MyTradeBook turns your trade data into the insights that actually change behavior — in seconds, not hours of formula tweaking.",
  },
];
