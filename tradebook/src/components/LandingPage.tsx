import { useState, useEffect, Fragment } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/* ── Data ── */

const FREE_FEATURES = [
  "Manual trade logging",
  "Basic P&L tracking",
  "Win rate & streaks",
  "Trade grading (A–D)",
  "Emotional tagging",
  "CSV export",
  "Missed trade tracking",
];

const PRO_FEATURES = [
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

const MOMENTUM_CALLOUTS = [
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

/* TODO: Replace these placeholder testimonials with real user quotes before launch */
const TESTIMONIALS = [
  {
    quote: "finally stopped using google sheets lol",
    name: "Dan",
  },
  {
    quote:
      "went back through my trades from last month and realized I was giving back like $200-300 every afternoon on low floaters after 2pm. would have never caught that without the time of day breakdown",
    name: "Sarah",
  },
  {
    quote:
      "took me about a week to actually use it every day but once I got in the habit it was kinda eye opening. found out my win rate on stuff like BBAI and MULN was way higher than I thought but I kept sizing too small. sized up in feb and had my best month",
    name: "Jess",
  },
  {
    quote:
      "wish it had broker import but for manual logging its solid. the emotional tagging thing caught me revenge trading way more than I realized",
    name: "Ray",
  },
];

const FAQS = [
  {
    q: "Is MyTradeBook really free?",
    a: "Yes — the free tier is free forever. You get full trade logging, basic P&L, win rate tracking, and CSV export. No credit card required.",
  },
  {
    q: "What does Pro include?",
    a: "Pro unlocks the full analytics suite: time-of-day analysis, tilt detection, hold-time breakdowns, catalyst performance, float tracking, screenshot attachments, and advanced filters. It's $29/mo after a 14-day free trial.",
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

const STEPS = [
  {
    step: "1",
    title: "Log Your Trade",
    desc: "Enter your ticker, entry/exit, share size, and tag your emotions and setup. Grade yourself honestly.",
  },
  {
    step: "2",
    title: "Review Your Patterns",
    desc: "See your win rate, streaks, daily P&L, and which mistakes keep costing you money.",
  },
  {
    step: "3",
    title: "Improve Your Edge",
    desc: "Cut the bad habits, double down on what works, and watch your consistency grow.",
  },
];

/* ── Helpers ── */

function CheckIcon({ className = "mt-0.5 h-4 w-4 shrink-0 text-accent-500" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

/* ── Component ── */

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pricingPlan, setPricingPlan] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* ───── Header ───── */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "bg-gray-950/90 backdrop-blur-md border-gray-800"
            : "bg-gray-950 border-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-display font-bold tracking-tight text-white">
            MyTradeBook
          </h1>
          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:inline-block"
            >
              Pricing
            </a>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login?mode=signup"
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold bg-accent-600 hover:bg-accent-500 text-white transition-all duration-300 ${
                scrolled
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ───── Hero ───── */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-8 sm:pt-36 sm:pb-12 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="hero-glow w-[500px] h-[350px] sm:w-[700px] sm:h-[450px] rounded-full bg-accent-500/20 blur-[120px]" />
          </div>

          <div className="relative text-center max-w-2xl z-10">
            <h2 className="hero-enter font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
              Stop guessing.
              <br />
              <span className="text-accent-400">Start knowing.</span>
            </h2>
            <p className="hero-enter-d1 text-gray-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-2">
              The trade journal built for intraday momentum traders. Log trades
              in seconds, then let the analytics show you exactly where you're
              leaking money.
            </p>
            <p className="hero-enter-d1 text-gray-500 text-sm max-w-md mx-auto mb-10">
              Used by small-cap day traders who are done losing to themselves.
            </p>
            <div className="hero-enter-d2">
              <Link
                to="/login?mode=signup"
                className="cta-btn inline-block bg-accent-600 hover:bg-accent-500 text-white font-display font-semibold text-base sm:text-lg px-10 py-4 rounded-xl"
              >
                Start Free — No Credit Card
              </Link>
              <p className="text-gray-500 text-xs mt-3 tracking-wide">
                Free forever. Upgrade to Pro when you're ready.
              </p>
            </div>
          </div>
        </section>

        {/* ───── How It Works ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-16">
              How It Works
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-start gap-10 sm:gap-0">
              {STEPS.map((item, i) => (
                <Fragment key={item.step}>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-950 border-2 border-accent-500/40 flex items-center justify-center mx-auto mb-5 relative z-10">
                      <span className="text-accent-400 font-display font-bold">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-[240px] mx-auto">
                      {item.desc}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="hidden sm:flex items-center shrink-0 mt-[18px]">
                      <div className="w-8 h-px bg-accent-500/25" />
                      <svg
                        className="w-3 h-3 text-accent-500/40 shrink-0 -mx-0.5"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M4 2l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="w-8 h-px bg-accent-500/25" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Feature Tiers (Free vs Pro cards) ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              Everything You Need to Get Better
            </h2>
            <p className="text-gray-500 text-sm text-center mb-14 max-w-lg mx-auto">
              Start free. Unlock the full edge when you're ready.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free tier card */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8">
                <div className="text-sm font-medium text-gray-400 mb-1">Free</div>
                <div className="font-display text-3xl font-bold text-white mb-1">
                  $0
                </div>
                <div className="text-xs text-gray-500 mb-6">Forever</div>
                <ul className="space-y-3">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=signup"
                  className="mt-8 block w-full text-center rounded-xl border border-gray-700 bg-gray-800/50 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-gray-600 hover:bg-gray-800"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro tier card — highlighted */}
              <div className="relative bg-gray-900/60 border-2 border-accent-500/40 rounded-2xl p-8">
                <div className="absolute -top-3 left-6 bg-accent-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <div className="text-sm font-medium text-accent-400 mb-1">Pro</div>
                <div className="font-display text-3xl font-bold text-white mb-1">
                  $29<span className="text-base font-normal text-gray-400">/mo</span>
                </div>
                <div className="text-xs text-gray-500 mb-6">14-day free trial</div>
                <ul className="space-y-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=signup"
                  className="cta-btn mt-8 block w-full text-center rounded-xl bg-accent-600 hover:bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition-all"
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Built for Momentum Traders ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              Built for Momentum Traders
            </h2>
            <p className="text-gray-500 text-sm text-center mb-14 max-w-lg mx-auto">
              Not a generic journal. Every feature is designed for intraday small-cap traders.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {MOMENTUM_CALLOUTS.map((item) => (
                <div
                  key={item.title}
                  className="feature-card bg-gray-900/40 border border-gray-800 rounded-2xl p-7"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-5">
                    <svg
                      className="w-5 h-5 text-accent-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <h3 className="font-display text-base font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Dashboard Preview ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-4xl mx-auto dashboard-wrapper">
            <div className="dashboard-float relative">
              <img
                src="/dashboard-preview.png"
                alt="MyTradeBook dashboard showing P&L, win rate, equity curve, and trade history"
                className="w-full rounded-xl border border-gray-800 relative z-10"
              />
              <div className="absolute -bottom-8 left-[10%] right-[10%] h-24 bg-accent-500/10 rounded-full blur-[60px]" />
            </div>
          </div>
        </section>

        {/* ───── Pricing ───── */}
        <section id="pricing" className="px-4 py-20 sm:py-28 reveal scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              Simple Pricing
            </h2>
            <p className="text-gray-500 text-sm text-center mb-14 max-w-md mx-auto">
              Start free. Upgrade when the analytics pay for themselves.
            </p>

            {/* Monthly/Yearly toggle */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="flex items-center gap-1 rounded-full bg-gray-800/70 border border-gray-700/50 p-1.5">
                <button
                  type="button"
                  onClick={() => setPricingPlan("monthly")}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    pricingPlan === "monthly"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPricingPlan("yearly")}
                  className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    pricingPlan === "yearly"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  Yearly
                </button>
              </div>
              {pricingPlan === "yearly" && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400 tracking-wide">
                  Save 28%
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Free */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 flex flex-col">
                <div className="text-sm font-medium text-gray-400 mb-1">Free</div>
                <div className="font-display text-4xl font-bold text-white mb-1">
                  $0
                </div>
                <div className="text-xs text-gray-500 mb-8">Free forever</div>
                <ul className="space-y-3 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=signup"
                  className="mt-8 block w-full text-center rounded-xl border border-gray-700 bg-gray-800/50 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-gray-600 hover:bg-gray-800"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro */}
              <div className="relative bg-gray-900/60 border-2 border-accent-500/40 rounded-2xl p-8 flex flex-col">
                <div className="absolute -top-3 left-6 bg-accent-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Recommended
                </div>
                <div className="text-sm font-medium text-accent-400 mb-1">Pro</div>
                {pricingPlan === "monthly" ? (
                  <>
                    <div className="font-display text-4xl font-bold text-white mb-1">
                      $29<span className="text-lg font-normal text-gray-400">/mo</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-8">
                      14-day free trial included
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display text-4xl font-bold text-white">
                        $249<span className="text-lg font-normal text-gray-400">/yr</span>
                      </span>
                      <span className="text-base text-gray-500 line-through">$348</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-8">
                      ~$20.75/mo · 14-day free trial included
                    </div>
                  </>
                )}
                <ul className="space-y-3 flex-1">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=signup"
                  className="cta-btn mt-8 block w-full text-center rounded-xl bg-accent-600 hover:bg-accent-500 px-6 py-3.5 text-sm font-semibold text-white transition-all"
                >
                  Start 14-Day Free Trial
                </Link>
                <p className="text-[11px] text-gray-500 text-center mt-3">
                  No credit card required to start
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Social Proof ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent-600/10 border border-accent-500/20 rounded-full px-5 py-2 mb-12">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-500" />
              </span>
              <span className="text-sm text-accent-400 font-medium">
                Built for momentum day traders
              </span>
            </div>

            {/* TODO: Replace with real user testimonials before launch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="bg-gray-900/40 border border-gray-800/50 rounded-xl p-6 text-left"
                >
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    "{t.quote}"
                  </p>
                  <div className="text-xs text-gray-500">
                    — {t.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Bold Quote ───── */}
        <section className="px-4 py-20 sm:py-32 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-px bg-accent-500 mx-auto mb-10" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-light italic text-gray-200 leading-relaxed tracking-tight">
              "Every trade you don't journal is a lesson you'll pay for twice."
            </p>
            <div className="w-12 h-px bg-accent-500 mx-auto mt-10" />
          </div>
        </section>

        {/* ───── FAQ ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-14">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="border border-gray-800/60 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-900/40 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium text-white">
                      {faq.q}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${
                      openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Final CTA ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to Find Your Edge?
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              The trade journal built for momentum day traders. Free to start,
              takes 30 seconds to sign up.
            </p>
            <Link
              to="/login?mode=signup"
              className="cta-btn inline-block bg-accent-600 hover:bg-accent-500 text-white font-display font-semibold text-base px-10 py-4 rounded-xl"
            >
              Start Free — No Credit Card
            </Link>
            <p className="text-gray-500 text-xs mt-4">
              Free tier forever. Pro is $29/mo with a 14-day trial.
            </p>
          </div>
        </section>
      </main>

      {/* ───── Footer ───── */}
      <footer className="bg-gray-900/50 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <span className="font-display text-sm font-bold text-white">
              MyTradeBook
            </span>
            <span className="text-xs text-gray-500">
              Made by ohjudo
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">
              Terms
            </Link>
            <a
              href="https://instagram.com/ohjudo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
