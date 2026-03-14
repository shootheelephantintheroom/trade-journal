import { useState, useEffect, Fragment } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const FAQS = [
  {
    q: "Is MyTradeBook really free?",
    a: "Yes. MyTradeBook is completely free during the beta. Every feature is included — no paywalls, no credit card required.",
  },
  {
    q: "What data do I need to enter?",
    a: "At minimum, just a ticker, entry/exit prices, and share size. But you can also log emotions, setups, tags, stop losses, and grade each trade to get deeper insights.",
  },
  {
    q: "Is my data private?",
    a: "Absolutely. Your trades are stored securely and are only visible to you. We never share or sell your data.",
  },
  {
    q: "Can I export my trades?",
    a: "Yes. You can export your full trade history to CSV at any time from the History tab.",
  },
  {
    q: "Will there be a paid version?",
    a: "Eventually, yes — but the core journaling features will always have a free tier. Paid plans will focus on advanced analytics and integrations.",
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

const DEEP_FEATURES = [
  {
    title: "Trade Grading System",
    desc: "Grade every trade A through D based on execution, not just outcome. A losing trade with perfect execution is still an A.",
  },
  {
    title: "Emotional Tagging",
    desc: "Tag your mindset — FOMO, revenge trading, disciplined, confident. See which emotions correlate with your best and worst trades.",
  },
  {
    title: "Missed Trade Tracking",
    desc: "Log the setups you saw but didn't take. See exactly how much money you're leaving on the table from hesitation.",
  },
  {
    title: "Daily P&L Tracking",
    desc: "Profit and loss broken down by day with win rates and trade counts. Spot your best and worst days.",
  },
  {
    title: "Win Rate & Streaks",
    desc: "Track your overall win rate, current streak, and profit factor. Know your numbers.",
  },
  {
    title: "CSV Export",
    desc: "Export your full trade history anytime. Your data is yours — take it wherever you want.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ───── Hero ───── */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-8 sm:pt-36 sm:pb-12 overflow-hidden">
          {/* Animated glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="hero-glow w-[500px] h-[350px] sm:w-[700px] sm:h-[450px] rounded-full bg-accent-500/20 blur-[120px]" />
          </div>

          <div className="relative text-center max-w-2xl z-10">
            <h2 className="hero-enter font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6">
              Journal Your Trades.
              <br />
              Fix Your Mistakes.
              <br />
              <span className="text-accent-400">Trade Better.</span>
            </h2>
            <p className="hero-enter-d1 text-gray-300 text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-2">
              Built by a trader. For traders who are tired of losing to
              themselves.
            </p>
            <p className="hero-enter-d1 text-gray-500 text-sm max-w-md mx-auto mb-10">
              Stop repeating the same mistakes. Start building a real edge with
              data, not gut feelings.
            </p>
            <div className="hero-enter-d2">
              <Link
                to="/login?mode=signup"
                className="cta-btn inline-block bg-accent-600 hover:bg-accent-500 text-white font-display font-semibold text-base sm:text-lg px-10 py-4 rounded-xl"
              >
                Start Journaling — It's Free
              </Link>
              <p className="text-gray-500 text-xs mt-3 tracking-wide">
                Free beta — no credit card required
              </p>
            </div>
          </div>
        </section>

        {/* ───── Feature Cards (Asymmetric) ───── */}
        <section className="px-4 pt-20 pb-8 sm:pt-28 sm:pb-12 reveal">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Large card — spans 2 rows */}
            <div className="feature-card sm:row-span-2 bg-gray-900/60 border border-gray-800 rounded-2xl p-8 flex flex-col justify-center">
              <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5 text-accent-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">
                Log Trades
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Record entries, exits, emotions, and grade every trade in
                seconds. Tag your setups, track your mindset, and build a
                complete picture of every decision you make.
              </p>
            </div>

            {/* Small card — missed trades */}
            <div className="feature-card bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-accent-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-1">
                Track Missed Trades
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Log the ones that got away so you stop hesitating.
              </p>
            </div>

            {/* Small card — analytics */}
            <div className="feature-card bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
                <svg
                  className="w-5 h-5 text-accent-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="font-display text-base font-semibold text-white mb-1">
                Dashboard Analytics
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Win rate, P&L, streaks, and daily breakdowns at a glance.
              </p>
            </div>
          </div>
        </section>

        {/* ───── Dashboard Preview (Perspective Float) ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-4xl mx-auto dashboard-wrapper">
            <div className="dashboard-float relative">
              <img
                src="/dashboard-preview.png"
                alt="MyTradeBook dashboard showing P&L, win rate, equity curve, and trade history"
                className="w-full rounded-xl border border-gray-800 relative z-10"
              />
              {/* Soft glow underneath */}
              <div className="absolute -bottom-8 left-[10%] right-[10%] h-24 bg-accent-500/10 rounded-full blur-[60px]" />
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

        {/* ───── How It Works (Horizontal Flow) ───── */}
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

        {/* ───── Feature Deep-Dive ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              Everything You Need to Get Better
            </h2>
            <p className="text-gray-500 text-sm text-center mb-14 max-w-lg mx-auto">
              The tools serious day traders actually use to find their edge.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
              {DEEP_FEATURES.map((f) => (
                <div key={f.title}>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mb-3" />
                  <h3 className="font-display text-sm font-semibold text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
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
                Join 50+ traders in the beta
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "I was using spreadsheets for months. MyTradeBook actually made me want to review my trades.",
                  name: "Day Trader",
                  detail: "Small caps",
                },
                {
                  quote:
                    "The missed trades feature is genius. I didn't realize how much money I was leaving on the table from hesitation.",
                  name: "Momentum Trader",
                  detail: "6 months trading",
                },
                {
                  quote:
                    "Simple, fast, and it doesn't try to do too much. Exactly what I needed.",
                  name: "Swing Trader",
                  detail: "Options & equities",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-gray-900/40 border border-gray-800/50 rounded-xl p-6 text-left"
                >
                  <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">
                    "{t.quote}"
                  </p>
                  <div className="text-xs">
                    <span className="text-white font-medium">{t.name}</span>
                    <span className="text-gray-600 ml-2">{t.detail}</span>
                  </div>
                </div>
              ))}
            </div>
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
              Ready to Trade Better?
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Start journaling your trades today. It's free, it takes 30 seconds
              to sign up, and it might be the thing that finally fixes your
              trading.
            </p>
            <Link
              to="/login?mode=signup"
              className="cta-btn inline-block bg-accent-600 hover:bg-accent-500 text-white font-display font-semibold text-base px-10 py-4 rounded-xl"
            >
              Get Started — Free Beta
            </Link>
            <p className="text-gray-500 text-xs mt-4">
              No credit card required. No strings attached.
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
            <a href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-gray-300 transition-colors">
              Terms
            </a>
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
