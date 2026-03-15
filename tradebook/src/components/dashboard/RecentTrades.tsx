import type { Trade } from "../../types/trade";
import { calcPnl } from "../../lib/calc";

export default function RecentTrades({
  recentTrades,
}: {
  recentTrades: Trade[];
}) {
  return (
    <div className="card-panel p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Recent Trades
      </h3>
      <div className="overflow-x-auto">
        <table className="trade-table w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Time
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Ticker
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Side
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Entry / Exit
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Grade
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
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
                  className="border-t border-gray-800/40"
                >
                  <td className="py-2.5 text-gray-500 text-xs">
                    {t.entry_time || "\u2014"}
                  </td>
                  <td className="py-2.5">
                    <span className="font-semibold text-white text-sm">
                      {t.ticker}
                    </span>
                    {t.tags &&
                      t.tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag}
                          className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                  </td>
                  <td
                    className={`py-2.5 text-xs font-medium ${
                      t.side === "long"
                        ? "text-accent-400"
                        : "text-red-400"
                    }`}
                  >
                    {t.side === "long" ? "LONG" : "SHORT"}
                  </td>
                  <td className="py-2.5 text-xs text-gray-400">
                    ${t.entry_price.toFixed(2)}{" "}
                    <span className="text-gray-600">\u2192</span>{" "}
                    ${t.exit_price.toFixed(2)}
                  </td>
                  <td className="py-2.5">
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
                      <span className="text-gray-600">\u2014</span>
                    )}
                  </td>
                  <td
                    className={
                      "py-2.5 text-right text-sm font-semibold " +
                      (pl >= 0
                        ? "text-accent-400"
                        : "text-red-400")
                    }
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
