import type { Trade } from "../../types/trade";
import { calcPnl } from "../../lib/calc";
import { cn } from "../../lib/utils";

export default function RecentTrades({
  recentTrades,
}: {
  recentTrades: Trade[];
}) {
  return (
    <div className="rounded-xl bg-surface-1 border border-white/[0.06] p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Time
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Ticker
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Side
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Entry / Exit
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Grade
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary text-right">
                P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {recentTrades.map((t) => {
              const pl = calcPnl(t);
              return (
                <tr
                  key={t.id}
                  className="border-t border-border hover:bg-surface-2 transition-colors"
                >
                  <td className="py-2.5 text-tertiary text-xs">
                    {t.entry_time || "\u2014"}
                  </td>
                  <td className="py-2.5">
                    <span className="font-medium text-primary text-sm">
                      {t.ticker}
                    </span>
                    {t.tags &&
                      t.tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag}
                          className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-muted text-brand border border-brand/20"
                        >
                          {tag}
                        </span>
                      ))}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-xs font-medium",
                      t.side === "long" ? "text-profit" : "text-loss"
                    )}
                  >
                    {t.side === "long" ? "LONG" : "SHORT"}
                  </td>
                  <td className="py-2.5 text-xs text-secondary">
                    ${t.entry_price.toFixed(2)}{" "}
                    <span className="text-tertiary">{"\u2192"}</span>{" "}
                    ${t.exit_price.toFixed(2)}
                  </td>
                  <td className="py-2.5">
                    {t.grade ? (
                      <span
                        className={cn(
                          "inline-block w-6 text-center rounded text-xs font-medium py-0.5",
                          t.grade === "A"
                            ? "bg-profit-muted text-profit"
                            : t.grade === "B"
                              ? "bg-brand-muted text-brand"
                              : t.grade === "C"
                                ? "bg-amber-muted text-amber"
                                : "bg-loss-muted text-loss"
                        )}
                      >
                        {t.grade}
                      </span>
                    ) : (
                      <span className="text-tertiary">{"\u2014"}</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "py-2.5 text-right text-sm font-medium font-mono",
                      pl >= 0 ? "text-profit" : "text-loss"
                    )}
                  >
                    {pl >= 0 ? "+" : ""}${pl.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
