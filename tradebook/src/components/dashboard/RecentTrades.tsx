import type { Trade } from "../../types/trade";
import { calcPnl } from "../../lib/calc";
import { cn } from "../../lib/utils";

export default function RecentTrades({
  recentTrades,
}: {
  recentTrades: Trade[];
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-[13px] font-medium text-secondary">
                Time
              </th>
              <th className="pb-2 text-[13px] font-medium text-secondary">
                Ticker
              </th>
              <th className="pb-2 text-[13px] font-medium text-secondary">
                Side
              </th>
              <th className="pb-2 text-[13px] font-medium text-secondary">
                Entry / Exit
              </th>
              <th className="pb-2 text-[13px] font-medium text-secondary">
                Grade
              </th>
              <th className="pb-2 text-[13px] font-medium text-secondary text-right">
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
                  className="border-t border-border hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2 text-tertiary text-[13px]">
                    {t.entry_time || "\u2014"}
                  </td>
                  <td className="py-2">
                    <span className="font-medium text-primary text-[13px]">
                      {t.ticker}
                    </span>
                    {t.tags &&
                      t.tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag}
                          className="ml-1.5 px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium bg-white/[0.06] text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                  </td>
                  <td
                    className={cn(
                      "py-2 text-[13px] font-medium",
                      t.side === "long" ? "text-profit" : "text-loss"
                    )}
                  >
                    {t.side === "long" ? "LONG" : "SHORT"}
                  </td>
                  <td className="py-2 text-[13px] text-secondary">
                    ${t.entry_price.toFixed(2)}{" "}
                    <span className="text-tertiary">{"\u2192"}</span>{" "}
                    ${t.exit_price.toFixed(2)}
                  </td>
                  <td className="py-2">
                    {t.grade ? (
                      <span
                        className={cn(
                          "inline-block w-6 text-center rounded-[4px] text-[12px] font-medium py-0.5",
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
                      "py-2 text-right text-[13px] font-medium font-mono",
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
