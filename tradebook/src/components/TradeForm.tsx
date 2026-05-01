import { useState, useEffect } from "react";
import type { Trade, TradeInsert } from "../types/trade";
import { calcPnl, calcRR } from "../lib/calc";
import { useToast } from "./Toast";
import { todayLocal } from "../lib/date";
import { cn } from "../lib/utils";
import { X } from "lucide-react";
import { useSaveTrade } from "../hooks/useMutations";

/** Strip commas so users can type "1,234.56" */
function parseNum(v: string): number {
  return parseFloat(v.replace(/,/g, "")) || 0;
}

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
  editTrade,
  onEditDone,
}: {
  editTrade?: Trade | null;
  onEditDone?: () => void;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TradeInsert>({ ...empty });
  const saveTrade = useSaveTrade();

  // Raw string state for numeric fields so users can type commas/decimals freely
  const [rawEntry, setRawEntry] = useState("");
  const [rawExit, setRawExit] = useState("");
  const [rawShares, setRawShares] = useState("");
  const [rawStopLoss, setRawStopLoss] = useState("");

  useEffect(() => {
    if (editTrade) {
      const { id, created_at, ...rest } = editTrade;
      setForm(rest);
      setRawEntry(editTrade.entry_price ? String(editTrade.entry_price) : "");
      setRawExit(editTrade.exit_price ? String(editTrade.exit_price) : "");
      setRawShares(editTrade.shares ? String(editTrade.shares) : "");
      setRawStopLoss(editTrade.stop_loss_price ? String(editTrade.stop_loss_price) : "");
    } else {
      setForm({ ...empty, trade_date: todayLocal() });
      setRawEntry("");
      setRawExit("");
      setRawShares("");
      setRawStopLoss("");
    }
  }, [editTrade]);

  function set<K extends keyof TradeInsert>(key: K, value: TradeInsert[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Parse raw strings for calculations
  const entryNum = parseNum(rawEntry);
  const exitNum = parseNum(rawExit);
  const sharesNum = parseNum(rawShares);
  const stopLossNum = rawStopLoss ? parseNum(rawStopLoss) : null;

  const pnl =
    entryNum > 0 && exitNum > 0 && sharesNum > 0
      ? calcPnl({ ...form, entry_price: entryNum, exit_price: exitNum, shares: sharesNum })
      : null;

  const rr = stopLossNum ? calcRR({ ...form, entry_price: entryNum, exit_price: exitNum, stop_loss_price: stopLossNum }) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      ...form,
      ticker: form.ticker.toUpperCase().trim(),
      entry_price: entryNum,
      exit_price: exitNum,
      shares: sharesNum,
      stop_loss_price: stopLossNum,
      entry_time: form.entry_time || "09:30:00",
      exit_time: form.exit_time || "10:00:00",
      grade: form.grade || "B",
    };

    saveTrade.mutate(
      { payload, editTradeId: editTrade?.id },
      {
        onSuccess: () => {
          showToast(editTrade ? "Trade updated!" : "Trade saved!", "success");
          setForm({ ...empty, trade_date: todayLocal() });
          setRawEntry("");
          setRawExit("");
          setRawShares("");
          setRawStopLoss("");
          if (editTrade) onEditDone?.();
        },
        onError: (err) => {
          showToast(err.message, "error");
        },
      }
    );
  }

  const inputClass =
    "w-full h-[34px] rounded-[6px] border border-white/[0.06] bg-transparent px-[10px] py-[7px] text-base sm:text-[13px] text-white font-sans placeholder-tertiary focus:outline-none focus:border-white/[0.15] transition-colors";

  const labelClass = "block text-[13px] font-medium text-secondary mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-white tracking-tight">
            {editTrade ? "Edit Trade" : "Log Trade"}
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">
            {editTrade ? "Update the details below" : "Record your latest trade"}
          </p>
        </div>
        {editTrade && (
          <button
            type="button"
            onClick={() => onEditDone?.()}
            className="h-8 w-8 rounded-md flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} strokeWidth={1.8} />
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
          <div className="flex h-[34px] rounded-[6px] border border-white/[0.04] bg-transparent p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => set("side", "long")}
              className={cn(
                "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
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
                "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
                form.side === "short"
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              Short
            </button>
          </div>
        </div>
      </div>

      {/* Date & Times */}
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

      {/* Entry / Exit / Shares */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Entry Price</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            placeholder="0.00"
            value={rawEntry}
            onChange={(e) => setRawEntry(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Exit Price</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            placeholder="0.00"
            value={rawExit}
            onChange={(e) => setRawExit(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Shares / Contracts</label>
          <input
            type="text"
            inputMode="decimal"
            className={inputClass}
            placeholder="0"
            value={rawShares}
            onChange={(e) => setRawShares(e.target.value)}
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
          type="text"
          inputMode="decimal"
          className={cn(inputClass, "max-w-[200px]")}
          placeholder="Optional"
          value={rawStopLoss}
          onChange={(e) => setRawStopLoss(e.target.value)}
        />
      </div>

      {/* Live P&L / R:R */}
      {pnl !== null && (
        <div className="flex items-center gap-6 rounded-md border border-white/[0.04] bg-surface-2 px-4 py-3">
          <div>
            <span className="text-[13px] font-medium text-secondary">
              Profit / Loss
            </span>
            <p
              className={cn(
                "text-[13px] font-medium font-mono",
                pnl >= 0 ? "text-profit" : "text-loss"
              )}
            >
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </p>
          </div>
          {rr !== null && (
            <div>
              <span className="text-[13px] font-medium text-secondary">
                R:R
              </span>
              <p
                className={cn(
                  "text-[13px] font-medium font-mono",
                  rr >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {rr.toFixed(2)}R
              </p>
            </div>
          )}
        </div>
      )}

      {/* Setup & Grade */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Setup</label>
          <input
            className={inputClass}
            placeholder="e.g. VWAP reclaim, breakout, red-to-green"
            value={form.setup}
            onChange={(e) => set("setup", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Grade</label>
          <div className="flex h-[34px] rounded-[6px] border border-white/[0.04] bg-transparent p-0.5 gap-0.5">
            {(["A", "B", "C", "D"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set("grade", g)}
                className={cn(
                  "flex-1 rounded-[4px] text-[13px] font-medium transition-colors",
                  form.grade === g
                    ? "bg-white/[0.08] text-white"
                    : "text-zinc-500 hover:text-zinc-400"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
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
          className={cn(inputClass, "h-auto min-h-[60px]")}
          rows={2}
          placeholder="What happened? What would you do differently?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saveTrade.isPending}
        className="w-full h-9 rounded-md bg-brand hover:bg-brand-hover text-[13px] font-medium text-white disabled:opacity-50 transition-colors cursor-pointer"
      >
        {saveTrade.isPending ? "Saving..." : editTrade ? "Update Trade" : "Save Trade"}
      </button>
    </form>
  );
}
