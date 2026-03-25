import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "../contexts/SubscriptionContext";
import { useToast } from "./Toast";
import { todayLocal } from "../lib/date";

const TRADING_STYLES = [
  "Small caps",
  "Large caps",
  "Options",
  "Futures",
  "Crypto",
] as const;

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Central Europe (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const inputClass =
  "w-full rounded-lg border border-transparent bg-surface-2 px-3 py-2.5 text-sm text-primary placeholder-tertiary hover:border-border-hover focus:border-brand focus:outline-none transition-colors";
const labelClass =
  "block text-[11px] font-semibold text-tertiary uppercase tracking-wider mb-1.5";

export default function Onboarding() {
  const { user } = useAuth();
  const { refetchProfile } = useSubscription();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 -- trading styles
  const [styles, setStyles] = useState<string[]>([]);

  // Step 2 -- defaults
  const [defaultShares, setDefaultShares] = useState("");
  const [defaultCommission, setDefaultCommission] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Step 3 -- example trade
  const [exampleTrade, setExampleTrade] = useState({
    ticker: "AAPL",
    side: "long" as "long" | "short",
    entry_price: "182.50",
    exit_price: "185.20",
    shares: "100",
    trade_date: todayLocal(),
    setup: "Breakout above VWAP with volume",
    notes: "Clean entry on the first pullback. Held through the push.",
    grade: "B",
  });

  function toggleStyle(s: string) {
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function saveDefaults() {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        trading_styles: styles,
        default_shares: defaultShares ? parseInt(defaultShares) : null,
        default_commission: defaultCommission
          ? parseFloat(defaultCommission)
          : 0,
        timezone,
        onboarded: true,
      })
      .eq("id", user.id);
    if (error) {
      showToast(error.message, "error");
      return false;
    }
    return true;
  }

  async function handleFinish(logTrade: boolean) {
    setSaving(true);
    const saved = await saveDefaults();
    if (!saved) {
      setSaving(false);
      return;
    }

    if (logTrade) {
      const { error } = await supabase.from("trades").insert({
        ticker: exampleTrade.ticker.toUpperCase().trim(),
        side: exampleTrade.side,
        entry_price: parseFloat(exampleTrade.entry_price) || 0,
        exit_price: parseFloat(exampleTrade.exit_price) || 0,
        shares: parseInt(exampleTrade.shares) || 0,
        trade_date: exampleTrade.trade_date,
        setup: exampleTrade.setup,
        notes: exampleTrade.notes,
        grade: exampleTrade.grade || null,
        tags: [],
        emotions: "",
        premarket_plan: "",
        entry_time: "",
        exit_time: "",
        stop_loss_price: null,
        screenshot_url: null,
        catalyst: "",
        catalyst_type: null,
        float_shares: null,
        market_cap: null,
        rvol: null,
        commission: defaultCommission ? parseFloat(defaultCommission) : 0,
        is_scaled: false,
        avg_entry_price: null,
        avg_exit_price: null,
        total_shares: null,
      });
      if (error) showToast("Trade didn't save -- you can log it later", "error");
    }

    await refetchProfile();
    showToast(
      "Welcome to MyTradeBook! You're on the Free plan.",
      "success"
    );
    navigate("/app/log", { replace: true });
  }

  function setTrade<K extends keyof typeof exampleTrade>(
    key: K,
    value: (typeof exampleTrade)[K]
  ) {
    setExampleTrade((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <h1 className="text-2xl font-semibold text-primary text-center mb-1">
          MyTradeBook
        </h1>
        <p className="text-tertiary text-center text-sm mb-8">
          Let's set up your journal
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                i === step
                  ? "bg-brand scale-125"
                  : i < step
                    ? "bg-brand/40"
                    : "bg-surface-3",
              )}
            />
          ))}
        </div>

        {/* Step cards */}
        <div className="rounded-xl bg-surface-1 p-5 animate-fade-in" key={step}>
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  What do you trade?
                </h2>
                <p className="text-sm text-tertiary mt-1">
                  Select all that apply
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TRADING_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={cn(
                      "py-3 rounded-lg text-sm font-medium border transition-all",
                      styles.includes(s)
                        ? "bg-brand-muted border-brand text-brand"
                        : "bg-surface-2 border-transparent text-secondary hover:border-border",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={styles.length === 0}
                className="w-full bg-brand hover:bg-brand/90 disabled:opacity-30 disabled:hover:bg-brand text-primary font-medium text-sm py-2.5 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Set your defaults
                </h2>
                <p className="text-sm text-tertiary mt-1">
                  These pre-fill when you log trades
                </p>
              </div>

              <div>
                <label className={labelClass}>Default Position Size</label>
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  placeholder="e.g. 100"
                  value={defaultShares}
                  onChange={(e) => setDefaultShares(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Default Commission</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className={inputClass}
                  placeholder="$0.00"
                  value={defaultCommission}
                  onChange={(e) => setDefaultCommission(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Timezone</label>
                <select
                  className={inputClass}
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                  {/* Show detected timezone if not in list */}
                  {!TIMEZONES.some((tz) => tz.value === timezone) && (
                    <option value={timezone}>{timezone}</option>
                  )}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-secondary hover:text-primary border border-border hover:border-border-hover transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-brand hover:bg-brand/90 text-primary font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Log your first trade
                </h2>
                <p className="text-sm text-tertiary mt-1">
                  Edit the example below or skip for now
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Ticker</label>
                  <input
                    className={inputClass}
                    value={exampleTrade.ticker}
                    onChange={(e) => setTrade("ticker", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Side</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTrade("side", "long")}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                        exampleTrade.side === "long"
                          ? "bg-brand-muted border border-brand text-brand"
                          : "bg-surface-2 border border-transparent text-secondary hover:border-border",
                      )}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrade("side", "short")}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                        exampleTrade.side === "short"
                          ? "bg-loss-muted border border-loss text-loss"
                          : "bg-surface-2 border border-transparent text-secondary hover:border-border",
                      )}
                    >
                      Short
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Entry</label>
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={exampleTrade.entry_price}
                    onChange={(e) => setTrade("entry_price", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Exit</label>
                  <input
                    type="number"
                    step="any"
                    className={inputClass}
                    value={exampleTrade.exit_price}
                    onChange={(e) => setTrade("exit_price", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Shares</label>
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    value={exampleTrade.shares}
                    onChange={(e) => setTrade("shares", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Setup</label>
                <input
                  className={inputClass}
                  value={exampleTrade.setup}
                  onChange={(e) => setTrade("setup", e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Notes</label>
                <textarea
                  className={inputClass + " resize-none"}
                  rows={2}
                  value={exampleTrade.notes}
                  onChange={(e) => setTrade("notes", e.target.value)}
                />
              </div>

              {/* P&L preview */}
              {parseFloat(exampleTrade.entry_price) > 0 &&
                parseFloat(exampleTrade.exit_price) > 0 &&
                parseInt(exampleTrade.shares) > 0 && (
                  <div className="rounded-xl bg-surface-1 px-4 py-3">
                    <span className="text-xs text-tertiary uppercase tracking-wider">
                      P&L{" "}
                      <span
                        className={cn(
                          "text-sm font-semibold font-mono ml-1",
                          (parseFloat(exampleTrade.exit_price) -
                            parseFloat(exampleTrade.entry_price)) *
                            (exampleTrade.side === "long" ? 1 : -1) *
                            parseInt(exampleTrade.shares) >=
                          0
                            ? "text-profit"
                            : "text-loss",
                        )}
                      >
                        {(() => {
                          const pnl =
                            (parseFloat(exampleTrade.exit_price) -
                              parseFloat(exampleTrade.entry_price)) *
                            (exampleTrade.side === "long" ? 1 : -1) *
                            parseInt(exampleTrade.shares);
                          return `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`;
                        })()}
                      </span>
                    </span>
                  </div>
                )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-secondary hover:text-primary border border-border hover:border-border-hover transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleFinish(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-secondary hover:text-primary border border-border hover:border-border-hover transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleFinish(true)}
                  disabled={saving}
                  className="flex-1 bg-brand hover:bg-brand/90 disabled:opacity-50 text-primary font-medium text-sm py-2.5 rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Save & Start"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
