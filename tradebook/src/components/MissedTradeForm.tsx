import { useState } from "react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import type { MissedTradeInsert } from "../types/trade";
import TagSelect from "./TagSelect";
import HesitationSelect from "./HesitationSelect";
import { useToast } from "./Toast";
import { todayLocal } from "../lib/date";

const empty: MissedTradeInsert = {
  ticker: "",
  trade_date: todayLocal(),
  setup: "",
  tags: [],
  reason: "",
  side: "long",
  estimated_entry: null,
  estimated_exit: null,
  estimated_shares: null,
  hesitation_reasons: [],
};

function calcEstimatedPnl(form: MissedTradeInsert): number | null {
  if (!form.side || !form.estimated_entry || !form.estimated_exit || !form.estimated_shares) {
    return null;
  }
  if (form.side === "long") {
    return (form.estimated_exit - form.estimated_entry) * form.estimated_shares;
  }
  return (form.estimated_entry - form.estimated_exit) * form.estimated_shares;
}

export default function MissedTradeForm({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<MissedTradeInsert>({ ...empty });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof MissedTradeInsert>(
    key: K,
    value: MissedTradeInsert[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const estimatedPnl = calcEstimatedPnl(form);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error: err } = await supabase.from("missed_trades").insert({
      ...form,
      ticker: form.ticker.toUpperCase().trim(),
      estimated_entry: form.estimated_entry || null,
      estimated_exit: form.estimated_exit || null,
      estimated_shares: form.estimated_shares || null,
    });

    setSaving(false);
    if (err) {
      showToast(err.message, "error");
    } else {
      showToast("Missed trade saved!", "success");
      setForm({
        ...empty,
        trade_date: todayLocal(),
      });
      onSaved();
    }
  }

  const inputClass =
    "w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-[13px] text-primary placeholder-tertiary hover:border-white/[0.1] focus:border-white/[0.15] focus:outline-none transition-colors duration-150";
  const labelClass =
    "block text-[13px] font-medium text-secondary mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg mx-auto space-y-5"
    >
      <h2 className="text-base font-medium text-primary">
        Log Missed Trade
      </h2>

      {/* Ticker, Side, Date */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Ticker</label>
          <input
            className={inputClass}
            placeholder="e.g. TSLA"
            value={form.ticker}
            onChange={(e) => set("ticker", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Side</label>
          <div className="flex h-[34px] rounded-[6px] border border-white/[0.04] bg-transparent p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => set("side", "long")}
              className={cn(
                "flex-1 rounded-[4px] text-[13px] font-medium transition-colors duration-150",
                form.side === "long"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => set("side", "short")}
              className={cn(
                "flex-1 rounded-[4px] text-[13px] font-medium transition-colors duration-150",
                form.side === "short"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Short
            </button>
          </div>
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            className={inputClass}
            value={form.trade_date}
            onChange={(e) => set("trade_date", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Estimated Entry, Exit, Shares */}
      <div className="h-px bg-white/[0.04]" />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Est. Entry</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass}
            placeholder="0.00"
            value={form.estimated_entry ?? ""}
            onChange={(e) =>
              set("estimated_entry", e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label className={labelClass}>Est. Exit</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass}
            placeholder="0.00"
            value={form.estimated_exit ?? ""}
            onChange={(e) =>
              set("estimated_exit", e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label className={labelClass}>Shares</label>
          <input
            type="number"
            min="1"
            className={inputClass}
            placeholder="0"
            value={form.estimated_shares ?? ""}
            onChange={(e) =>
              set("estimated_shares", e.target.value ? parseInt(e.target.value) : null)
            }
          />
        </div>
      </div>

      {/* Estimated P&L preview */}
      {estimatedPnl !== null && (
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-secondary">
            Est. P&L
          </span>
          <span
            className={cn(
              "text-[13px] font-medium font-mono",
              estimatedPnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {estimatedPnl >= 0 ? "+" : ""}${estimatedPnl.toFixed(2)}
          </span>
        </div>
      )}

      <div>
        <label className={labelClass}>Setup You Saw</label>
        <input
          className={inputClass}
          placeholder="e.g. VWAP reclaim with heavy volume"
          value={form.setup}
          onChange={(e) => set("setup", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Tags</label>
        <TagSelect
          selected={form.tags}
          onChange={(tags) => set("tags", tags)}
        />
      </div>

      {/* Why I Hesitated */}
      <div className="h-px bg-white/[0.04]" />
      <div>
        <label className="block text-[13px] font-medium text-secondary mb-2">
          Why I Hesitated
        </label>
        <HesitationSelect
          selected={form.hesitation_reasons}
          onChange={(reasons) => set("hesitation_reasons", reasons)}
        />
      </div>

      <div>
        <label className={labelClass}>Why You Passed</label>
        <textarea
          className={cn(inputClass, "h-auto min-h-[60px]")}
          rows={2}
          placeholder="e.g. Wasn't sure about float, waited too long"
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-brand hover:bg-brand/90 text-surface-0 font-medium text-[13px] px-4 py-2.5 rounded-md transition-colors duration-150 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Missed Trade"}
      </button>
    </form>
  );
}
