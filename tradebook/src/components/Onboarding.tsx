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
  "w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-base sm:text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors";
const labelClass =
  "block text-[13px] font-medium text-secondary mb-1.5";

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
    <div className="min-h-[100dvh] bg-surface-0 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <p className="text-sm font-medium text-primary text-center mb-6">
          MyTradeBook
        </p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === step
                  ? "bg-brand"
                  : i < step
                    ? "bg-brand/40"
                    : "bg-white/[0.08]",
              )}
            />
          ))}
        </div>

        <div className="animate-fade-in" key={step}>
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[13px] font-medium text-secondary">
                  What do you trade?
                </h2>
                <p className="text-[13px] text-tertiary mt-0.5">
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
                      "py-2 rounded-[6px] text-[13px] font-medium border transition-colors",
                      styles.includes(s)
                        ? "border-brand/30 text-brand bg-brand/5"
                        : "border-white/[0.06] text-secondary hover:border-white/[0.1]",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={styles.length === 0}
                className="w-full text-[13px] py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-30 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[13px] font-medium text-secondary">
                  Set your defaults
                </h2>
                <p className="text-[13px] text-tertiary mt-0.5">
                  These pre-fill when you log trades
                </p>
              </div>

              <div>
                <label className={labelClass}>Default Position Size</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputClass}
                  placeholder="e.g. 100"
                  value={defaultShares}
                  onChange={(e) => setDefaultShares(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Default Commission</label>
                <input
                  type="text"
                  inputMode="decimal"
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
                  className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 text-[13px] py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-[13px] font-medium text-secondary">
                  Log your first trade
                </h2>
                <p className="text-[13px] text-tertiary mt-0.5">
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
                        "flex-1 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors",
                        exampleTrade.side === "long"
                          ? "border border-profit/30 text-profit bg-profit/5"
                          : "border border-white/[0.06] text-secondary hover:border-white/[0.1]",
                      )}
                    >
                      Long
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrade("side", "short")}
                      className={cn(
                        "flex-1 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors",
                        exampleTrade.side === "short"
                          ? "border border-loss/30 text-loss bg-loss/5"
                          : "border border-white/[0.06] text-secondary hover:border-white/[0.1]",
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
                    type="text"
                    inputMode="decimal"
                    className={inputClass}
                    value={exampleTrade.entry_price}
                    onChange={(e) => setTrade("entry_price", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Exit</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={inputClass}
                    value={exampleTrade.exit_price}
                    onChange={(e) => setTrade("exit_price", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Shares</label>
                  <input
                    type="text"
                    inputMode="decimal"
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
                  <div className="rounded-[6px] border border-white/[0.04] px-3 py-2">
                    <span className="text-[13px] font-medium text-secondary">
                      Profit / Loss{" "}
                      <span
                        className={cn(
                          "text-[13px] font-medium font-mono ml-1",
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
                  className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleFinish(false)}
                  disabled={saving}
                  className="text-[13px] px-3 py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
                <button
                  onClick={() => handleFinish(true)}
                  disabled={saving}
                  className="flex-1 text-[13px] py-1.5 bg-white/[0.06] text-white rounded-[6px] hover:bg-white/[0.1] disabled:opacity-50 transition-colors"
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
