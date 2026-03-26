import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Trade, TradeInsert } from "../types/trade";
import { calcPnl, calcRR } from "../lib/calc";
import { useToast } from "./Toast";
import { todayLocal } from "../lib/date";
import { cn } from "../lib/utils";

const empty: TradeInsert = {
  ticker: "",
  side: "long",
  entry_price: 0,
  exit_price: 0,
  shares: 0,
  trade_date: todayLocal(),
  entry_time: "",
  exit_time: "",
  setup: "",
  notes: "",
  emotions: "",
  stop_loss_price: null,
  tags: [],
  grade: "",
  premarket_plan: "",
  screenshot_url: null,
  catalyst: "",
  catalyst_type: null,
  float_shares: null,
  market_cap: null,
  rvol: null,
  commission: 0,
  is_scaled: false,
  avg_entry_price: null,
  avg_exit_price: null,
  total_shares: null,
};

export default function TradeForm({
  onSaved,
  editTrade,
  onEditDone,
}: {
  onSaved?: () => void;
  editTrade?: Trade | null;
  onEditDone?: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TradeInsert>({ ...empty });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editTrade) {
      const { id, created_at, ...rest } = editTrade;
      setForm(rest);
    } else {
      setForm({ ...empty, trade_date: todayLocal() });
    }
  }, [editTrade]);

  function set<K extends keyof TradeInsert>(key: K, value: TradeInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const pnl =
    form.entry_price > 0 && form.exit_price > 0 && form.shares > 0
      ? calcPnl(form)
      : null;

  const rr = form.stop_loss_price ? calcRR(form) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      ticker: form.ticker.toUpperCase().trim(),
      stop_loss_price: form.stop_loss_price || null,
    };

    const { error } = editTrade
      ? await supabase.from("trades").update(payload).eq("id", editTrade.id)
      : await supabase.from("trades").insert(payload);

    setSaving(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(editTrade ? "Trade updated!" : "Trade saved!", "success");
      setForm({ ...empty, trade_date: todayLocal() });
      if (editTrade) onEditDone?.();
      onSaved?.();
    }
  }

  const inputClass =
    "w-full h-9 rounded-[10px] border border-white/[0.06] bg-surface-2 px-3 text-sm text-white font-sans placeholder-zinc-500 focus:outline-none focus:shadow-[0_0_0_2px_rgba(59,130,246,0.35)] transition-all";

  const labelClass = "block text-xs font-medium text-secondary mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[10px] bg-surface-1 p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          {editTrade ? "Edit Trade" : "Log Trade"}
        </h2>
        {editTrade && (
          <button
            type="button"
            onClick={() => onEditDone?.()}
            className="text-xs text-tertiary hover:text-secondary transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Ticker & Direction */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Ticker</label>
          <input
            className={inputClass}
            placeholder="AAPL"
            value={form.ticker}
            onChange={(e) => set("ticker", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Direction</label>
          <div className="flex h-9 rounded-[10px] border border-white/[0.06] bg-surface-2 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => set("side", "long")}
              className={cn(
                "flex-1 rounded-[8px] text-sm font-semibold transition-all",
                form.side === "long"
                  ? "bg-profit text-surface-0 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Long
            </button>
            <button
              type="button"
              onClick={() => set("side", "short")}
              className={cn(
                "flex-1 rounded-[8px] text-sm font-semibold transition-all",
                form.side === "short"
                  ? "bg-loss text-surface-0 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              Short
            </button>
          </div>
        </div>
      </div>

      {/* Date */}
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

      {/* Entry / Exit / Shares */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Entry Price</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass}
            placeholder="0.00"
            value={form.entry_price || ""}
            onChange={(e) => set("entry_price", parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Exit Price</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass}
            placeholder="0.00"
            value={form.exit_price || ""}
            onChange={(e) => set("exit_price", parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Shares / Contracts</label>
          <input
            type="number"
            min="1"
            className={inputClass}
            placeholder="0"
            value={form.shares || ""}
            onChange={(e) => set("shares", parseInt(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      {/* Stop Loss (enables R:R) */}
      <div>
        <label className={labelClass}>
          Stop Loss{" "}
          <span className="text-zinc-600 font-normal">(enables R:R)</span>
        </label>
        <input
          type="number"
          step="any"
          min="0"
          className={cn(inputClass, "max-w-[200px]")}
          placeholder="Optional"
          value={form.stop_loss_price ?? ""}
          onChange={(e) =>
            set("stop_loss_price", e.target.value ? parseFloat(e.target.value) : null)
          }
        />
      </div>

      {/* Live P&L / R:R */}
      {pnl !== null && (
        <div className="flex items-center gap-6 rounded-[10px] border border-white/[0.06] bg-surface-2 px-4 py-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              P&L
            </span>
            <p
              className={cn(
                "text-sm font-semibold font-mono",
                pnl >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </p>
          </div>
          {rr !== null && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                R:R
              </span>
              <p
                className={cn(
                  "text-sm font-semibold font-mono",
                  rr >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {rr.toFixed(2)}R
              </p>
            </div>
          )}
        </div>
      )}

      {/* Setup Tag */}
      <div>
        <label className={labelClass}>Setup</label>
        <input
          className={inputClass}
          placeholder="e.g. VWAP reclaim, breakout, red-to-green"
          value={form.setup}
          onChange={(e) => set("setup", e.target.value)}
        />
      </div>

      {/* Emotion Tag */}
      <div>
        <label className={labelClass}>Emotion</label>
        <input
          className={inputClass}
          placeholder="e.g. confident, FOMO, revenge, calm"
          value={form.emotions}
          onChange={(e) => set("emotions", e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          className={cn(inputClass, "h-auto py-2.5 resize-none")}
          rows={3}
          placeholder="What happened? What would you do differently?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full h-10 rounded-[10px] bg-[#3b82f6] text-sm font-semibold text-white hover:-translate-y-px hover:brightness-110 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer"
      >
        {saving ? "Saving..." : editTrade ? "Update Trade" : "Save Trade"}
      </button>
    </form>
  );
}
