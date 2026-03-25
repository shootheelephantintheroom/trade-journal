import type { EmotionStats } from "./helpers";

export default function EmotionPerformance({
  emotionStats,
}: {
  emotionStats: EmotionStats[];
}) {
  return (
    <div className="rounded-xl bg-surface-1 p-5">
      <h3 className="text-xs font-medium text-tertiary uppercase tracking-wider mb-4">
        Emotion Performance
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2.5 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                Emotion
              </th>
              <th className="pb-2.5 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                Trades
              </th>
              <th className="pb-2.5 text-[10px] text-tertiary uppercase font-medium tracking-wider">
                Win Rate
              </th>
              <th className="pb-2.5 text-[10px] text-tertiary uppercase font-medium tracking-wider text-right">
                Avg P&L
              </th>
              <th className="pb-2.5 text-[10px] text-tertiary uppercase font-medium tracking-wider text-right">
                Total P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {emotionStats.map((s) => (
              <tr key={s.emotion} className="border-t border-border hover:bg-surface-2 transition-colors">
                <td className="py-2.5 text-secondary text-xs">{s.emotion}</td>
                <td className="py-2.5 text-secondary text-xs">{s.totalTrades}</td>
                <td className={`py-2.5 text-xs font-medium ${s.winRate >= 50 ? "text-profit" : "text-loss"}`}>
                  {s.winRate.toFixed(0)}%
                </td>
                <td className={`py-2.5 text-right text-xs font-medium font-mono ${s.avgPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {s.avgPnl >= 0 ? "+" : ""}${s.avgPnl.toFixed(2)}
                </td>
                <td className={`py-2.5 text-right text-xs font-medium font-mono ${s.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
