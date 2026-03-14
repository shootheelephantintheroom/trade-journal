import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { TradeInsert } from "../types/trade";
import { calcPnl, calcRR, calcMaxRisk } from "../lib/calc";
import TagSelect from "./TagSelect";
import { useToast } from "./Toast";

const empty: TradeInsert = {
  ticker: "",
  side: "long",
  entry_price: 0,
  exit_price: 0,
  shares: 0,
  trade_date: new Date().toISOString().split("T")[0],
  entry_time: "",
  exit_time: "",
  setup: "",
  notes: "",
  emotions: "",
  stop_loss_price: null,
  tags: [],
  grade: "",
  premarket_plan: "",
};

export default function TradeForm({ onSaved }: { onSaved?: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TradeInsert>({ ...empty });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof TradeInsert>(key: K, value: TradeInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const pnl =
    form.entry_price > 0 && form.exit_price > 0 && form.shares > 0
      ? calcPnl(form)
      : null;
  const rr = form.stop_loss_price ? calcRR(form) : null;
  const maxRisk = form.stop_loss_price ? calcMaxRisk(form) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const { error: err } = await supabase.from("trades").insert({
      ...form,
      ticker: form.ticker.toUpperCase().trim(),
      stop_loss_price: form.stop_loss_price || null,
      grade: form.grade || null,
    });

    setSaving(false);
    if (err) {
      showToast(err.message, "error");
    } else {
      showToast("Trade saved!", "success");
      setForm({ ...empty, trade_date: new Date().toISOString().split("T")[0] });
      onSaved?.();
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-white">Log a Trade</h2>

      {/* Ticker, Side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Ticker</label>
          <input
            className={inputClass}
            placeholder="e.g. AAPL"
            value={form.ticker}
            onChange={(e) => set("ticker", e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Side</label>
          <select
            className={inputClass}
            value={form.side}
            onChange={(e) => set("side", e.target.value as "long" | "short")}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
      </div>

      {/* Entry, Exit, Shares */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Entry Price</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass}
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
            value={form.exit_price || ""}
            onChange={(e) => set("exit_price", parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Shares</label>
          <input
            type="number"
            min="1"
            className={inputClass}
            value={form.shares || ""}
            onChange={(e) => set("shares", parseInt(e.target.value) || 0)}
            required
          />
        </div>
      </div>

      {/* Stop Loss, Grade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Stop Loss Price</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass}
            placeholder="Optional"
            value={form.stop_loss_price ?? ""}
            onChange={(e) =>
              set(
                "stop_loss_price",
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
          />
        </div>
        <div>
          <label className={labelClass}>Trade Grade</label>
          <select
            className={inputClass}
            value={form.grade}
            onChange={(e) => set("grade", e.target.value)}
          >
            <option value="">—</option>
            <option value="A">A — Textbook execution</option>
            <option value="B">B — Good, minor flaws</option>
            <option value="C">C — Sloppy execution</option>
            <option value="D">D — Broke rules</option>
          </select>
        </div>
      </div>

      {/* P&L Preview */}
      {pnl !== null && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-gray-400">
            P&L:{" "}
            <span
              className={
                "font-semibold " +
                (pnl >= 0 ? "text-accent-400" : "text-red-400")
              }
            >
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </span>
          </span>
          {rr !== null && (
            <span className="text-gray-400">
              R:R:{" "}
              <span
                className={
                  "font-semibold " +
                  (rr >= 0 ? "text-accent-400" : "text-red-400")
                }
              >
                {rr.toFixed(2)}
              </span>
            </span>
          )}
          {maxRisk !== null && (
            <span className="text-gray-400">
              Risk:{" "}
              <span className="font-semibold text-yellow-400">
                ${maxRisk.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Date, Entry Time, Exit Time */}
      <div className="grid grid-cols-3 gap-4">
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
        <div>
          <label className={labelClass}>Entry Time</label>
          <input
            type="time"
            className={inputClass}
            value={form.entry_time}
            onChange={(e) => set("entry_time", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Exit Time</label>
          <input
            type="time"
            className={inputClass}
            value={form.exit_time}
            onChange={(e) => set("exit_time", e.target.value)}
          />
        </div>
      </div>

      {/* Playbook Tags */}
      <div>
        <label className={labelClass}>Playbook Tags</label>
        <TagSelect
          selected={form.tags}
          onChange={(tags) => set("tags", tags)}
        />
      </div>

      {/* Pre-market Plan */}
      <div>
        <label className={labelClass}>Pre-market Plan / Thesis</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={2}
          placeholder="What's your thesis before entering?"
          value={form.premarket_plan}
          onChange={(e) => set("premarket_plan", e.target.value)}
        />
      </div>

      {/* Setup */}
      <div>
        <label className={labelClass}>Setup</label>
        <input
          className={inputClass}
          placeholder="e.g. breakout above VWAP with volume"
          value={form.setup}
          onChange={(e) => set("setup", e.target.value)}
        />
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes (what went right/wrong)</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={3}
          placeholder="What happened during this trade?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* Emotions */}
      <div>
        <label className={labelClass}>Emotions</label>
        <input
          className={inputClass}
          placeholder="e.g. FOMO, confident, anxious"
          value={form.emotions}
          onChange={(e) => set("emotions", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50 transition-colors"
      >
        {saving ? "Saving..." : "Save Trade"}
      </button>
    </form>
  );
}
