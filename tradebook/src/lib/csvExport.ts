import type { Trade } from "../types/trade";
import { calcPnl, calcRR } from "./calc";

export function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportTradesToCsv(trades: Trade[]) {
  const headers = [
    "Date",
    "Ticker",
    "Side",
    "Entry",
    "Exit",
    "Size",
    "Profit / Loss",
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
