import { useState, Fragment } from "react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import type { MissedTrade } from "../types/trade";
import { calcMissedPnl } from "../lib/calc";
import { useToast } from "./Toast";
import MissedTradeForm from "./MissedTradeForm";

// Client-side pagination — sufficient up to ~500-1000 missed trades.
// TODO: switch to server-side pagination (Supabase .range()) when count grows beyond that.
const PAGE_SIZE = 25;

export default function MissedTrades({
  missedTrades,
  onSaved,
}: {
  missedTrades: MissedTrade[];
  onSaved: () => void;
}) {
  const { showToast } = useToast();
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

  return (
    <div className="space-y-8">
      <MissedTradeForm onSaved={onSaved} />

      {/* List */}
      {missedTrades.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-16 h-16 rounded-md flex items-center justify-center text-3xl">
            👀
          </div>
          <h3 className="text-base font-medium text-primary">
            No missed trades yet
          </h3>
          <p className="text-[13px] text-secondary text-center max-w-xs">
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
            <h3 className="text-[13px] font-medium text-secondary">
              Missed Trades Log
            </h3>
            <span className="text-xs bg-brand-muted text-brand px-2 py-0.5 rounded-full font-medium">
              {missedTrades.length} missed
            </span>
          </div>
          <div className="border border-white/[0.04] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
                      Date
                    </th>
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
                      Ticker
                    </th>
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
                      Side
                    </th>
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
                      Est. Entry
                    </th>
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
                      Est. Exit
                    </th>
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
                      Est. P&L
                    </th>
                    <th className="px-4 py-3 text-[13px] font-medium text-secondary">
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
                              "px-4 py-3 font-medium font-mono text-[13px]",
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
                                    <span className="text-[13px] font-medium text-secondary">
                                      Setup
                                    </span>
                                    <p className="text-[13px] text-secondary mt-0.5">
                                      {mt.setup}
                                    </p>
                                  </div>
                                )}
                                {mt.tags && mt.tags.length > 0 && (
                                  <div>
                                    <span className="text-[13px] font-medium text-secondary">
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
                                      <span className="text-[13px] font-medium text-secondary">
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
                                    <span className="text-[13px] font-medium text-secondary">
                                      Why I Passed
                                    </span>
                                    <p className="text-[13px] text-secondary mt-0.5">
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
                                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-surface-2 text-loss hover:bg-loss-bg transition-colors duration-150 disabled:opacity-50"
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
