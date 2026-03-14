import type { Trade, MissedTrade } from "../types/trade";
import { calcPnl, calcRR, calcStreak } from "../lib/calc";
import { calcMissedPnl } from "./MissedTrades";
import { todayLocal } from "../lib/date";

function StatCard({
  label,
  value,
  color,
  sub,
  accent,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  accent?: "green" | "red" | "neutral";
}) {
  const accentClass =
    accent === "green"
      ? "stat-card-green"
      : accent === "red"
        ? "stat-card-red"
        : "stat-card-neutral";

  return (
    <div
      className={`stat-card ${accentClass} rounded-xl border border-gray-800/80 bg-gray-900/60 p-5`}
    >
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-bold font-display ${color || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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
    <div className="stat-card stat-card-yellow rounded-xl border border-yellow-500/15 bg-gray-900/60 p-5">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-bold font-display ${color || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function EquityCurve({
  points,
}: {
  points: { date: string; value: number }[];
}) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  const W = 520;
  const H = 200;
  const pad = { t: 10, b: 25, l: 45, r: 10 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const coords = points.map((p, i) => ({
    x: pad.l + (i / (points.length - 1)) * cW,
    y: pad.t + cH - ((p.value - minVal) / range) * cH,
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  const areaPath =
    `M${coords[0].x},${coords[0].y} ` +
    coords
      .slice(1)
      .map((c) => `L${c.x},${c.y}`)
      .join(" ") +
    ` L${last.x},${pad.t + cH} L${coords[0].x},${pad.t + cH} Z`;

  const zeroY = pad.t + cH - ((0 - minVal) / range) * cH;

  const gridLines = [0.25, 0.5, 0.75].map((f) => ({
    y: pad.t + cH * (1 - f),
    val: minVal + range * f,
  }));

  const fmtDollar = (v: number) =>
    Math.abs(v) >= 1000
      ? `$${(v / 1000).toFixed(1)}k`
      : `$${v.toFixed(0)}`;

  const lineColor =
    points[points.length - 1].value >= 0 ? "#00C853" : "#ef4444";

  const firstDateIdx = points.findIndex((p) => p.date);
  const lastDateIdx = points.length - 1;

  // Estimate line length for draw animation
  let lineLength = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    lineLength += Math.sqrt(dx * dx + dy * dy);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 200, ["--line-length" as string]: Math.ceil(lineLength) }}
    >
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            y1={g.y}
            x2={W - pad.r}
            y2={g.y}
            stroke="rgba(55,65,81,0.3)"
            strokeWidth="1"
          />
          <text
            x={pad.l - 4}
            y={g.y + 3}
            fill="#6b7280"
            fontSize="9"
            textAnchor="end"
          >
            {fmtDollar(g.val)}
          </text>
        </g>
      ))}
      <line
        x1={pad.l}
        y1={zeroY}
        x2={W - pad.r}
        y2={zeroY}
        stroke="rgba(107,114,128,0.3)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      <text
        x={pad.l - 4}
        y={zeroY + 3}
        fill="#6b7280"
        fontSize="9"
        textAnchor="end"
      >
        $0
      </text>
      <path d={areaPath} fill="url(#eqGrad)" className="equity-area" />
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="equity-line"
      />
      <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
      <circle
        cx={last.x}
        cy={last.y}
        r="7"
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        opacity="0.4"
      />
      {firstDateIdx >= 0 && (
        <text
          x={coords[firstDateIdx].x}
          y={H - 4}
          fill="#6b7280"
          fontSize="9"
          textAnchor="start"
        >
          {points[firstDateIdx].date}
        </text>
      )}
      {lastDateIdx !== firstDateIdx && (
        <text
          x={last.x}
          y={H - 4}
          fill="#6b7280"
          fontSize="9"
          textAnchor="end"
        >
          {points[lastDateIdx].date}
        </text>
      )}
    </svg>
  );
}

function TodaySummary({ trades }: { trades: Trade[] }) {
  const today = todayLocal();
  const todayTrades = trades.filter((t) => t.trade_date === today);
  if (todayTrades.length === 0) return null;

  const pnls = todayTrades.map(calcPnl);
  const totalPnl = pnls.reduce((a, b) => a + b, 0);
  const wins = pnls.filter((p) => p > 0).length;
  const losses = pnls.filter((p) => p < 0).length;

  return (
    <div className="card-panel p-5 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-2 h-2 rounded-full bg-accent-500 animate-ping" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          Today's Session
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">Trades</p>
          <p className="text-xl font-bold font-display text-white">{todayTrades.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">W / L</p>
          <p className="text-xl font-bold font-display">
            <span className="text-accent-400">{wins}</span>
            <span className="text-gray-600"> / </span>
            <span className="text-red-400">{losses}</span>
          </p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">P&L</p>
          <p
            className={`text-xl font-bold font-display ${
              totalPnl >= 0 ? "text-accent-400" : "text-red-400"
            }`}
          >
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
          </p>
        </div>
      </div>
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
        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-3xl">
          📊
        </div>
        <h2 className="text-lg font-bold text-white font-display">
          No trades logged yet
        </h2>
        <p className="text-sm text-gray-400 text-center max-w-xs">
          Your dashboard will come alive once you start logging trades — win
          rate, P&L, streaks, and more.
        </p>
        {onLogTrade && (
          <button
            onClick={onLogTrade}
            className="btn-submit mt-2 bg-accent-600 hover:bg-accent-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg"
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

  // Recent trades (5 most recent by date + time)
  const recentTrades = [...trades]
    .sort((a, b) => {
      if (a.trade_date !== b.trade_date)
        return b.trade_date.localeCompare(a.trade_date);
      return (b.entry_time || "").localeCompare(a.entry_time || "");
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white font-display tracking-tight">
        Dashboard
      </h2>

      {/* Today's Summary */}
      {hasTrades && <TodaySummary trades={trades} />}

      {hasTrades && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total P&L"
              value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
              color={totalPnl >= 0 ? "text-accent-400" : "text-red-400"}
              accent={totalPnl >= 0 ? "green" : "red"}
            />
            <StatCard
              label="Total Trades"
              value={String(trades.length)}
              accent="neutral"
            />
            <StatCard
              label="Win Rate"
              value={`${winRate.toFixed(1)}%`}
              color={winRate >= 50 ? "text-accent-400" : "text-red-400"}
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
                  ? "text-accent-400"
                  : streak.type === "loss"
                    ? "text-red-400"
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

          {/* Performance */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              label="Avg Win"
              value={`+$${avgWin.toFixed(2)}`}
              color="text-accent-400"
              accent="green"
            />
            <StatCard
              label="Avg Loss"
              value={`-$${Math.abs(avgLoss).toFixed(2)}`}
              color="text-red-400"
              accent="red"
            />
            {avgRR !== null && (
              <StatCard
                label="Avg R:R"
                value={`${avgRR.toFixed(2)}R`}
                color={avgRR >= 1 ? "text-accent-400" : "text-red-400"}
                accent={avgRR >= 1 ? "green" : "red"}
              />
            )}
            {profitFactor !== null && (
              <StatCard
                label="Profit Factor"
                value={profitFactor.toFixed(2)}
                color={profitFactor >= 1 ? "text-accent-400" : "text-red-400"}
                accent={profitFactor >= 1 ? "green" : "red"}
              />
            )}
            <StatCard
              label="Best Trade"
              value={bestPnl > 0 ? `+$${bestPnl.toFixed(2)}` : "—"}
              color={bestPnl > 0 ? "text-accent-400" : "text-gray-500"}
              sub={bestPnl > 0 && bestTrade ? bestTrade.ticker : undefined}
              accent={bestPnl > 0 ? "green" : "neutral"}
            />
            <StatCard
              label="Worst Trade"
              value={worstPnl < 0 ? `-$${Math.abs(worstPnl).toFixed(2)}` : "—"}
              color={worstPnl < 0 ? "text-red-400" : "text-gray-500"}
              sub={worstPnl < 0 && worstTrade ? worstTrade.ticker : undefined}
              accent={worstPnl < 0 ? "red" : "neutral"}
            />
          </div>
        </>
      )}

      {/* Missed Opportunities */}
      {missedTrades.length > 0 && (
        <>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Missed Opportunities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Equity Curve & Daily Breakdown */}
      {hasTrades && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Equity Curve */}
          {equityPoints.length >= 2 && (
            <div className="card-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Equity Curve
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    totalPnl >= 0
                      ? "text-accent-400 bg-accent-500/10 border border-accent-500/20"
                      : "text-red-400 bg-red-500/10 border border-red-500/20"
                  }`}
                >
                  {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
                </span>
              </div>
              <EquityCurve points={equityPoints} />
            </div>
          )}

          {/* Daily Breakdown */}
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
        </div>
      )}

      {/* Recent Trades */}
      {hasTrades && (
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
                        {t.entry_time || "—"}
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
                        <span className="text-gray-600">→</span>{" "}
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
                          <span className="text-gray-600">—</span>
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
      )}
    </div>
  );
}
