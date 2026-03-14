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

const GRADES = [
  { value: "A", label: "A", desc: "Textbook", bg: "bg-accent-500/15", border: "border-accent-500", text: "text-accent-400", activeBg: "bg-accent-500/25" },
  { value: "B", label: "B", desc: "Good", bg: "bg-blue-500/15", border: "border-blue-500", text: "text-blue-400", activeBg: "bg-blue-500/25" },
  { value: "C", label: "C", desc: "Sloppy", bg: "bg-yellow-500/15", border: "border-yellow-500", text: "text-yellow-400", activeBg: "bg-yellow-500/25" },
  { value: "D", label: "D", desc: "Broke rules", bg: "bg-red-500/15", border: "border-red-500", text: "text-red-400", activeBg: "bg-red-500/25" },
] as const;

export default function TradeForm({ onSaved }: { onSaved?: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TradeInsert>({ ...empty });
  const [saving, setSaving] = useState(false);
  const [emotionInput, setEmotionInput] = useState("");

  function set<K extends keyof TradeInsert>(key: K, value: TradeInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const pnl =
    form.entry_price > 0 && form.exit_price > 0 && form.shares > 0
      ? calcPnl(form)
      : null;
  const rr = form.stop_loss_price ? calcRR(form) : null;
  const maxRisk = form.stop_loss_price ? calcMaxRisk(form) : null;

  // Parse emotions string into pills
  const emotionPills = form.emotions
    ? form.emotions
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
    : [];

  function addEmotion() {
    const trimmed = emotionInput.trim();
    if (trimmed && !emotionPills.includes(trimmed)) {
      const updated = [...emotionPills, trimmed].join(", ");
      set("emotions", updated);
      setEmotionInput("");
    }
  }

  function removeEmotion(emotion: string) {
    const updated = emotionPills.filter((e) => e !== emotion).join(", ");
    set("emotions", updated);
  }

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
      setEmotionInput("");
      onSaved?.();
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors";
  const labelClass =
    "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-bold text-white font-display tracking-tight">
        Log a Trade
      </h2>

      {/* Ticker & Side */}
      <div className="form-section">
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set("side", "long")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.side === "long"
                    ? "bg-accent-500/15 border border-accent-500 text-accent-400"
                    : "bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:border-gray-600"
                }`}
              >
                Long
              </button>
              <button
                type="button"
                onClick={() => set("side", "short")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.side === "short"
                    ? "bg-red-500/15 border border-red-500 text-red-400"
                    : "bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:border-gray-600"
                }`}
              >
                Short
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Entry / Exit / Shares */}
      <div className="form-section">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
          Position
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Entry</label>
            <input
              type="number"
              step="any"
              min="0"
              className={inputClass}
              value={form.entry_price || ""}
              onChange={(e) =>
                set("entry_price", parseFloat(e.target.value) || 0)
              }
              required
            />
          </div>
          <div>
            <label className={labelClass}>Exit</label>
            <input
              type="number"
              step="any"
              min="0"
              className={inputClass}
              value={form.exit_price || ""}
              onChange={(e) =>
                set("exit_price", parseFloat(e.target.value) || 0)
              }
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

        {/* Stop Loss */}
        <div className="mt-3">
          <label className={labelClass}>Stop Loss</label>
          <input
            type="number"
            step="any"
            min="0"
            className={inputClass + " max-w-[200px]"}
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
      </div>

      {/* P&L Preview */}
      {pnl !== null && (
        <div className="card-panel px-4 py-3 flex flex-wrap gap-x-6 gap-y-1.5">
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            P&L{" "}
            <span
              className={
                "text-sm font-bold ml-1 " +
                (pnl >= 0 ? "text-accent-400" : "text-red-400")
              }
            >
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </span>
          </span>
          {rr !== null && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              R:R{" "}
              <span
                className={
                  "text-sm font-bold ml-1 " +
                  (rr >= 0 ? "text-accent-400" : "text-red-400")
                }
              >
                {rr.toFixed(2)}
              </span>
            </span>
          )}
          {maxRisk !== null && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Risk{" "}
              <span className="text-sm font-bold text-yellow-400 ml-1">
                ${maxRisk.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Trade Grade — Buttons */}
      <div>
        <label className={labelClass}>Trade Grade</label>
        <div className="flex gap-2">
          {GRADES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() =>
                set("grade", form.grade === g.value ? "" : g.value)
              }
              className={`grade-btn flex-1 py-2 rounded-lg text-center border font-bold text-sm ${
                form.grade === g.value
                  ? `${g.activeBg} ${g.border} ${g.text}`
                  : "bg-gray-800/80 border-gray-700/80 text-gray-500 hover:border-gray-600"
              }`}
            >
              <span className="text-base">{g.label}</span>
              <span className="block text-[10px] font-medium opacity-70 mt-0.5">
                {g.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Date / Times */}
      <div className="form-section">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
          Timing
        </p>
        <div className="grid grid-cols-3 gap-3">
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
        <label className={labelClass}>Notes</label>
        <textarea
          className={inputClass + " resize-none"}
          rows={3}
          placeholder="What happened during this trade?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* Emotions — Pill selector */}
      <div>
        <label className={labelClass}>Emotions</label>
        {emotionPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {emotionPills.map((emotion) => (
              <span key={emotion} className="emotion-pill">
                {emotion}
                <button
                  type="button"
                  onClick={() => removeEmotion(emotion)}
                  className="text-accent-400/50 hover:text-accent-400 ml-0.5 text-sm leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={emotionInput}
            onChange={(e) => setEmotionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEmotion();
              }
            }}
            placeholder="e.g. FOMO, confident, anxious"
            className="flex-1 rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={addEmotion}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-submit w-full rounded-lg bg-accent-600 px-4 py-3 text-sm font-bold text-white hover:bg-accent-500 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Trade"}
      </button>
    </form>
  );
}
