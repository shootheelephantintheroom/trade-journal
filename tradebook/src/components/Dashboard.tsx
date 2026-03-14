import type { Trade, MissedTrade } from "../types/trade";
import { calcPnl, calcRR, calcStreak } from "../lib/calc";
import { calcMissedPnl } from "./MissedTrades";

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-5">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

interface DayStats {
  date: string;
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
}

function buildDailyStats(trades: Trade[]): DayStats[] {
  const byDate = new Map<string, Trade[]>();
  for (const t of trades) {
    const existing = byDate.get(t.trade_date) || [];
    existing.push(t);
    byDate.set(t.trade_date, existing);
  }

  const days: DayStats[] = [];
  for (const [date, dayTrades] of byDate) {
    const pnls = dayTrades.map(calcPnl);
    days.push({
      date,
      trades: dayTrades.length,
      pnl: pnls.reduce((a, b) => a + b, 0),
      wins: pnls.filter((p) => p > 0).length,
      losses: pnls.filter((p) => p < 0).length,
    });
  }

  days.sort((a, b) => (a.date > b.date ? -1 : 1));
  return days;
}

function AmberStatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-gray-800/50 p-5 border-l-2 border-l-yellow-500/60">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard({
  trades,
  missedTrades = [],
  onLogTrade,
}: {
  trades: Trade[];
  missedTrades?: MissedTrade[];
  onLogTrade?: () => void;
}) {
  if (trades.length === 0 && missedTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">📊</div>
        <h2 className="text-lg font-semibold text-white">
          No trades logged yet
        </h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Your dashboard will come alive once you start logging trades — win
          rate, P&L, streaks, and more.
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

  const hasTrades = trades.length > 0;

  const pnls = trades.map(calcPnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const totalPnl = pnls.reduce((a, b) => a + b, 0);
  const winRate = hasTrades ? (wins.length / trades.length) * 100 : 0;
  const avgWin =
    wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  // Best / worst trade
  let bestTrade = trades[0] ?? null;
  let worstTrade = trades[0] ?? null;
  let bestPnl = pnls[0] ?? 0;
  let worstPnl = pnls[0] ?? 0;
  for (let i = 1; i < trades.length; i++) {
    if (pnls[i] > bestPnl) {
      bestPnl = pnls[i];
      bestTrade = trades[i];
    }
    if (pnls[i] < worstPnl) {
      worstPnl = pnls[i];
      worstTrade = trades[i];
    }
  }

  // Avg R:R (only for trades with stop loss)
  const rrValues = trades.map(calcRR).filter((r): r is number => r !== null);
  const avgRR =
    rrValues.length > 0
      ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length
      : null;

  // Profit factor
  const grossWins = wins.reduce((a, b) => a + b, 0);
  const grossLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : null;

  // Streak
  const streak = calcStreak(trades);

  // Daily stats
  const dailyStats = buildDailyStats(trades);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-white">Dashboard</h2>

      {hasTrades && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total P&L"
              value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
              color={totalPnl >= 0 ? "text-accent-400" : "text-red-400"}
            />
            <StatCard label="Total Trades" value={String(trades.length)} />
            <StatCard
              label="Win Rate"
              value={`${winRate.toFixed(1)}%`}
              color={winRate >= 50 ? "text-accent-400" : "text-red-400"}
              sub={`${wins.length}W / ${losses.length}L`}
            />
            <StatCard
              label="Streak"
              value={
                streak.type === "none"
                  ? "—"
                  : `${streak.count}${streak.type === "win" ? "W" : "L"}`
              }
              color={
                streak.type === "win"
                  ? "text-accent-400"
                  : streak.type === "loss"
                    ? "text-red-400"
                    : undefined
              }
            />
          </div>

          {/* Performance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Avg Win"
              value={`+$${avgWin.toFixed(2)}`}
              color="text-accent-400"
            />
            <StatCard
              label="Avg Loss"
              value={`-$${Math.abs(avgLoss).toFixed(2)}`}
              color="text-red-400"
            />
            {avgRR !== null && (
              <StatCard
                label="Avg R:R"
                value={`${avgRR.toFixed(2)}R`}
                color={avgRR >= 1 ? "text-accent-400" : "text-red-400"}
              />
            )}
            {profitFactor !== null && (
              <StatCard
                label="Profit Factor"
                value={profitFactor.toFixed(2)}
                color={profitFactor >= 1 ? "text-accent-400" : "text-red-400"}
              />
            )}
            <StatCard
              label="Best Trade"
              value={bestPnl > 0 ? `+$${bestPnl.toFixed(2)}` : "—"}
              color={bestPnl > 0 ? "text-accent-400" : "text-gray-500"}
              sub={bestPnl > 0 && bestTrade ? bestTrade.ticker : undefined}
            />
            <StatCard
              label="Worst Trade"
              value={worstPnl < 0 ? `-$${Math.abs(worstPnl).toFixed(2)}` : "—"}
              color={worstPnl < 0 ? "text-red-400" : "text-gray-500"}
              sub={worstPnl < 0 && worstTrade ? worstTrade.ticker : undefined}
            />
          </div>
        </>
      )}

      {/* Missed Opportunities */}
      {missedTrades.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-300">
            Missed Opportunities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AmberStatCard
              label="Missed Trades"
              value={String(missedTrades.length)}
              color="text-yellow-400"
            />
            {(() => {
              const missedPnls = missedTrades
                .map(calcMissedPnl)
                .filter((p): p is number => p !== null);
              const totalMissedPnl =
                missedPnls.length > 0
                  ? missedPnls.reduce((a, b) => a + b, 0)
                  : null;
              return (
                <AmberStatCard
                  label="Missed P&L"
                  value={
                    totalMissedPnl !== null
                      ? `${totalMissedPnl >= 0 ? "+" : ""}$${totalMissedPnl.toFixed(2)}`
                      : "—"
                  }
                  color={
                    totalMissedPnl === null
                      ? "text-gray-500"
                      : totalMissedPnl >= 0
                        ? "text-accent-400"
                        : "text-red-400"
                  }
                />
              );
            })()}
            {(() => {
              const setupCounts = new Map<string, number>();
              for (const mt of missedTrades) {
                for (const tag of mt.tags || []) {
                  setupCounts.set(tag, (setupCounts.get(tag) || 0) + 1);
                }
              }
              let topSetup: string | null = null;
              let topCount = 0;
              for (const [tag, count] of setupCounts) {
                if (count > topCount) {
                  topSetup = tag;
                  topCount = count;
                }
              }
              return (
                <AmberStatCard
                  label="Top Missed Setup"
                  value={topSetup || "—"}
                  color={topSetup ? "text-yellow-400" : "text-gray-500"}
                  sub={topSetup ? `${topCount}x` : undefined}
                />
              );
            })()}
            {(() => {
              const reasonCounts = new Map<string, number>();
              for (const mt of missedTrades) {
                for (const r of mt.hesitation_reasons || []) {
                  reasonCounts.set(r, (reasonCounts.get(r) || 0) + 1);
                }
              }
              let topReason: string | null = null;
              let topCount = 0;
              for (const [reason, count] of reasonCounts) {
                if (count > topCount) {
                  topReason = reason;
                  topCount = count;
                }
              }
              return (
                <AmberStatCard
                  label="Top Hesitation"
                  value={topReason || "—"}
                  color={topReason ? "text-yellow-400" : "text-gray-500"}
                  sub={topReason ? `${topCount}x` : undefined}
                />
              );
            })()}
          </div>
        </>
      )}

      {/* Daily Breakdown */}
      {hasTrades && (
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Daily Breakdown
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Trades</th>
                  <th className="px-4 py-3">W / L</th>
                  <th className="px-4 py-3">Win Rate</th>
                  <th className="px-4 py-3">P&L</th>
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
                      className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-gray-300">{day.date}</td>
                      <td className="px-4 py-2.5 text-gray-300">
                        {day.trades}
                      </td>
                      <td className="px-4 py-2.5 text-gray-300">
                        <span className="text-accent-400">{day.wins}</span>
                        {" / "}
                        <span className="text-red-400">{day.losses}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-300">{wr}%</td>
                      <td
                        className={
                          "px-4 py-2.5 font-medium " +
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
      )}
    </div>
  );
}
