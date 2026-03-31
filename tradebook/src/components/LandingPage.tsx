import { useState, useEffect, Fragment } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { FREE_FEATURES, PRO_FEATURES, MOMENTUM_CALLOUTS, FAQS } from "../data/landingData";

const STEPS = [
  {
    step: "1",
    title: "Log in 30 Seconds",
    desc: "Ticker, entry/exit, size, setup, emotions. One week of data is all it takes to surface patterns you've been missing.",
  },
  {
    step: "2",
    title: "See What's Costing You",
    desc: "Your dashboard breaks down performance by setup, time of day, and behavior. Stop guessing, start cutting.",
  },
  {
    step: "3",
    title: "Keep More of What You Make",
    desc: "Consistent journaling cuts losing days in half. The data makes it obvious what to stop doing.",
  },
];

/* ── Helpers ── */

function CheckIcon({ className = "mt-0.5 h-4 w-4 shrink-0 text-brand" }: { className?: string }) {
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
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="h-4 w-4 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-surface-0 text-primary flex flex-col">
      {/* ───── Header ───── */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "bg-surface-0/80 backdrop-blur-xl border-border"
            : "bg-surface-0 border-transparent"
        )}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-[13px] font-medium tracking-tight text-primary">
            MyTradeBook
          </h1>
          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="px-4 py-1.5 rounded-md text-[13px] font-medium text-secondary hover:text-brand/80 transition-colors hidden sm:inline-block"
            >
              Pricing
            </a>
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-md text-[13px] font-medium text-secondary hover:text-brand/80 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login?mode=signup"
              className={cn(
                "px-4 py-1.5 rounded-md text-[13px] font-medium bg-brand hover:bg-brand/90 text-surface-0 transition-all duration-300",
                scrolled
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              )}
            >
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ───── Hero ───── */}
        <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-8 sm:pt-36 sm:pb-12 overflow-hidden">
          {/* Linear-style gradient: subtle radial glow at top fading into the page */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(59,130,246,0.15),transparent)]" />
          </div>

          <div className="relative text-center max-w-2xl z-10">
            <h2 className="hero-enter text-4xl sm:text-5xl md:text-6xl font-semibold text-primary leading-[1.08] tracking-tight mb-6">
              Your red days
              <br />
              <span className="text-brand">have a pattern.</span>
            </h2>
            <p className="hero-enter-d1 text-secondary text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-2">
              Most traders lose money to the same 2–3 mistakes on repeat.
              MyTradeBook makes them impossible to ignore.
            </p>
            <p className="hero-enter-d1 text-tertiary text-[13px] max-w-md mx-auto mb-10">
              Built for small-cap momentum traders.
            </p>
            <div className="hero-enter-d2">
              <Link
                to="/login?mode=signup"
                className="cta-btn inline-block bg-brand hover:bg-brand/90 text-surface-0 font-semibold text-base sm:text-lg px-10 py-4 rounded-md"
              >
                Start Free — No Credit Card
              </Link>
              <p className="text-tertiary text-xs mt-3 tracking-wide">
                Free forever. Upgrade when you're ready.
              </p>
            </div>
          </div>
        </section>

        {/* ───── How It Works ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-medium text-primary text-center mb-16">
              How It Works
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-start gap-10 sm:gap-0">
              {STEPS.map((item, i) => (
                <Fragment key={item.step}>
                  <div className="flex-1 text-center">
                    <div className="w-12 h-12 rounded-full bg-surface-0 border-2 border-brand/40 flex items-center justify-center mx-auto mb-5 relative z-10">
                      <span className="text-brand font-medium">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-base font-medium text-primary mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-secondary leading-relaxed max-w-[240px] mx-auto">
                      {item.desc}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("hidden sm:flex items-center shrink-0 mt-[18px]", `step-connector${i === 1 ? " step-connector-2" : ""}`)}>
                      <div className="w-8 h-px bg-brand/25" />
                      <svg
                        className="w-3 h-3 text-brand/40 shrink-0 -mx-0.5"
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
                      <div className="w-8 h-px bg-brand/25" />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ───── Divider ───── */}
        <div className="section-divider" />

        {/* ───── Built for Momentum Traders ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-medium text-primary text-center mb-4">
              Built for Momentum Traders
            </h2>
            <p className="text-tertiary text-[13px] text-center mb-14 max-w-lg mx-auto">
              Every feature is designed to change how you trade tomorrow.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {MOMENTUM_CALLOUTS.map((item) => (
                <div
                  key={item.title}
                  className="feature-card bg-surface-1/40 border border-border rounded-md p-5"
                >
                  <div className="w-10 h-10 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center mb-5">
                    <svg
                      className="w-5 h-5 text-brand"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ───── Divider ───── */}
        <div className="section-divider" />

        {/* ───── Pricing ───── */}
        <section id="pricing" className="px-4 py-20 sm:py-28 reveal scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-medium text-primary text-center mb-4">
              One Bad Trade Costs More Than a Year of Pro
            </h2>
            <p className="text-tertiary text-[13px] text-center mb-14 max-w-md mx-auto">
              Start free. Upgrade when your data tells you to.
            </p>

            {/* Monthly/Yearly toggle */}
            <div className="flex items-center justify-center gap-3 mb-12">
              <div className="flex items-center gap-1 rounded-full bg-surface-2/70 border border-border/50 p-1 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPricingPlan("monthly")}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-[13px] font-medium transition-colors duration-150",
                    pricingPlan === "monthly"
                      ? "bg-primary text-surface-1"
                      : "text-secondary hover:text-primary"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPricingPlan("yearly")}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-[13px] font-medium transition-colors duration-150",
                    pricingPlan === "yearly"
                      ? "bg-primary text-surface-1"
                      : "text-secondary hover:text-primary"
                  )}
                >
                  Yearly
                </button>
              </div>
              {pricingPlan === "yearly" && (
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 tracking-wide">
                  Save 27%
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Free */}
              <div className="bg-surface-1/40 border border-border rounded-md p-5 flex flex-col">
                <div className="text-[13px] font-medium text-secondary mb-1">Free</div>
                <div className="text-4xl font-semibold text-primary mb-1">
                  $0
                </div>
                <div className="text-xs text-tertiary mb-8">Free forever</div>
                <ul className="space-y-3 flex-1">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-secondary">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=signup"
                  className="mt-8 block w-full text-center rounded-md border border-border bg-surface-2/50 px-6 py-3.5 text-[13px] font-medium text-primary transition-colors hover:border-surface-3 hover:bg-surface-2"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro */}
              <div className="relative bg-surface-1/60 border-2 border-brand/40 rounded-md p-5 flex flex-col">
                {pricingPlan === "yearly" && (
                  <div className="absolute -top-3 left-6 bg-brand text-primary text-[11px] font-medium uppercase tracking-wider px-3 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                <div className="text-[13px] font-medium text-brand mb-1">Pro</div>
                {pricingPlan === "monthly" ? (
                  <>
                    <div className="text-4xl font-semibold text-primary mb-1">
                      $9<span className="text-lg font-normal text-secondary">/mo</span>
                    </div>
                    <div className="text-xs text-tertiary mb-8">
                      14-day free trial available
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-semibold text-primary">
                        $79<span className="text-lg font-normal text-secondary">/yr</span>
                      </span>
                      <span className="text-base text-tertiary line-through">$108</span>
                    </div>
                    <div className="text-xs text-tertiary mb-8">
                      ~$6.58/mo · 14-day free trial available
                    </div>
                  </>
                )}
                <ul className="space-y-3 flex-1">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px] text-secondary">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/login?mode=signup"
                  className="cta-btn mt-8 block w-full text-center rounded-md bg-brand hover:bg-brand/90 px-6 py-3.5 text-[13px] font-medium text-surface-0 transition-colors"
                >
                  Get Started Free
                </Link>
                <p className="text-[11px] text-tertiary text-center mt-3">
                  Start a 14-day Pro trial anytime from Account Settings
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Bold Quote ───── */}
        <section className="px-4 py-20 sm:py-32 reveal">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-12 h-px bg-brand mx-auto mb-10" />
            <p className="text-2xl sm:text-3xl md:text-4xl font-light italic text-primary/90 leading-relaxed tracking-tight">
              "I was breakeven for 8 months. Two weeks of journaling showed me I was profitable before 10 AM and a disaster after lunch."
            </p>
            <div className="w-12 h-px bg-brand mx-auto mt-10" />
          </div>
        </section>

        {/* ───── FAQ ───── */}
        <section className="px-4 py-20 sm:py-28 reveal">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-medium text-primary text-center mb-14">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className="border border-border/60 rounded-md overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-surface-1/40 transition-colors cursor-pointer"
                  >
                    <span className="text-[13px] font-medium text-primary">
                      {faq.q}
                    </span>
                    <svg
                      className={cn(
                        "w-4 h-4 text-tertiary shrink-0 transition-transform duration-150",
                        openFaq === i ? "rotate-180" : ""
                      )}
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
                    className={cn(
                      "grid transition-all duration-150",
                      openFaq === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-[13px] text-secondary leading-relaxed">
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
            <h2 className="text-2xl sm:text-3xl font-medium text-primary mb-3">
              Your Next Green Month Starts Here
            </h2>
            <p className="text-secondary text-[13px] mb-8">
              Traders who win long-term know their numbers.
            </p>
            <Link
              to="/login?mode=signup"
              className="cta-btn inline-block bg-brand hover:bg-brand/90 text-surface-0 font-semibold text-base px-10 py-4 rounded-md"
            >
              Start Free — No Credit Card
            </Link>
            <p className="text-tertiary text-xs mt-4">
              Free forever. 14-day Pro trial available anytime.
            </p>
          </div>
        </section>
      </main>

      {/* ───── Footer ───── */}
      <footer className="bg-surface-1/50 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            <span className="text-[13px] font-medium text-primary">
              MyTradeBook
            </span>
            <span className="text-xs text-tertiary">
              Made by ohjudo
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-tertiary">
            <Link to="/privacy" className="hover:text-brand/80 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-brand/80 transition-colors">
              Terms
            </Link>
            <a
              href="https://instagram.com/ohjudo"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand/80 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
