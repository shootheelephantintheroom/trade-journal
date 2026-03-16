import { useMemo, useRef, useState } from "react";
import type { Trade } from "../../types/trade";
import { calcNetPnl } from "../../lib/calc";

interface Props {
  trades: Trade[];
}

interface TradePoint {
  trade: Trade;
  holdMin: number;
  pnl: number;
  positionSize: number;
}

interface HoldBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  wins: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

/* ── constants ──────────────────────────────────────────────── */

const BUCKET_DEFS = [
  { label: "<2 min", min: 0, max: 2 },
  { label: "2–5 min", min: 2, max: 5 },
  { label: "5–15 min", min: 5, max: 15 },
  { label: "15–30 min", min: 15, max: 30 },
  { label: "30–60 min", min: 30, max: 60 },
  { label: ">60 min", min: 60, max: Infinity },
];

/* ── helpers ────────────────────────────────────────────────── */

function parseMinutes(time: string): number | null {
  if (!time) return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  if (m[3]) return mins + parseInt(m[3], 10) / 60;
  return mins;
}

function fmtDollar(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : v > 0 ? "+" : "";
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtAxisDollar(v: number): string {
  if (v === 0) return "$0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtHoldTime(mins: number): string {
  if (mins < 1) return `${Math.round(mins * 60)}s`;
  if (mins < 60) return `${Math.round(mins)} min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Pick a human-friendly tick step for a given range and target count. */
function niceStep(range: number, targetTicks: number): number {
  if (range <= 0) return 1;
  const rough = range / targetTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  let nice: number;
  if (residual <= 1.5) nice = 1;
  else if (residual <= 3) nice = 2;
  else if (residual <= 7) nice = 5;
  else nice = 10;
  return nice * mag;
}

/* ── component ──────────────────────────────────────────────── */

export default function HoldTimeAnalysis({ trades }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    point: TradePoint;
    x: number;
    y: number;
    flipX: boolean;
  } | null>(null);

  const { points, buckets, sweetSpot, insights } = useMemo(() => {
    const points: TradePoint[] = [];

    for (const t of trades) {
      const entry = parseMinutes(t.entry_time);
      const exit = parseMinutes(t.exit_time);
      if (entry === null || exit === null) continue;
      const holdMin = exit - entry;
      if (holdMin <= 0) continue;
      points.push({
        trade: t,
        holdMin,
        pnl: calcNetPnl(t),
        positionSize: t.shares * t.entry_price,
      });
    }

    // Bucketed stats
    const buckets: HoldBucket[] = BUCKET_DEFS.map((def) => {
      const inBucket = points.filter(
        (p) => p.holdMin >= def.min && p.holdMin < def.max,
      );
      const pnls = inBucket.map((p) => p.pnl);
      const total = pnls.reduce((s, v) => s + v, 0);
      const wins = pnls.filter((v) => v > 0).length;
      return {
        ...def,
        count: inBucket.length,
        wins,
        winRate: inBucket.length > 0 ? (wins / inBucket.length) * 100 : 0,
        avgPnl: inBucket.length > 0 ? total / inBucket.length : 0,
        totalPnl: total,
      };
    });

    // Sweet spot: highest avg P&L with ≥5 trades
    const eligible = buckets.filter((b) => b.count >= 5);
    const sweetSpot = eligible.length
      ? eligible.reduce((a, b) => (b.avgPnl > a.avgPnl ? b : a))
      : null;

    // "Cutting winners" insight
    const winningPoints = points.filter((p) => p.pnl > 0);
    let cutWinnersInsight: string | null = null;

    if (winningPoints.length >= 4) {
      const sorted = [...winningPoints].sort(
        (a, b) => a.holdMin - b.holdMin,
      );
      const medianHold =
        sorted[Math.floor(sorted.length / 2)].holdMin;

      const shortWins = winningPoints.filter(
        (p) => p.holdMin <= medianHold,
      );
      const longWins = winningPoints.filter(
        (p) => p.holdMin > medianHold,
      );

      const avgShort =
        shortWins.length > 0
          ? shortWins.reduce((s, p) => s + p.pnl, 0) / shortWins.length
          : 0;
      const avgLong =
        longWins.length > 0
          ? longWins.reduce((s, p) => s + p.pnl, 0) / longWins.length
          : 0;

      if (avgLong > avgShort && longWins.length > 0) {
        const diff = avgLong - avgShort;
        cutWinnersInsight = `You tend to cut winners at ${fmtHoldTime(medianHold)} — your wins held past ${fmtHoldTime(medianHold)} averaged ${fmtDollar(diff)} more`;
      }
    }

    return { points, buckets, sweetSpot, insights: { cutWinnersInsight } };
  }, [trades]);

  /* ── empty states ─────────────────────────────────────────── */

  if (trades.length === 0) {
    return (
      <div className="card-panel p-5 text-center text-sm text-gray-500">
        No trades to analyze.
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="card-panel p-5 text-center text-sm text-gray-500">
        No trades with valid entry &amp; exit times.
      </div>
    );
  }

  /* ── SVG scatter plot layout ──────────────────────────────── */

  const W = 600;
  const H = 340;
  const PAD = { t: 15, r: 20, b: 35, l: 55 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const maxHold = Math.max(...points.map((p) => p.holdMin));
  const minPnl = Math.min(0, ...points.map((p) => p.pnl));
  const maxPnl = Math.max(0, ...points.map((p) => p.pnl));
  const pnlRange = maxPnl - minPnl || 1;
  const maxPos = Math.max(...points.map((p) => p.positionSize));
  const minPos = Math.min(...points.map((p) => p.positionSize));
  const posRange = maxPos - minPos || 1;

  const toX = (hold: number) => PAD.l + (hold / maxHold) * cW;
  const toY = (pnl: number) =>
    PAD.t + cH - ((pnl - minPnl) / pnlRange) * cH;
  const toR = (pos: number) =>
    3 + ((pos - minPos) / posRange) * 7;

  const zeroY = toY(0);

  // Axis ticks
  const xStep = niceStep(maxHold, 5);
  const xTicks: number[] = [];
  for (let v = 0; v <= maxHold + xStep * 0.01; v += xStep)
    xTicks.push(v);

  const yStep = niceStep(pnlRange, 4);
  const yStart = Math.floor(minPnl / yStep) * yStep;
  const yTicks: number[] = [];
  for (let v = yStart; v <= maxPnl + yStep * 0.01; v += yStep)
    yTicks.push(v);

  function handleDotEnter(point: TradePoint, e: React.PointerEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltip({ point, x, y, flipX: x > rect.width * 0.6 });
  }

  return (
    <div className="space-y-4">
      {/* ── Scatter plot ──────────────────────────────────────── */}
      <div className="card-panel p-5">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Hold Time vs P&L
        </h3>

        <div ref={containerRef} className="relative">
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            className="overflow-visible"
          >
            {/* zero line */}
            <line
              x1={PAD.l}
              y1={zeroY}
              x2={W - PAD.r}
              y2={zeroY}
              stroke="rgba(107,114,128,0.2)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />

            {/* X axis */}
            <line
              x1={PAD.l}
              y1={H - PAD.b}
              x2={W - PAD.r}
              y2={H - PAD.b}
              stroke="rgba(107,114,128,0.3)"
              strokeWidth="1"
            />

            {/* Y axis */}
            <line
              x1={PAD.l}
              y1={PAD.t}
              x2={PAD.l}
              y2={H - PAD.b}
              stroke="rgba(107,114,128,0.3)"
              strokeWidth="1"
            />

            {/* X ticks */}
            {xTicks.map((v) => (
              <g key={`x${v}`}>
                <line
                  x1={toX(v)}
                  y1={H - PAD.b}
                  x2={toX(v)}
                  y2={H - PAD.b + 4}
                  stroke="rgba(107,114,128,0.3)"
                  strokeWidth="1"
                />
                <text
                  x={toX(v)}
                  y={H - PAD.b + 16}
                  fill="#6b7280"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  {v >= 60 ? `${(v / 60).toFixed(0)}h` : `${Math.round(v)}m`}
                </text>
              </g>
            ))}

            {/* Y ticks */}
            {yTicks.map((v) => (
              <g key={`y${v}`}>
                <line
                  x1={PAD.l - 4}
                  y1={toY(v)}
                  x2={PAD.l}
                  y2={toY(v)}
                  stroke="rgba(107,114,128,0.3)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.l - 7}
                  y={toY(v) + 3}
                  fill="#6b7280"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="Inter, sans-serif"
                >
                  {fmtAxisDollar(v)}
                </text>
              </g>
            ))}

            {/* dots — render losses first so wins layer on top */}
            {points
              .slice()
              .sort((a, b) => a.pnl - b.pnl)
              .map((p, i) => {
                const win = p.pnl > 0;
                return (
                  <circle
                    key={i}
                    cx={toX(p.holdMin)}
                    cy={toY(p.pnl)}
                    r={toR(p.positionSize)}
                    fill={win ? "#00C853" : "#ef4444"}
                    fillOpacity={0.55}
                    stroke={win ? "#00C853" : "#ef4444"}
                    strokeWidth="1"
                    strokeOpacity={0.8}
                    className="cursor-pointer"
                    style={{ transition: "r 0.15s" }}
                    onPointerEnter={(e) => handleDotEnter(p, e)}
                    onPointerLeave={() => setTooltip(null)}
                  />
                );
              })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none rounded-lg border border-gray-700 bg-gray-900/95 px-3 py-2.5 shadow-xl backdrop-blur-sm"
              style={{
                left: tooltip.flipX
                  ? tooltip.x - 12
                  : tooltip.x + 12,
                top: tooltip.y - 8,
                transform: tooltip.flipX
                  ? "translate(-100%, -100%)"
                  : "translateY(-100%)",
              }}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold font-display text-white">
                  {tooltip.point.trade.ticker}
                </span>
                <span className="text-[10px] text-gray-500">
                  {tooltip.point.trade.trade_date}
                </span>
              </div>
              <div className="mt-1 space-y-0.5 text-[11px]">
                <p className="text-gray-400">
                  Hold:{" "}
                  <span className="text-gray-200">
                    {fmtHoldTime(tooltip.point.holdMin)}
                  </span>
                </p>
                <p className="text-gray-400">
                  P&L:{" "}
                  <span
                    className={
                      tooltip.point.pnl >= 0
                        ? "text-accent-400"
                        : "text-red-400"
                    }
                  >
                    {fmtDollar(tooltip.point.pnl)}
                  </span>
                </p>
                {tooltip.point.trade.setup && (
                  <p className="text-gray-400">
                    Setup:{" "}
                    <span className="text-gray-200">
                      {tooltip.point.trade.setup}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bucketed stats ────────────────────────────────────── */}
      <div className="card-panel p-5">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Hold Time Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="trade-table w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-800">
                {["Duration", "Trades", "Win Rate", "Avg P&L", "Total P&L"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`text-[10px] text-gray-500 uppercase font-semibold tracking-wider pb-2 ${
                        i > 0 ? "text-right" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {buckets.map((b) => {
                const isSweetSpot =
                  sweetSpot !== null && b.label === sweetSpot.label;
                return (
                  <tr
                    key={b.label}
                    className={`border-b border-gray-800/50 ${
                      isSweetSpot ? "bg-accent-500/5" : ""
                    }`}
                  >
                    <td className="py-2.5 text-xs text-gray-300">
                      {b.label}
                      {isSweetSpot && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20">
                          Sweet Spot
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-xs text-gray-400 text-right">
                      {b.count}
                    </td>
                    <td
                      className={`py-2.5 text-xs text-right font-medium ${
                        b.count === 0
                          ? "text-gray-600"
                          : b.winRate >= 50
                            ? "text-accent-400"
                            : "text-red-400"
                      }`}
                    >
                      {b.count > 0 ? `${b.winRate.toFixed(0)}%` : "—"}
                    </td>
                    <td
                      className={`py-2.5 text-xs text-right font-medium ${
                        b.count === 0
                          ? "text-gray-600"
                          : b.avgPnl > 0
                            ? "text-accent-400"
                            : "text-red-400"
                      }`}
                    >
                      {b.count > 0 ? fmtDollar(b.avgPnl) : "—"}
                    </td>
                    <td
                      className={`py-2.5 text-xs text-right font-medium ${
                        b.count === 0
                          ? "text-gray-600"
                          : b.totalPnl > 0
                            ? "text-accent-400"
                            : "text-red-400"
                      }`}
                    >
                      {b.count > 0 ? fmtDollar(b.totalPnl) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Auto-insights ─────────────────────────────────────── */}
      <div className="card-panel p-5">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Hold Time Insights
        </h3>

        <div className="space-y-2.5">
          {sweetSpot && (
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider shrink-0 text-accent-400">
                Optimal hold
              </span>
              <span className="text-xs text-gray-400">
                Your optimal hold time is{" "}
                <span className="text-gray-200 font-medium">
                  {sweetSpot.label}
                </span>{" "}
                ({fmtDollar(sweetSpot.avgPnl)} avg P&L, {sweetSpot.count}{" "}
                trades)
              </span>
            </div>
          )}

          {insights.cutWinnersInsight && (
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider shrink-0 text-amber-400">
                Cutting winners
              </span>
              <span className="text-xs text-gray-400">
                {insights.cutWinnersInsight}
              </span>
            </div>
          )}

          {!sweetSpot && !insights.cutWinnersInsight && (
            <p className="text-xs text-gray-500">
              Not enough data yet. Need at least 5 trades in a single
              hold-time bucket to generate insights.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
