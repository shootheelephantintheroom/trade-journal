import { useState, Fragment } from "react";
import { supabase } from "../lib/supabase";
import type { MissedTrade, MissedTradeInsert } from "../types/trade";
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this trade? This can't be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("missed_trades").delete().eq("id", id);
    setDeleting(null);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Missed trade deleted", "success");
      setExpandedId(null);
      onSaved();
    }
  }

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
    "w-full rounded-lg border border-gray-700/80 bg-gray-800/80 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none transition-colors";
  const labelClass =
    "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto space-y-5"
      >
        <h2 className="text-xl font-bold text-white font-display tracking-tight">
          Log Missed Trade
        </h2>

        {/* Ticker, Side, Date */}
        <div className="form-section" style={{ borderColor: "rgba(234, 179, 8, 0.15)" }}>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set("side", "long")}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
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
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    form.side === "short"
                      ? "bg-red-500/15 border border-red-500 text-red-400"
                      : "bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:border-gray-600"
                  }`}
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
        </div>

        {/* Estimated Entry, Exit, Shares */}
        <div className="form-section" style={{ borderColor: "rgba(234, 179, 8, 0.15)" }}>
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
            Estimated Position
          </p>
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
        </div>

        {/* Estimated P&L preview */}
        {estimatedPnl !== null && (
          <div className="card-panel px-4 py-3" style={{ borderColor: "rgba(234, 179, 8, 0.2)" }}>
            <span className="text-xs text-gray-500 uppercase tracking-wider">
              Est. P&L{" "}
              <span
                className={
                  "text-sm font-bold ml-1 " +
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

        {/* Why I Hesitated — Prominent */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <label className="block text-[11px] font-bold text-yellow-400 uppercase tracking-wider mb-2">
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
          className="btn-submit w-full rounded-lg bg-yellow-600 px-4 py-3 text-sm font-bold text-white hover:bg-yellow-500 disabled:opacity-50"
          style={{ boxShadow: "0 0 20px rgba(234, 179, 8, 0.15)" }}
        >
          {saving ? "Saving..." : "Save Missed Trade"}
        </button>
      </form>

      {/* List */}
      {missedTrades.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-yellow-500/20 flex items-center justify-center text-3xl">
            👀
          </div>
          <h3 className="text-lg font-bold text-white font-display">
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
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Missed Trades Log
            </h3>
            <span className="text-[10px] text-yellow-400/70 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">
              {missedTrades.length} missed
            </span>
          </div>
          <div className="card-panel overflow-hidden" style={{ borderColor: "rgba(234, 179, 8, 0.15)" }}>
            <div className="overflow-x-auto">
              <table className="trade-table w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-yellow-500/10">
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Ticker
                    </th>
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Side
                    </th>
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Est. Entry
                    </th>
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Est. Exit
                    </th>
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Est. P&L
                    </th>
                    <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                      Hesitation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {missedTrades.map((mt) => {
                    const pnl = calcMissedPnl(mt);
                    const isExpanded = expandedId === mt.id;

                    return (
                      <Fragment key={mt.id}>
                        <tr
                          onClick={() =>
                            setExpandedId(isExpanded ? null : mt.id)
                          }
                          className={`border-t border-gray-800/40 cursor-pointer ${
                            isExpanded ? "bg-yellow-500/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {mt.trade_date}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              <span className="font-semibold text-white">
                                {mt.ticker}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {mt.side ? (
                              <span
                                className={`text-xs font-medium ${
                                  mt.side === "long"
                                    ? "text-accent-400"
                                    : "text-red-400"
                                }`}
                              >
                                {mt.side.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {mt.estimated_entry != null
                              ? `$${Number(mt.estimated_entry).toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">
                            {mt.estimated_exit != null
                              ? `$${Number(mt.estimated_exit).toFixed(2)}`
                              : "—"}
                          </td>
                          <td
                            className={
                              "px-4 py-3 font-semibold text-sm " +
                              (pnl === null
                                ? "text-gray-600"
                                : pnl >= 0
                                  ? "text-accent-400"
                                  : "text-red-400")
                            }
                          >
                            {pnl !== null
                              ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            {mt.hesitation_reasons && mt.hesitation_reasons.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {mt.hesitation_reasons.slice(0, 2).map((r) => (
                                  <span
                                    key={r}
                                    className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/20"
                                  >
                                    {r}
                                  </span>
                                ))}
                                {mt.hesitation_reasons.length > 2 && (
                                  <span className="text-[10px] text-yellow-400/50">
                                    +{mt.hesitation_reasons.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                        {/* Expanded detail */}
                        {isExpanded && (
                          <tr key={`${mt.id}-detail`}>
                            <td
                              colSpan={7}
                              className="px-4 py-0 bg-yellow-500/5 border-t border-yellow-500/10"
                            >
                              <div className="trade-expand py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {mt.setup && (
                                  <div>
                                    <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                      Setup
                                    </span>
                                    <p className="text-gray-300 mt-0.5">
                                      {mt.setup}
                                    </p>
                                  </div>
                                )}
                                {mt.tags && mt.tags.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                      Tags
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {mt.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {mt.hesitation_reasons &&
                                  mt.hesitation_reasons.length > 0 && (
                                    <div>
                                      <span className="text-yellow-400 uppercase tracking-wider text-[10px] font-bold">
                                        Why I Hesitated
                                      </span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {mt.hesitation_reasons.map((r) => (
                                          <span
                                            key={r}
                                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                          >
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                {mt.reason && (
                                  <div>
                                    <span className="text-yellow-400 uppercase tracking-wider text-[10px] font-bold">
                                      Why I Passed
                                    </span>
                                    <p className="text-gray-300 mt-0.5">
                                      {mt.reason}
                                    </p>
                                  </div>
                                )}
                                {/* Delete action */}
                                <div className="md:col-span-2 flex gap-2 pt-2 border-t border-yellow-500/10">
                                  <button
                                    type="button"
                                    disabled={deleting === mt.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(mt.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800/80 border border-gray-700/80 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-colors disabled:opacity-50"
                                  >
                                    {deleting === mt.id ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
