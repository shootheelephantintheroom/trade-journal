import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import type { Trade, MissedTrade } from "../types/trade";
import { calcPnl, calcRR, calcStreak } from "../lib/calc";
import { calcMissedPnl } from "./MissedTrades";
import { todayLocal } from "../lib/date";
import { useToast } from "./Toast";
import CalendarHeatmap from "./CalendarHeatmap";
import { StatCard, AmberStatCard } from "./dashboard/StatCards";
import EquityCurve from "./dashboard/EquityCurve";
import DailyBreakdown from "./dashboard/DailyBreakdown";
import SetupPerformance from "./dashboard/SetupPerformance";
import EmotionPerformance from "./dashboard/EmotionPerformance";
import RecentTrades from "./dashboard/RecentTrades";
import { buildDailyStats, buildTagStats, buildEmotionStats, calcDrawdownInfo } from "./dashboard/helpers";
import { useSubscription } from "../contexts/SubscriptionContext";
import DashboardFilters, { FilterSummary, QuickDatePills, useDashboardFilters, applyFilters } from "./dashboard/DashboardFilters";

function TodaySummary({ trades }: { trades: Trade[] }) {
  const today = todayLocal();
  const todayTrades = trades.filter((t) => t.trade_date === today);
  if (todayTrades.length === 0) return null;

  const pnls = todayTrades.map(calcPnl);
  const totalPnl = pnls.reduce((a, b) => a + b, 0);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;

  return (
    <div className="rounded-xl bg-surface-1 p-6 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">
          Today's Session
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-tertiary uppercase tracking-wider">Trades</p>
          <p className="text-2xl font-semibold tabular-nums text-primary">{todayTrades.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-tertiary uppercase tracking-wider">W / L</p>
          <p className="text-2xl font-semibold tabular-nums">
            <span className="text-profit">{wins}</span>
            <span className="text-tertiary"> / </span>
            <span className="text-loss">{losses}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] text-tertiary uppercase tracking-wider">P&L</p>
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums",
              totalPnl >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({
  missedTrades = [],
  onLogTrade,
}: {
  missedTrades?: MissedTrade[];
  onLogTrade?: () => void;
}) {
  const { showToast } = useToast();
  const { isPro, isTrialing } = useSubscription();
  const proUser = isPro || isTrialing;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, updateFilters] = useDashboardFilters();

  useEffect(() => {
    async function fetchTrades() {
      setLoading(true);
      let query = supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false })
        .order("entry_time", { ascending: false });
      if (filters.from) query = query.gte("trade_date", filters.from);
      if (filters.to) query = query.lte("trade_date", filters.to);
      const { data, error } = await query;
      if (error) {
        showToast("Failed to load trades", "error");
      } else {
        setTrades((data as Trade[]) || []);
      }
      setLoading(false);
    }
    fetchTrades();
  }, [filters.from, filters.to, showToast]);
  const filteredTrades = useMemo(
    () => proUser ? applyFilters(trades, filters) : trades,
    [trades, filters, proUser]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-6 w-6 border-2 border-tertiary border-t-brand rounded-full animate-spin" />
        <p className="text-sm text-tertiary">Loading dashboard...</p>
      </div>
    );
  }

  if (trades.length === 0 && missedTrades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-1 flex items-center justify-center text-3xl">
          📊
        </div>
        <h2 className="text-lg font-semibold text-primary tracking-tight">
          No trades logged yet
        </h2>
        <p className="text-sm text-secondary text-center max-w-xs">
          Your dashboard will come alive once you start logging trades — win
          rate, P&L, streaks, and more.
        </p>
        {onLogTrade && (
          <button
            onClick={onLogTrade}
            className="mt-2 bg-brand hover:bg-brand/90 text-surface-0 font-medium text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Log Your First Trade
          </button>
        )}
      </div>
    );
  }

  const hasTrades = filteredTrades.length > 0;

  const pnls = filteredTrades.map(calcPnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const totalPnl = pnls.reduce((a, b) => a + b, 0);
  const winRate = hasTrades ? (wins.length / filteredTrades.length) * 100 : 0;
  const avgWin =
    wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

  // Best / worst trade
  let bestTrade = filteredTrades[0] ?? null;
  let worstTrade = filteredTrades[0] ?? null;
  let bestPnl = pnls[0] ?? 0;
  let worstPnl = pnls[0] ?? 0;
  for (let i = 1; i < filteredTrades.length; i++) {
    if (pnls[i] > bestPnl) {
      bestPnl = pnls[i];
      bestTrade = filteredTrades[i];
    }
    if (pnls[i] < worstPnl) {
      worstPnl = pnls[i];
      worstTrade = filteredTrades[i];
    }
  }

  // Avg R:R (only for trades with stop loss)
  const rrValues = filteredTrades.map(calcRR).filter((r): r is number => r !== null);
  const avgRR =
    rrValues.length > 0
      ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length
      : null;

  // Profit factor
  const grossWins = wins.reduce((a, b) => a + b, 0);
  const grossLosses = Math.abs(losses.reduce((a, b) => a + b, 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : null;

  // Streak
  const streak = calcStreak(filteredTrades);

  // Daily stats
  const dailyStats = buildDailyStats(filteredTrades);

  // Tag & emotion stats
  const tagStats = buildTagStats(filteredTrades);
  const emotionStats = buildEmotionStats(filteredTrades);

  // Equity curve data (cumulative P&L, chronological)
  const equityDays = [...dailyStats].reverse();
  let runningPnl = 0;
  const equityPoints = [
    { date: "", value: 0 },
    ...equityDays.map((d) => {
      runningPnl += d.pnl;
      return { date: d.date, value: runningPnl };
    }),
  ];

  // Drawdown
  const drawdownInfo = calcDrawdownInfo(equityPoints);

  // Expectancy: (win_rate × avg_win) + (loss_rate × avg_loss)
  // avgLoss is already negative so this naturally subtracts
  const expectancy = hasTrades
    ? (wins.length / filteredTrades.length) * avgWin +
      (losses.length / filteredTrades.length) * avgLoss
    : 0;

  // Expectancy per R (only if ≥50% of trades have stop losses)
  const tradesWithStops = filteredTrades.filter((t) => t.stop_loss_price).length;
  const hasEnoughStops = hasTrades && tradesWithStops >= filteredTrades.length * 0.5;
  let expectancyR: number | null = null;
  if (hasEnoughStops) {
    const rrAll = filteredTrades
      .filter((t) => t.stop_loss_price)
      .map((t) => ({ rr: calcRR(t), win: calcPnl(t) > 0 }))
      .filter((x): x is { rr: number; win: boolean } => x.rr !== null);
    if (rrAll.length > 0) {
      const rrWins = rrAll.filter((x) => x.win);
      const rrLosses = rrAll.filter((x) => !x.win);
      const avgWinR =
        rrWins.length > 0
          ? rrWins.reduce((a, x) => a + x.rr, 0) / rrWins.length
          : 0;
      const avgLossR =
        rrLosses.length > 0
          ? Math.abs(rrLosses.reduce((a, x) => a + x.rr, 0) / rrLosses.length)
          : 0;
      const winRateR = rrWins.length / rrAll.length;
      const lossRateR = rrLosses.length / rrAll.length;
      expectancyR = winRateR * avgWinR - lossRateR * avgLossR;
    }
  }

  // Recovery factor
  const recoveryFactor =
    drawdownInfo.maxDrawdown > 0 ? totalPnl / drawdownInfo.maxDrawdown : null;

  // Sharpe-like ratio (annualized)
  const dailyPnls = dailyStats.map((d) => d.pnl);
  let sharpe: number | null = null;
  if (dailyPnls.length > 1) {
    const mean = dailyPnls.reduce((a, b) => a + b, 0) / dailyPnls.length;
    const variance =
      dailyPnls.reduce((sum, p) => sum + (p - mean) ** 2, 0) /
      (dailyPnls.length - 1);
    const std = Math.sqrt(variance);
    if (std > 0) {
      sharpe = (mean / std) * Math.sqrt(252);
    }
  }

  // Recent trades (5 most recent by date + time)
  const recentTrades = [...filteredTrades]
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date)
        return b.trade_date.localeCompare(a.trade_date);
      return (b.entry_time || "").localeCompare(a.entry_time || "");
    })
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-primary tracking-tight">
        Dashboard
      </h2>

      {/* Quick date range */}
      <QuickDatePills filters={filters} onUpdate={updateFilters} />

      {/* Filters (Pro-only) */}
      {proUser && (
        <>
          <DashboardFilters trades={trades} filters={filters} onUpdate={updateFilters} />
          <FilterSummary
            filtered={filteredTrades.length}
            total={trades.length}
            from={filters.from}
            to={filters.to}
          />
        </>
      )}

      {/* Today's Summary */}
      {proUser && hasTrades && <TodaySummary trades={filteredTrades} />}

      {hasTrades && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total P&L"
              value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
              color={totalPnl >= 0 ? "text-profit" : "text-loss"}
              accent={totalPnl >= 0 ? "green" : "red"}
            />
            <StatCard
              label="Total Trades"
              value={String(filteredTrades.length)}
              accent="neutral"
            />
            <StatCard
              label="Win Rate"
              value={`${winRate.toFixed(1)}%`}
              color={winRate >= 50 ? "text-profit" : "text-loss"}
              sub={`${wins.length}W / ${losses.length}L`}
              accent={winRate >= 50 ? "green" : "red"}
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
                  ? "text-profit"
                  : streak.type === "loss"
                    ? "text-loss"
                    : undefined
              }
              accent={
                streak.type === "win"
                  ? "green"
                  : streak.type === "loss"
                    ? "red"
                    : "neutral"
              }
            />
          </div>

          {/* Performance (Pro only) */}
          {proUser && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard
                label="Avg Win"
                value={`+$${avgWin.toFixed(2)}`}
                color="text-profit"
                accent="green"
              />
              <StatCard
                label="Avg Loss"
                value={`-$${Math.abs(avgLoss).toFixed(2)}`}
                color="text-loss"
                accent="red"
              />
              {avgRR !== null && (
                <StatCard
                  label="Avg R:R"
                  value={`${avgRR.toFixed(2)}R`}
                  color={avgRR >= 1 ? "text-profit" : "text-loss"}
                  accent={avgRR >= 1 ? "green" : "red"}
                />
              )}
              {profitFactor !== null && (
                <StatCard
                  label="Profit Factor"
                  value={profitFactor.toFixed(2)}
                  color={profitFactor >= 1 ? "text-profit" : "text-loss"}
                  accent={profitFactor >= 1 ? "green" : "red"}
                />
              )}
              <StatCard
                label="Best Trade"
                value={bestPnl > 0 ? `+$${bestPnl.toFixed(2)}` : "—"}
                color={bestPnl > 0 ? "text-profit" : "text-tertiary"}
                sub={bestPnl > 0 && bestTrade ? bestTrade.ticker : undefined}
                accent={bestPnl > 0 ? "green" : "neutral"}
              />
              <StatCard
                label="Worst Trade"
                value={worstPnl < 0 ? `-$${Math.abs(worstPnl).toFixed(2)}` : "—"}
                color={worstPnl < 0 ? "text-loss" : "text-tertiary"}
                sub={worstPnl < 0 && worstTrade ? worstTrade.ticker : undefined}
                accent={worstPnl < 0 ? "red" : "neutral"}
              />
            </div>
          )}

          {/* Risk Metrics (Pro only) */}
          {proUser && (
            <>
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                Risk Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard
                  label="Expectancy"
                  value={`${expectancy >= 0 ? "+" : "-"}$${Math.abs(expectancy).toFixed(2)}`}
                  color={expectancy >= 0 ? "text-profit" : "text-loss"}
                  sub="per trade"
                  accent={expectancy >= 0 ? "green" : "red"}
                />
                {expectancyR !== null && (
                  <StatCard
                    label="Expectancy / R"
                    value={`${expectancyR >= 0 ? "+" : ""}${expectancyR.toFixed(2)}R`}
                    color={expectancyR >= 0 ? "text-profit" : "text-loss"}
                    accent={expectancyR >= 0 ? "green" : "red"}
                  />
                )}
                <StatCard
                  label="Max Drawdown"
                  value={
                    drawdownInfo.maxDrawdown > 0
                      ? `-$${drawdownInfo.maxDrawdown.toFixed(2)}`
                      : "—"
                  }
                  color={drawdownInfo.maxDrawdown > 0 ? "text-loss" : "text-tertiary"}
                  sub={
                    drawdownInfo.maxDrawdownPct > 0
                      ? `${drawdownInfo.maxDrawdownPct.toFixed(1)}% of peak`
                      : undefined
                  }
                  accent={drawdownInfo.maxDrawdown > 0 ? "red" : "neutral"}
                />
                <StatCard
                  label="Current Drawdown"
                  value={
                    drawdownInfo.currentDrawdown > 0
                      ? `-$${drawdownInfo.currentDrawdown.toFixed(2)}`
                      : "$0.00"
                  }
                  color={
                    drawdownInfo.currentDrawdown > 0
                      ? "text-loss"
                      : "text-profit"
                  }
                  accent={drawdownInfo.currentDrawdown > 0 ? "red" : "green"}
                />
                {recoveryFactor !== null && (
                  <StatCard
                    label="Recovery Factor"
                    value={recoveryFactor.toFixed(2)}
                    color={recoveryFactor >= 1 ? "text-profit" : "text-loss"}
                    accent={recoveryFactor >= 1 ? "green" : "red"}
                  />
                )}
                {sharpe !== null && (
                  <StatCard
                    label="Sharpe Ratio"
                    value={sharpe.toFixed(2)}
                    color={sharpe >= 0 ? "text-profit" : "text-loss"}
                    sub="annualized"
                    accent={sharpe >= 0 ? "green" : "red"}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Missed Opportunities (Pro only) */}
      {proUser && missedTrades.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
            Missed Opportunities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <AmberStatCard
              label="Missed Trades"
              value={String(missedTrades.length)}
              color="text-amber"
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
                      ? "text-tertiary"
                      : totalMissedPnl >= 0
                        ? "text-profit"
                        : "text-loss"
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
                  color={topSetup ? "text-amber" : "text-tertiary"}
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
                  color={topReason ? "text-amber" : "text-tertiary"}
                  sub={topReason ? `${topCount}x` : undefined}
                />
              );
            })()}
          </div>
        </>
      )}

      {/* Equity Curve & Daily Breakdown */}
      {hasTrades && (
        <div className={cn("grid grid-cols-1 gap-4", proUser && "md:grid-cols-2")}>
          {/* Equity Curve */}
          {equityPoints.length >= 2 && (
            <div className="rounded-xl bg-surface-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                  Equity Curve
                </h3>
                <span
                  className={cn(
                    "text-xs font-semibold font-mono px-2.5 py-1 rounded-md",
                    totalPnl >= 0
                      ? "text-profit bg-profit-muted border border-profit-muted"
                      : "text-loss bg-loss-muted border border-loss-muted"
                  )}
                >
                  {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                </span>
              </div>
              <EquityCurve
                points={equityPoints}
                drawdownRegion={
                  drawdownInfo.maxDrawdown > 0
                    ? {
                        peakIdx: drawdownInfo.maxDdPeakIdx,
                        troughIdx: drawdownInfo.maxDdTroughIdx,
                      }
                    : undefined
                }
              />
            </div>
          )}

          {/* Daily Breakdown (Pro only) */}
          {proUser && <DailyBreakdown dailyStats={dailyStats} />}
        </div>
      )}

      {/* Trade Calendar */}
      {hasTrades && dailyStats.length > 0 && (
        <div className="rounded-xl bg-surface-1 p-6 page-enter">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4">
            Trade Calendar
          </h3>
          <CalendarHeatmap dailyStats={dailyStats} />
        </div>
      )}

      {/* Setup Performance */}
      {hasTrades && tagStats.length > 0 && (
        <SetupPerformance tagStats={tagStats} />
      )}

      {/* Emotion Performance */}
      {hasTrades && emotionStats.length > 0 && (
        <EmotionPerformance emotionStats={emotionStats} />
      )}

      {/* Recent Trades */}
      {hasTrades && (
        <RecentTrades recentTrades={recentTrades} />
      )}
    </div>
  );
}
