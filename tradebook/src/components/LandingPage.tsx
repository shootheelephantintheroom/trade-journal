import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { FREE_FEATURES, PRO_FEATURES, MOMENTUM_CALLOUTS } from "../data/landingData";

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

  useEffect(() => {
    const cards = document.querySelectorAll('.feature-card');
    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    cards.forEach((card) => {
      card.addEventListener('mousemove', handleMouseMove as EventListener);
    });
    return () => {
      cards.forEach((card) => {
        card.removeEventListener('mousemove', handleMouseMove as EventListener);
      });
    };
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
        <section className="relative flex flex-col items-center justify-center px-4 pt-32 pb-20 sm:pt-44 sm:pb-28 overflow-hidden">
          {/* Ambient floating orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="hero-orb hero-orb-1" />
            <div className="hero-orb hero-orb-2" />
            <div className="hero-orb hero-orb-3" />
          </div>

          {/* Subtle dot grid */}
          <div className="hero-grid" aria-hidden="true" />

          <div className="relative text-center max-w-2xl z-10">
            <h2 className="hero-enter text-4xl sm:text-5xl md:text-6xl font-semibold text-primary leading-[1.08] tracking-tight mb-6">
              Your red days
              <br />
              <span className="text-brand hero-shimmer">have a pattern.</span>
            </h2>
            <p className="hero-enter-d1 text-secondary text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
              Most traders lose money to the same 2–3 mistakes on repeat.
              MyTradeBook makes them impossible to ignore.
            </p>
            <div className="hero-enter-d2">
              <Link
                to="/login?mode=signup"
                className="cta-btn inline-block bg-brand hover:bg-brand/90 text-surface-0 font-semibold text-base sm:text-lg px-10 py-4 rounded-md"
              >
                Start Free — No Credit Card
              </Link>
            </div>
          </div>
        </section>

        <div className="gradient-line" />

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
                  className="feature-card group relative bg-surface-1/40 border border-border rounded-md p-5 overflow-hidden"
                >
                  <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59,130,246,0.06), transparent 40%)' }} />
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

        <div className="gradient-line" />

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
