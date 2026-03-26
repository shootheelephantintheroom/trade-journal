import type { DayStats } from "./helpers";

export default function DailyBreakdown({
  dailyStats,
}: {
  dailyStats: DayStats[];
}) {
  return (
    <div className="rounded-xl bg-surface-1 border border-white/[0.06] p-5">
      <h3 className="text-[13px] font-medium text-zinc-400 mb-4">
        Daily Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Date
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Trades
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                W / L
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary">
                Win Rate
              </th>
              <th className="pb-2.5 text-[13px] font-medium text-secondary text-right">
                P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.map((day) => {
              const wr =
                day.trades > 0
                  ? ((day.wins / day.trades) * 100).toFixed(0)
                  : "0";
              return (
                <tr
                  key={day.date}
                  className="border-t border-border hover:bg-surface-2 transition-colors"
                >
                  <td className="py-2.5 text-secondary text-xs">
                    {day.date}
                  </td>
                  <td className="py-2.5 text-secondary text-xs">
                    {day.trades}
                  </td>
                  <td className="py-2.5 text-xs">
                    <span className="text-profit font-medium">
                      {day.wins}
                    </span>
                    <span className="text-tertiary"> / </span>
                    <span className="text-loss font-medium">
                      {day.losses}
                    </span>
                  </td>
                  <td className="py-2.5 text-secondary text-xs">
                    {wr}%
                  </td>
                  <td
                    className={
                      "py-2.5 text-right text-xs font-medium font-mono " +
                      (day.pnl >= 0 ? "text-profit" : "text-loss")
                    }
                  >
                    {day.pnl >= 0 ? "+" : ""}${day.pnl.toFixed(2)}
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
