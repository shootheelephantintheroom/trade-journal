import type { DayStats } from "./helpers";

export default function DailyBreakdown({
  dailyStats,
}: {
  dailyStats: DayStats[];
}) {
  return (
    <div className="card-panel p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Daily Breakdown
      </h3>
      <div className="overflow-x-auto">
        <table className="trade-table w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Date
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Trades
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                W / L
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Win Rate
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
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
                  className="border-t border-gray-800/40"
                >
                  <td className="py-2.5 text-gray-300 text-xs">
                    {day.date}
                  </td>
                  <td className="py-2.5 text-gray-300 text-xs">
                    {day.trades}
                  </td>
                  <td className="py-2.5 text-xs">
                    <span className="text-accent-400 font-medium">
                      {day.wins}
                    </span>
                    <span className="text-gray-600"> / </span>
                    <span className="text-red-400 font-medium">
                      {day.losses}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-300 text-xs">
                    {wr}%
                  </td>
                  <td
                    className={
                      "py-2.5 text-right text-xs font-semibold " +
                      (day.pnl >= 0 ? "text-accent-400" : "text-red-400")
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
