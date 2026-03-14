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
  a.download = `tradebook-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TradeList({
  trades,
  onLogTrade,
}: {
  trades: Trade[];
  onLogTrade?: () => void;
}) {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">📋</div>
        <h2 className="text-lg font-semibold text-white">No trades yet</h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Start logging to see your trade history here.
        </p>
        {onLogTrade && (
          <button
            onClick={onLogTrade}
            className="mt-2 bg-accent-600 hover:bg-accent-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Log Your First Trade
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end px-4 pb-3">
        <button
          onClick={() => exportTradesToCsv(trades)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
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
          Export CSV
        </button>
      </div>
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-400 uppercase border-b border-gray-700">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Ticker</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Exit</th>
            <th className="px-4 py-3">Shares</th>
            <th className="px-4 py-3">P&L</th>
            <th className="px-4 py-3">R:R</th>
            <th className="px-4 py-3">Grade</th>
            <th className="px-4 py-3">Setup / Tags</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const pl = calcPnl(t);
            const rr = calcRR(t);
            return (
              <tr
                key={t.id}
                className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-300">{t.trade_date}</td>
                <td className="px-4 py-3 font-medium text-white">
                  {t.ticker}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      t.side === "long" ? "text-accent-400" : "text-red-400"
                    }
                  >
                    {t.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  ${t.entry_price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-300">
                  ${t.exit_price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-300">{t.shares}</td>
                <td
                  className={
                    "px-4 py-3 font-medium " +
                    (pl >= 0 ? "text-accent-400" : "text-red-400")
                  }
                >
                  {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-gray-300">
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
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {t.tags.map((tag) => (
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
                    {t.setup || "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
