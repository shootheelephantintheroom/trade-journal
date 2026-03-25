import { useState, Fragment } from "react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import type { MissedTrade, MissedTradeInsert } from "../types/trade";
import TagSelect from "./TagSelect";
import HesitationSelect from "./HesitationSelect";
import { useToast } from "./Toast";
import { todayLocal } from "../lib/date";

// Client-side pagination — sufficient up to ~500-1000 missed trades.
// TODO: switch to server-side pagination (Supabase .range()) when count grows beyond that.
const PAGE_SIZE = 25;

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
  const [page, setPage] = useState(1);
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
    "w-full rounded-lg border border-transparent bg-surface-2 px-3 py-2.5 text-sm text-primary placeholder-tertiary hover:border-border-hover focus:border-brand focus:outline-none transition-colors duration-150";
  const labelClass =
    "block text-xs text-tertiary uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-8">
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto space-y-5"
      >
        <h2 className="text-base font-medium text-primary">
          Log Missed Trade
        </h2>

        {/* Ticker, Side, Date */}
        <div className="bg-surface-1 rounded-lg p-6">
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
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150",
                    form.side === "long"
                      ? "bg-profit-bg text-profit"
                      : "bg-surface-2 text-secondary hover:text-primary"
                  )}
                >
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => set("side", "short")}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150",
                    form.side === "short"
                      ? "bg-loss-bg text-loss"
                      : "bg-surface-2 text-secondary hover:text-primary"
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
        </div>

        {/* Estimated Entry, Exit, Shares */}
        <div className="bg-surface-1 rounded-lg p-6">
          <p className="text-xs text-tertiary uppercase tracking-widest mb-3">
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
          <div className="bg-surface-1 rounded-lg p-6">
            <span className="text-xs text-tertiary uppercase tracking-wider">
              Est. P&L{" "}
              <span
                className={cn(
                  "text-sm font-medium font-mono ml-1",
                  estimatedPnl >= 0 ? "text-profit" : "text-loss"
                )}
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

        {/* Why I Hesitated */}
        <div className="bg-surface-1 rounded-lg p-6">
          <label className="block text-xs text-tertiary uppercase tracking-wider mb-2">
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
          className="w-full bg-brand hover:bg-brand/90 text-surface-0 font-medium text-sm px-4 py-3 rounded-lg transition-colors duration-150 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Missed Trade"}
        </button>
      </form>

      {/* List */}
      {missedTrades.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-surface-1 flex items-center justify-center text-3xl">
            👀
          </div>
          <h3 className="text-base font-medium text-primary">
            No missed trades yet
          </h3>
          <p className="text-sm text-secondary text-center max-w-xs">
            Spot a setup you didn't take? Log it above so you can track your
            hesitation patterns.
          </p>
        </div>
      )}
      {missedTrades.length > 0 && (() => {
        const totalPages = Math.max(1, Math.ceil(missedTrades.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const paged = missedTrades.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        return (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs text-tertiary uppercase tracking-wider">
              Missed Trades Log
            </h3>
            <span className="text-xs bg-brand-muted text-brand px-2 py-0.5 rounded-full font-medium">
              {missedTrades.length} missed
            </span>
          </div>
          <div className="bg-surface-1 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Ticker
                    </th>
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Side
                    </th>
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Est. Entry
                    </th>
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Est. Exit
                    </th>
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Est. P&L
                    </th>
                    <th className="px-4 py-3 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                      Hesitation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((mt) => {
                    const pnl = calcMissedPnl(mt);
                    const isExpanded = expandedId === mt.id;

                    return (
                      <Fragment key={mt.id}>
                        <tr
                          onClick={() =>
                            setExpandedId(isExpanded ? null : mt.id)
                          }
                          className={cn(
                            "border-t border-border cursor-pointer transition-colors duration-150",
                            isExpanded ? "bg-surface-2" : "hover:bg-surface-2/50"
                          )}
                        >
                          <td className="px-4 py-3 text-xs text-tertiary">
                            {mt.trade_date}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                              <span className="font-medium text-primary">
                                {mt.ticker}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {mt.side ? (
                              <span
                                className={cn(
                                  "text-xs font-medium px-1.5 py-0.5 rounded-full",
                                  mt.side === "long"
                                    ? "bg-profit-bg text-profit"
                                    : "bg-loss-bg text-loss"
                                )}
                              >
                                {mt.side.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-tertiary">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-secondary font-mono">
                            {mt.estimated_entry != null
                              ? `$${Number(mt.estimated_entry).toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-secondary font-mono">
                            {mt.estimated_exit != null
                              ? `$${Number(mt.estimated_exit).toFixed(2)}`
                              : "—"}
                          </td>
                          <td
                            className={cn(
                              "px-4 py-3 font-medium font-mono text-sm",
                              pnl === null
                                ? "text-tertiary"
                                : pnl >= 0
                                  ? "text-profit"
                                  : "text-loss"
                            )}
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
                                    className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-muted text-brand"
                                  >
                                    {r}
                                  </span>
                                ))}
                                {mt.hesitation_reasons.length > 2 && (
                                  <span className="text-[10px] text-tertiary">
                                    +{mt.hesitation_reasons.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-tertiary text-xs">—</span>
                            )}
                          </td>
                        </tr>
                        {/* Expanded detail */}
                        {isExpanded && (
                          <tr key={`${mt.id}-detail`}>
                            <td
                              colSpan={7}
                              className="px-4 py-0 bg-surface-2 border-t border-border"
                            >
                              <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {mt.setup && (
                                  <div>
                                    <span className="text-xs text-tertiary uppercase tracking-wider">
                                      Setup
                                    </span>
                                    <p className="text-sm text-secondary mt-0.5">
                                      {mt.setup}
                                    </p>
                                  </div>
                                )}
                                {mt.tags && mt.tags.length > 0 && (
                                  <div>
                                    <span className="text-xs text-tertiary uppercase tracking-wider">
                                      Tags
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {mt.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-muted text-brand"
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
                                      <span className="text-xs text-tertiary uppercase tracking-wider">
                                        Why I Hesitated
                                      </span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {mt.hesitation_reasons.map((r) => (
                                          <span
                                            key={r}
                                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-muted text-brand"
                                          >
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                {mt.reason && (
                                  <div>
                                    <span className="text-xs text-tertiary uppercase tracking-wider">
                                      Why I Passed
                                    </span>
                                    <p className="text-sm text-secondary mt-0.5">
                                      {mt.reason}
                                    </p>
                                  </div>
                                )}
                                {/* Delete action */}
                                <div className="md:col-span-2 flex gap-2 pt-2 border-t border-border">
                                  <button
                                    type="button"
                                    disabled={deleting === mt.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(mt.id);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 text-loss hover:bg-loss-bg transition-colors duration-150 disabled:opacity-50"
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150",
                  safePage <= 1
                    ? "text-surface-3 cursor-default"
                    : "text-secondary hover:text-primary"
                )}
              >
                Previous
              </button>
              <span className="text-xs text-tertiary">
                {safePage} / {totalPages}
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors duration-150",
                  safePage >= totalPages
                    ? "text-surface-3 cursor-default"
                    : "text-secondary hover:text-primary"
                )}
              >
                Next
              </button>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
}
