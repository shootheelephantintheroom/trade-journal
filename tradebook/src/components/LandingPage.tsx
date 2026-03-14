import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const FAQS = [
  {
    q: "Is TradeBook really free?",
    a: "Yes. TradeBook is completely free during the beta. Every feature is included — no paywalls, no credit card required.",
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

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-50 border-b border-gray-800 transition-all duration-300 ${
          scrolled
            ? "bg-gray-950/90 backdrop-blur-md"
            : "bg-gray-950"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-white">
            TradeBook
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
        <section className="flex flex-col items-center justify-center px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 gap-10">
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Journal Your Trades.
              <br />
              Fix Your Mistakes.
              <br />
              <span className="text-accent-400">Trade Better.</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
              A trading journal built for active day traders who want to stop
              repeating mistakes and start building an edge.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {[
              {
                icon: "\u{1F4DD}",
                title: "Log Trades",
                desc: "Record entries, exits, emotions, and grade every trade.",
              },
              {
                icon: "\u{1F440}",
                title: "Track Missed Opportunities",
                desc: "Log the ones that got away so you stop hesitating.",
              },
              {
                icon: "\u{1F4CA}",
                title: "Dashboard Analytics",
                desc: "Win rate, P&L, streaks, and daily breakdowns at a glance.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-gray-800/50 border border-gray-800 rounded-xl p-5 text-center"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Dashboard Preview */}
          <div className="w-full max-w-4xl">
            <img
              src="/dashboard-preview.png"
              alt="TradeBook dashboard showing P&L, win rate, equity curve, and trade history"
              className="w-full rounded-xl border border-gray-800 shadow-2xl shadow-accent-500/5"
            />
          </div>

          {/* CTA */}
          <Link
            to="/login?mode=signup"
            className="bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors"
          >
            Get Started — Free Beta
          </Link>
          <p className="text-gray-500 text-xs -mt-6">
            Currently in free beta. All features included.
          </p>
        </section>

        {/* ───── How It Works ───── */}
        <section className="px-4 py-16 sm:py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
              {[
                {
                  step: "1",
                  icon: "\u{270D}\u{FE0F}",
                  title: "Log Your Trade",
                  desc: "Enter your ticker, entry/exit, share size, and tag your emotions and setup. Grade yourself honestly.",
                },
                {
                  step: "2",
                  icon: "\u{1F50D}",
                  title: "Review Your Patterns",
                  desc: "See your win rate, streaks, daily P&L, and which mistakes keep costing you money.",
                },
                {
                  step: "3",
                  icon: "\u{1F4C8}",
                  title: "Improve Your Edge",
                  desc: "Cut the bad habits, double down on what works, and watch your consistency grow over time.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-accent-600/20 border border-accent-500/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">{item.icon}</span>
                  </div>
                  <div className="text-xs font-bold text-accent-400 uppercase tracking-widest mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">
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

        {/* ───── Feature Deep-Dive ───── */}
        <section className="px-4 py-16 sm:py-20 border-t border-gray-800/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-4">
              Everything You Need to Get Better
            </h2>
            <p className="text-gray-400 text-sm text-center mb-12 max-w-lg mx-auto">
              TradeBook gives you the tools serious day traders actually use to
              find their edge.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: "\u{1F3AF}",
                  title: "Trade Grading System",
                  desc: "Grade every trade A through D based on execution, not just outcome. A losing trade with perfect execution is still an A.",
                },
                {
                  icon: "\u{1F9E0}",
                  title: "Emotional Tagging",
                  desc: "Tag your mindset on each trade — FOMO, revenge trading, disciplined, confident. See which emotions correlate with your best and worst trades.",
                },
                {
                  icon: "\u{1F6A8}",
                  title: "Missed Trade Tracking",
                  desc: "Log the setups you saw but didn't take. Track your hesitation reasons and see exactly how much money you're leaving on the table.",
                },
                {
                  icon: "\u{1F4B0}",
                  title: "Daily P&L Tracking",
                  desc: "See your profit and loss broken down by day with win rates and trade counts. Spot your best and worst days of the week.",
                },
                {
                  icon: "\u{1F525}",
                  title: "Win Rate & Streak Analytics",
                  desc: "Track your overall win rate, current streak, and profit factor. Know your numbers and hold yourself accountable.",
                },
                {
                  icon: "\u{1F4E4}",
                  title: "CSV Export",
                  desc: "Export your full trade history anytime. Your data is yours — take it wherever you want.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex gap-4"
                >
                  <div className="text-2xl shrink-0 mt-0.5">{feature.icon}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Who It's For ───── */}
        <section className="px-4 py-16 sm:py-20 border-t border-gray-800/50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Built for Traders Like You
            </h2>
            <p className="text-gray-400 text-sm mb-10 max-w-md mx-auto">
              If you're serious about improving, TradeBook was made for you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: "\u{26A1}",
                  title: "Momentum Traders",
                  desc: "You trade the move. TradeBook helps you figure out which setups are actually working and which ones are bleeding you dry.",
                },
                {
                  icon: "\u{1F4A5}",
                  title: "Small Cap Day Traders",
                  desc: "Low floats, high volatility, fast decisions. You need a journal that's as quick as you are — not a spreadsheet.",
                },
                {
                  icon: "\u{1F504}",
                  title: "Pattern Breakers",
                  desc: "Tired of making the same mistakes? TradeBook shows you exactly where you keep going wrong so you can finally break the cycle.",
                },
              ].map((persona) => (
                <div
                  key={persona.title}
                  className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6"
                >
                  <div className="text-3xl mb-3">{persona.icon}</div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {persona.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {persona.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Social Proof ───── */}
        <section className="px-4 py-16 sm:py-20 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent-600/10 border border-accent-500/20 rounded-full px-5 py-2 mb-10">
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
                    "I was using spreadsheets for months. TradeBook actually made me want to review my trades.",
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
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left"
                >
                  <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">
                    "{t.quote}"
                  </p>
                  <div className="text-xs">
                    <span className="text-white font-medium">{t.name}</span>
                    <span className="text-gray-500 ml-2">{t.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── FAQ ───── */}
        <section className="px-4 py-16 sm:py-20 border-t border-gray-800/50">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="border border-gray-800 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-900/50 transition-colors cursor-pointer"
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
        <section className="px-4 py-16 sm:py-20 border-t border-gray-800/50">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Ready to Trade Better?
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Start journaling your trades today. It's free, it takes 30
              seconds to sign up, and it might be the thing that finally fixes
              your trading.
            </p>
            <Link
              to="/login?mode=signup"
              className="inline-block bg-accent-600 hover:bg-accent-500 text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors"
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
      <footer className="border-t border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="text-sm font-bold text-white">TradeBook</span>
            <span className="text-xs text-gray-500">
              Built by traders, for traders.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-gray-300 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
