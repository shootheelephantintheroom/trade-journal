import type { TagStats } from "./helpers";

export default function SetupPerformance({
  tagStats,
}: {
  tagStats: TagStats[];
}) {
  return (
    <div className="card-panel p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
        Setup Performance
      </h3>
      <div className="overflow-x-auto">
        <table className="trade-table w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Setup
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Trades
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                Win Rate
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
                Avg P&L
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
                Total P&L
              </th>
              <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
                Avg R:R
              </th>
            </tr>
          </thead>
          <tbody>
            {tagStats.map((s) => (
              <tr key={s.tag} className="border-t border-gray-800/40">
                <td className="py-2.5">
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20">
                    {s.tag}
                  </span>
                </td>
                <td className="py-2.5 text-gray-300 text-xs">{s.totalTrades}</td>
                <td className={`py-2.5 text-xs font-semibold ${s.winRate >= 50 ? "text-accent-400" : "text-red-400"}`}>
                  {s.winRate.toFixed(0)}%
                </td>
                <td className={`py-2.5 text-right text-xs font-semibold ${s.avgPnl >= 0 ? "text-accent-400" : "text-red-400"}`}>
                  {s.avgPnl >= 0 ? "+" : ""}${s.avgPnl.toFixed(2)}
                </td>
                <td className={`py-2.5 text-right text-xs font-semibold ${s.totalPnl >= 0 ? "text-accent-400" : "text-red-400"}`}>
                  {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                </td>
                <td className="py-2.5 text-right text-xs text-gray-300">
                  {s.avgRR !== null ? `${s.avgRR.toFixed(2)}R` : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
