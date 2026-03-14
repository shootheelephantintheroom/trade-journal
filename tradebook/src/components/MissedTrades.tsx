import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { MissedTrade, MissedTradeInsert } from "../types/trade";
import TagSelect from "./TagSelect";
import HesitationSelect from "./HesitationSelect";
import { useToast } from "./Toast";

const empty: MissedTradeInsert = {
  ticker: "",
  trade_date: new Date().toISOString().split("T")[0],
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

export function calcMissedPnl(mt: MissedTrade): number | null {
  if (!mt.side || !mt.estimated_entry || !mt.estimated_exit || !mt.estimated_shares) {
    return null;
  }
  if (mt.side === "long") {
    return (mt.estimated_exit - mt.estimated_entry) * mt.estimated_shares;
  }
  return (mt.estimated_entry - mt.estimated_exit) * mt.estimated_shares;
}

export default function MissedTrades({
  missedTrades,
  onSaved,
}: {
  missedTrades: MissedTrade[];
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
        trade_date: new Date().toISOString().split("T")[0],
      });
      onSaved();
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto space-y-5"
      >
        <h2 className="text-xl font-semibold text-white">Log Missed Trade</h2>

        {/* Ticker, Side, Date */}
        <div className="grid grid-cols-3 gap-4">
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
            <select
              className={inputClass}
              value={form.side || "long"}
              onChange={(e) => set("side", e.target.value as "long" | "short")}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
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
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Est. Entry Price</label>
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
            <label className={labelClass}>Est. Exit Price</label>
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
          <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm">
            <span className="text-gray-400">
              Est. P&L:{" "}
              <span
                className={
                  "font-semibold " +
                  (estimatedPnl >= 0 ? "text-accent-400" : "text-red-400")
                }
              >
                {estimatedPnl >= 0 ? "+" : ""}${estimatedPnl.toFixed(2)}
              </span>
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

        <div>
          <label className={labelClass}>What Stopped You?</label>
          <HesitationSelect
            selected={form.hesitation_reasons}
            onChange={(reasons) => set("hesitation_reasons", reasons)}
          />
        </div>

        <div>
          <label className={labelClass}>Why You Passed</label>
          <textarea
            className={inputClass + " resize-none"}
            rows={2}
            placeholder="e.g. Wasn't sure about float, waited too long"
            value={form.reason}
            onChange={(e) => set("reason", e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Missed Trade"}
        </button>
      </form>

      {/* List */}
      {missedTrades.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="text-4xl">👀</div>
          <h3 className="text-lg font-semibold text-white">
            No missed trades yet
          </h3>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            Spot a setup you didn't take? Log it above so you can track your
            hesitation patterns.
          </p>
        </div>
      )}
      {missedTrades.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Missed Trades Log
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Side</th>
                  <th className="px-4 py-3">Est. Entry</th>
                  <th className="px-4 py-3">Est. Exit</th>
                  <th className="px-4 py-3">Est. P&L</th>
                  <th className="px-4 py-3">Setup</th>
                  <th className="px-4 py-3">Hesitation</th>
                </tr>
              </thead>
              <tbody>
                {missedTrades.map((mt) => {
                  const pnl = calcMissedPnl(mt);
                  return (
                    <tr
                      key={mt.id}
                      className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-gray-300">
                        {mt.trade_date}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-white">
                        {mt.ticker}
                      </td>
                      <td className="px-4 py-2.5">
                        {mt.side ? (
                          <span
                            className={
                              mt.side === "long"
                                ? "text-accent-400"
                                : "text-red-400"
                            }
                          >
                            {mt.side.toUpperCase()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300">
                        {mt.estimated_entry != null
                          ? `$${Number(mt.estimated_entry).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300">
                        {mt.estimated_exit != null
                          ? `$${Number(mt.estimated_exit).toFixed(2)}`
                          : "—"}
                      </td>
                      <td
                        className={
                          "px-4 py-2.5 font-medium " +
                          (pnl === null
                            ? "text-gray-500"
                            : pnl >= 0
                              ? "text-accent-400"
                              : "text-red-400")
                        }
                      >
                        {pnl !== null
                          ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 max-w-[180px]">
                        {mt.tags && mt.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {mt.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-gray-500 text-xs truncate block">
                          {mt.setup || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 max-w-[180px]">
                        {mt.hesitation_reasons && mt.hesitation_reasons.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {mt.hesitation_reasons.map((r) => (
                              <span
                                key={r}
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/20"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            {mt.reason || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
