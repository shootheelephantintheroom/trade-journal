import { useState, Fragment } from "react";
import type { Trade } from "../types/trade";
import { calcPnl, calcRR } from "../lib/calc";

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function exportTradesToCsv(trades: Trade[]) {
  const headers = [
    "Date",
    "Ticker",
    "Side",
    "Entry",
    "Exit",
    "Shares",
    "P&L",
    "R:R",
    "Grade",
    "Setup",
    "Tags",
    "Notes",
  ];

  const rows = trades.map((t) => {
    const pl = calcPnl(t);
    const rr = calcRR(t);
    return [
      t.trade_date,
      t.ticker,
      t.side,
      t.entry_price.toFixed(2),
      t.exit_price.toFixed(2),
      String(t.shares),
      pl.toFixed(2),
      rr !== null ? rr.toFixed(1) : "",
      t.grade || "",
      escapeCsvField(t.setup || ""),
      escapeCsvField((t.tags || []).join("; ")),
      escapeCsvField(t.notes || ""),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mytradebook-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type SortKey = "date" | "ticker" | "pnl" | "grade";
type SortDir = "asc" | "desc";
type FilterResult = "all" | "win" | "loss";

function sortTrades(
  trades: Trade[],
  key: SortKey,
  dir: SortDir
): Trade[] {
  const sorted = [...trades];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "date":
        cmp = a.trade_date.localeCompare(b.trade_date);
        if (cmp === 0) cmp = (a.entry_time || "").localeCompare(b.entry_time || "");
        break;
      case "ticker":
        cmp = a.ticker.localeCompare(b.ticker);
        break;
      case "pnl":
        cmp = calcPnl(a) - calcPnl(b);
        break;
      case "grade":
        cmp = (a.grade || "Z").localeCompare(b.grade || "Z");
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

export default function TradeList({
  trades,
  onLogTrade,
}: {
  trades: Trade[];
  onLogTrade?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<FilterResult>("all");

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-3xl">
          📋
        </div>
        <h2 className="text-lg font-bold text-white font-display">
          No trades yet
        </h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Start logging to see your trade history here.
        </p>
        {onLogTrade && (
          <button
            onClick={onLogTrade}
            className="btn-submit mt-2 bg-accent-600 hover:bg-accent-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg"
          >
            Log Your First Trade
          </button>
        )}
      </div>
    );
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="text-gray-700 ml-0.5">↕</span>;
    return (
      <span className="text-accent-400 ml-0.5">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  // Filter
  let filtered = trades;
  if (filter === "win") filtered = trades.filter((t) => calcPnl(t) > 0);
  if (filter === "loss") filtered = trades.filter((t) => calcPnl(t) < 0);

  // Sort
  const sorted = sortTrades(filtered, sortKey, sortDir);

  // Stats
  const totalPnl = trades.reduce((sum, t) => sum + calcPnl(t), 0);
  const winCount = trades.filter((t) => calcPnl(t) > 0).length;
  const lossCount = trades.filter((t) => calcPnl(t) < 0).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white font-display tracking-tight">
            Trade History
          </h2>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500">{trades.length} trades</span>
            <span className="text-gray-700">·</span>
            <span className="text-accent-400 font-medium">{winCount}W</span>
            <span className="text-gray-700">/</span>
            <span className="text-red-400 font-medium">{lossCount}L</span>
            <span className="text-gray-700">·</span>
            <span
              className={`font-semibold ${
                totalPnl >= 0 ? "text-accent-400" : "text-red-400"
              }`}
            >
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex gap-1">
            {(["all", "win", "loss"] as FilterResult[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filter === f
                    ? f === "win"
                      ? "bg-accent-500/15 text-accent-400 border border-accent-500/40"
                      : f === "loss"
                        ? "bg-red-500/15 text-red-400 border border-red-500/40"
                        : "bg-gray-800 text-white border border-gray-600"
                    : "text-gray-500 border border-transparent hover:text-gray-300"
                }`}
              >
                {f === "all" ? "All" : f === "win" ? "Wins" : "Losses"}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportTradesToCsv(trades)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-gray-700/80 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
              <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="trade-table w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-800">
                <th
                  className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("date")}
                >
                  Date <SortIcon col="date" />
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("ticker")}
                >
                  Ticker <SortIcon col="ticker" />
                </th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                  Side
                </th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                  Entry
                </th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                  Exit
                </th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                  Shares
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("pnl")}
                >
                  P&L <SortIcon col="pnl" />
                </th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                  R:R
                </th>
                <th
                  className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                  onClick={() => toggleSort("grade")}
                >
                  Grade <SortIcon col="grade" />
                </th>
                <th className="px-4 py-3 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                  Setup / Tags
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => {
                const pl = calcPnl(t);
                const rr = calcRR(t);
                const isExpanded = expandedId === t.id;
                const isWin = pl > 0;

                return (
                  <Fragment key={t.id}>
                    <tr
                      onClick={() =>
                        setExpandedId(isExpanded ? null : t.id)
                      }
                      className={`border-t border-gray-800/40 cursor-pointer ${
                        isExpanded ? "bg-gray-800/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {t.trade_date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isWin ? "bg-accent-500" : "bg-red-500"
                            }`}
                          />
                          <span className="font-semibold text-white">
                            {t.ticker}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            t.side === "long"
                              ? "text-accent-400"
                              : "text-red-400"
                          }`}
                        >
                          {t.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        ${t.entry_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        ${t.exit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {t.shares}
                      </td>
                      <td
                        className={
                          "px-4 py-3 font-semibold text-sm " +
                          (pl >= 0 ? "text-accent-400" : "text-red-400")
                        }
                      >
                        {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {rr !== null ? `${rr.toFixed(1)}R` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {t.grade ? (
                          <span
                            className={
                              "inline-block w-6 text-center rounded text-xs font-bold py-0.5 " +
                              (t.grade === "A"
                                ? "bg-accent-500/20 text-accent-400"
                                : t.grade === "B"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : t.grade === "C"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400")
                            }
                          >
                            {t.grade}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-0.5">
                            {t.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-gray-500 text-xs truncate block">
                          {t.setup || "—"}
                        </span>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${t.id}-detail`}>
                        <td
                          colSpan={10}
                          className="px-4 py-0 bg-gray-800/20 border-t border-gray-800/30"
                        >
                          <div className="trade-expand py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {t.entry_time && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                  Time
                                </span>
                                <p className="text-gray-300 mt-0.5">
                                  {t.entry_time}
                                  {t.exit_time ? ` → ${t.exit_time}` : ""}
                                </p>
                              </div>
                            )}
                            {t.premarket_plan && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                  Pre-market Plan
                                </span>
                                <p className="text-gray-300 mt-0.5">
                                  {t.premarket_plan}
                                </p>
                              </div>
                            )}
                            {t.notes && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                  Notes
                                </span>
                                <p className="text-gray-300 mt-0.5">
                                  {t.notes}
                                </p>
                              </div>
                            )}
                            {t.emotions && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                  Emotions
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {t.emotions.split(",").map((e) => (
                                    <span
                                      key={e.trim()}
                                      className="emotion-pill"
                                    >
                                      {e.trim()}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {t.stop_loss_price != null && (
                              <div>
                                <span className="text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                                  Stop Loss
                                </span>
                                <p className="text-yellow-400 font-medium mt-0.5">
                                  ${Number(t.stop_loss_price).toFixed(2)}
                                </p>
                              </div>
                            )}
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
  );
}
