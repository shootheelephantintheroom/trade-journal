import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Trade } from "../../types/trade";
import { calcNetPnl } from "../../lib/calc";

interface Props {
  trades: Trade[];
  dateRangeLabel?: string;
}

interface TiltEpisode {
  date: string;
  losingStreak: Trade[];
  postTiltTrades: Trade[];
  streakPnls: number[];
  postPnls: number[];
  postSizeIncrease: number | null; // percentage
  impulseEntry: boolean;
  impulseEntryGapMin: number | null; // minutes between last streak exit and first post-tilt entry
  deviatedSetup: boolean;
}

/* ── thresholds (eyeball these) ─────────────────────────────── */

const DEFAULT_TILT_THRESHOLD = 2;              // consecutive losses to trigger an episode (slider still 2–4)
const MIN_POST_TILT_SAMPLE = 10;               // post-tilt trades needed before firing the aggregate verdict
const REVENGE_SIZE_THRESHOLD_PCT = 15;         // per-episode: post-streak avg size > streak avg by this % → flagged (onset, not late-stage)
const IMPULSE_ENTRY_THRESHOLD_MIN = 2;         // per-episode: re-entry within this many minutes of last stop-out → flagged
const DISCIPLINED_SIZE_THRESHOLD_PCT = 15;     // aggregate: avg size increase across episodes must stay below this for "disciplined"
const DISCIPLINED_PNL_RATIO = 0.8;             // aggregate: post-tilt avg P/L must be ≥ this × normal avg P/L
const DISCIPLINED_WIN_RATE_RATIO = 0.8;        // aggregate: post-tilt win rate must be ≥ this × normal win rate

/* ── helpers ────────────────────────────────────────────────── */

function parseMinutes(time: string): number | null {
  if (!time) return null;
  const m = time.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (m[3] ? parseInt(m[3], 10) / 60 : 0);
}

function fmtDollar(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : v > 0 ? "+" : "";
  if (abs >= 10_000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtImpulseGap(gapMin: number): string {
  const safe = Math.max(0, gapMin);
  if (safe < 1) return `${Math.round(safe * 60)}s`;
  return `${safe.toFixed(1)} min`;
}

function buildTiltExplainer(ep: TiltEpisode, threshold: number): string {
  const parts: string[] = [
    `${ep.losingStreak.length} consecutive losses (threshold: ${threshold})`,
  ];

  if (ep.impulseEntry && ep.impulseEntryGapMin !== null) {
    parts.push(
      `re-entered ${fmtImpulseGap(ep.impulseEntryGapMin)} after last stop-out (threshold: <${IMPULSE_ENTRY_THRESHOLD_MIN} min)`,
    );
  }

  if (ep.postSizeIncrease !== null && ep.postSizeIncrease > REVENGE_SIZE_THRESHOLD_PCT) {
    parts.push(
      `post-streak sizing was +${ep.postSizeIncrease.toFixed(0)}% vs streak avg (threshold: +${REVENGE_SIZE_THRESHOLD_PCT}%)`,
    );
  }

  if (ep.deviatedSetup) {
    parts.push(`traded outside your top 3 setups`);
  }

  if (parts.length === 1) {
    parts.push(`no behavioral red flags — may be variance, not tilt`);
  }

  return parts.join(" → ");
}

/* ── component ──────────────────────────────────────────────── */

export default function TiltDetection({ trades, dateRangeLabel = "this period" }: Props) {
  const [threshold, setThreshold] = useState(DEFAULT_TILT_THRESHOLD);
  const [showThresholdControl, setShowThresholdControl] = useState(false);

  const analysis = useMemo(() => {
    if (trades.length === 0) return null;

    // Most common setups (top 3)
    const setupCounts = new Map<string, number>();
    for (const t of trades) {
      if (t.setup) {
        setupCounts.set(t.setup, (setupCounts.get(t.setup) || 0) + 1);
      }
    }
    const topSetups = new Set(
      [...setupCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([s]) => s),
    );

    // Group trades by date, sorted chronologically within each day
    const byDate = new Map<string, Trade[]>();
    for (const t of trades) {
      const arr = byDate.get(t.trade_date) || [];
      arr.push(t);
      byDate.set(t.trade_date, arr);
    }

    for (const arr of byDate.values()) {
      arr.sort((a, b) => {
        const am = parseMinutes(a.entry_time);
        const bm = parseMinutes(b.entry_time);
        return (am ?? 0) - (bm ?? 0);
      });
    }

    // Detect tilt episodes
    const episodes: TiltEpisode[] = [];

    for (const [date, dayTrades] of byDate) {
      let i = 0;
      while (i < dayTrades.length) {
        // Look for N consecutive losses
        const streakStart = i;
        let consecutiveLosses = 0;

        while (i < dayTrades.length && calcNetPnl(dayTrades[i]) < 0) {
          consecutiveLosses++;
          i++;
        }

        if (consecutiveLosses >= threshold && i < dayTrades.length) {
          // We have a tilt trigger — remaining trades that day are post-tilt
          const losingStreak = dayTrades.slice(streakStart, i);
          const postTiltTrades = dayTrades.slice(i);

          const streakPnls = losingStreak.map((t) => calcNetPnl(t));
          const postPnls = postTiltTrades.map((t) => calcNetPnl(t));

          // Size increase check
          const avgStreakSize =
            losingStreak.reduce((s, t) => s + t.shares * t.entry_price, 0) /
            losingStreak.length;
          const avgPostSize =
            postTiltTrades.reduce((s, t) => s + t.shares * t.entry_price, 0) /
            postTiltTrades.length;
          const postSizeIncrease =
            avgStreakSize > 0
              ? ((avgPostSize - avgStreakSize) / avgStreakSize) * 100
              : null;

          // Impulse entry: next trade entered within IMPULSE_ENTRY_THRESHOLD_MIN of last loss exit
          const lastLoss = losingStreak[losingStreak.length - 1];
          const firstPost = postTiltTrades[0];
          const lastLossExit = parseMinutes(lastLoss.exit_time);
          const firstPostEntry = parseMinutes(firstPost.entry_time);
          const impulseEntryGapMin =
            lastLossExit !== null && firstPostEntry !== null
              ? firstPostEntry - lastLossExit
              : null;
          const impulseEntry =
            impulseEntryGapMin !== null &&
            impulseEntryGapMin < IMPULSE_ENTRY_THRESHOLD_MIN;

          // Setup deviation
          const deviatedSetup = postTiltTrades.some(
            (t) => t.setup && topSetups.size > 0 && !topSetups.has(t.setup),
          );

          episodes.push({
            date,
            losingStreak,
            postTiltTrades,
            streakPnls,
            postPnls,
            postSizeIncrease,
            impulseEntry,
            impulseEntryGapMin,
            deviatedSetup,
          });

          // Skip past this episode
          break;
        }

        // No tilt here, move to next trade
        if (consecutiveLosses < threshold) {
          i++;
        }
      }
    }

    // Aggregate stats
    const allPostTiltPnls = episodes.flatMap((e) => e.postPnls);
    const allPostTiltTrades = episodes.flatMap((e) => e.postTiltTrades);

    const postTiltAvgPnl =
      allPostTiltPnls.length > 0
        ? allPostTiltPnls.reduce((s, p) => s + p, 0) / allPostTiltPnls.length
        : 0;

    // Normal trades = all trades minus those in any episode
    const episodeTradeIds = new Set(
      episodes.flatMap((e) => [
        ...e.losingStreak.map((t) => t.id),
        ...e.postTiltTrades.map((t) => t.id),
      ]),
    );
    const normalTrades = trades.filter((t) => !episodeTradeIds.has(t.id));
    const normalPnls = normalTrades.map((t) => calcNetPnl(t));
    const normalAvgPnl =
      normalPnls.length > 0
        ? normalPnls.reduce((s, p) => s + p, 0) / normalPnls.length
        : 0;
    // Clean (uncontaminated) baseline win rate for comparison to post-tilt
    const normalWins = normalPnls.filter((p) => p > 0).length;
    const normalWinRate =
      normalPnls.length > 0 ? normalWins / normalPnls.length : 0;

    // Cost of tilt: total P&L of post-tilt trades that were losses
    const costOfTilt = allPostTiltPnls
      .filter((p) => p < 0)
      .reduce((s, p) => s + p, 0);

    // Average size increase
    const sizeIncreases = episodes
      .map((e) => e.postSizeIncrease)
      .filter((v): v is number => v !== null);
    const avgSizeIncrease =
      sizeIncreases.length > 0
        ? sizeIncreases.reduce((s, v) => s + v, 0) / sizeIncreases.length
        : 0;

    // Post-tilt win rate
    const postTiltWins = allPostTiltPnls.filter((p) => p > 0).length;
    const postTiltWinRate =
      allPostTiltPnls.length > 0
        ? postTiltWins / allPostTiltPnls.length
        : 0;

    // Enough post-tilt trades to trust the aggregate verdict?
    const hasEnoughSamples = allPostTiltTrades.length >= MIN_POST_TILT_SAMPLE;

    // Is the user disciplined post-loss? Compared to the clean (non-tilt) baseline.
    // normalWinRate === 0 guard: if user has no non-tilt winners, don't penalize on win-rate ratio.
    const isDisciplined =
      postTiltAvgPnl >= normalAvgPnl * DISCIPLINED_PNL_RATIO &&
      (normalWinRate === 0 ||
        postTiltWinRate >= normalWinRate * DISCIPLINED_WIN_RATE_RATIO) &&
      avgSizeIncrease < DISCIPLINED_SIZE_THRESHOLD_PCT;

    return {
      episodes,
      postTiltAvgPnl,
      normalAvgPnl,
      costOfTilt,
      avgSizeIncrease,
      postTiltWinRate,
      normalWinRate,
      isDisciplined,
      hasEnoughSamples,
      allPostTiltTrades,
    };
  }, [trades, threshold]);

  /* ── empty state ─────────────────────────────────────────── */

  if (trades.length === 0) {
    return (
      <p className="text-[13px] text-tertiary">
        No trades to analyze.
      </p>
    );
  }

  if (!analysis) return null;

  const {
    episodes,
    postTiltAvgPnl,
    normalAvgPnl,
    costOfTilt,
    avgSizeIncrease,
    postTiltWinRate,
    normalWinRate,
  } = analysis;

  const tiltEpisodes = episodes.length;
  const totalTrades = trades.length;
  const postTiltWinRatePct = Math.round(postTiltWinRate * 100);
  const normalWinRatePct = Math.round(normalWinRate * 100);
  const hasEpisodes = tiltEpisodes > 0;
  const hasPostTiltTrades = analysis.allPostTiltTrades.length > 0;

  /* ── Verdict hero copy ────────────────────────────────────── */
  let verdictHeadline: string;
  let verdictSub: ReactNode;
  let verdictTone: "clean" | "neutral" | "alert";

  if (!hasEpisodes && totalTrades >= 10) {
    verdictHeadline = "You don't tilt.";
    verdictSub = (
      <>
        0 tilt episodes in the last {dateRangeLabel}. Your post-loss discipline holds.
      </>
    );
    verdictTone = "clean";
  } else if (!hasEpisodes && totalTrades < 10) {
    verdictHeadline = "Not enough data yet.";
    verdictSub = (
      <>
        Log at least 10 trades to detect tilt patterns. You have {totalTrades}.
      </>
    );
    verdictTone = "neutral";
  } else {
    verdictHeadline = `You're tilting after ${threshold} losses in a row.`;
    verdictSub = (
      <>
        {tiltEpisodes} episode{tiltEpisodes === 1 ? "" : "s"} this period cost you{" "}
        <span className="font-mono text-loss">{fmtDollar(costOfTilt)}</span>.{" "}
        Post-tilt win rate:{" "}
        <span className="font-mono text-loss">{postTiltWinRatePct}%</span> vs your normal{" "}
        <span className="font-mono">{normalWinRatePct}%</span>.
      </>
    );
    verdictTone = "alert";
  }

  /* ── Footer rule copy ─────────────────────────────────────── */
  let footerLabel: string;
  let footerBody: ReactNode;
  let footerTone: "clean" | "alert" | "watch";

  if (!hasEpisodes) {
    footerLabel = "Insight";
    footerBody = "Your post-loss trading is disciplined. No rule needed.";
    footerTone = "clean";
  } else if (postTiltWinRatePct < normalWinRatePct - 10) {
    footerLabel = "Suggested rule";
    footerBody = (
      <>
        After {threshold} losses, your win rate drops from{" "}
        <span className="font-mono">{normalWinRatePct}%</span> →{" "}
        <span className="font-mono text-loss">{postTiltWinRatePct}%</span>. Suggested
        rule: stop trading for 30 minutes after {threshold} consecutive losses.
      </>
    );
    footerTone = "alert";
  } else {
    footerLabel = "Insight";
    footerBody =
      "You take more trades after losses, but your win rate holds. Worth watching, not stopping.";
    footerTone = "watch";
  }

  return (
    <div className="space-y-8">
      {/* ── Verdict hero ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <h3
            className={cn(
              "text-2xl sm:text-3xl font-semibold tracking-tight",
              verdictTone === "clean" && "text-profit",
              verdictTone === "alert" && "text-loss",
              verdictTone === "neutral" && "text-primary",
            )}
          >
            {verdictHeadline}
          </h3>
          <p className="text-[13px] text-secondary leading-relaxed">
            {verdictSub}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowThresholdControl((v) => !v)}
          className="inline-flex items-center gap-1.5 self-start text-[11px] font-medium text-tertiary hover:text-secondary transition-colors shrink-0"
        >
          <Settings2 size={12} strokeWidth={1.75} />
          Adjust threshold
          <ChevronDown
            size={12}
            strokeWidth={1.75}
            className={cn(
              "transition-transform",
              showThresholdControl && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* ── Threshold drawer ─────────────────────────────────── */}
      {showThresholdControl && (
        <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-4 py-3 -mt-4">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={4}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-24 h-1 bg-surface-3 rounded-full appearance-none cursor-pointer accent-brand"
            />
            <span className="text-xs font-medium text-primary tabular-nums w-4 text-center">
              {threshold}
            </span>
          </div>
          <p className="text-[11px] text-tertiary mt-2">
            We flag a tilt episode when you take a trade within 30 minutes of {threshold}{" "}
            consecutive losses.
          </p>
        </div>
      )}

      {/* ── Summary stats ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border-t border-white/[0.04] pt-4">
          <p className="text-[13px] font-medium text-secondary mb-1.5">
            Tilt Episodes
          </p>
          <p className="text-xl font-medium text-primary tabular-nums">
            {tiltEpisodes}
          </p>
          {!hasEpisodes && (
            <p className="text-xs text-tertiary mt-1">
              No tilt patterns detected
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.04] pt-4">
          <p className="text-[13px] font-medium text-secondary mb-1.5">
            Post-Tilt Avg Profit / Loss
          </p>
          {hasPostTiltTrades ? (
            <>
              <p
                className={cn(
                  "text-xl font-medium font-mono tabular-nums",
                  postTiltAvgPnl >= 0 ? "text-profit" : "text-loss",
                )}
              >
                {fmtDollar(postTiltAvgPnl)}
              </p>
              <p className="text-xs text-tertiary mt-1">
                vs <span className="font-mono">{fmtDollar(normalAvgPnl)}</span> normal
              </p>
            </>
          ) : (
            <p className="text-[13px] text-tertiary leading-relaxed">
              Not enough post-tilt trades
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.04] pt-4">
          <p className="text-[13px] font-medium text-secondary mb-1.5">
            Cost of Tilt
          </p>
          {hasEpisodes && costOfTilt < 0 ? (
            <>
              <p className="text-xl font-medium font-mono tabular-nums text-loss">
                {fmtDollar(costOfTilt)}
              </p>
              <p className="text-xs text-tertiary mt-1">
                post-tilt losing trades
              </p>
            </>
          ) : (
            <p className="text-[13px] text-tertiary leading-relaxed">
              Nothing to measure
            </p>
          )}
        </div>

        <div className="border-t border-white/[0.04] pt-4">
          <p className="text-[13px] font-medium text-secondary mb-1.5">
            Avg Size Increase
          </p>
          {hasEpisodes ? (
            <>
              <p
                className={cn(
                  "text-xl font-medium font-mono tabular-nums",
                  avgSizeIncrease > REVENGE_SIZE_THRESHOLD_PCT
                    ? "text-amber"
                    : "text-primary",
                )}
              >
                {`${avgSizeIncrease >= 0 ? "+" : ""}${avgSizeIncrease.toFixed(0)}%`}
              </p>
              <p className="text-xs text-tertiary mt-1">
                post-tilt position sizing
              </p>
            </>
          ) : (
            <p className="text-[13px] text-tertiary leading-relaxed">
              Sizing held steady
            </p>
          )}
        </div>
      </div>

      {/* ── Footer rule / insight ────────────────────────────── */}
      <div
        className={cn(
          "rounded-md border-l-2 border border-white/[0.04] bg-white/[0.02] px-4 py-3",
          footerTone === "clean" && "border-l-brand",
          footerTone === "alert" && "border-l-loss",
          footerTone === "watch" && "border-l-amber",
        )}
      >
        <p
          className={cn(
            "text-[10px] font-medium uppercase tracking-wider mb-1",
            footerTone === "clean" && "text-brand",
            footerTone === "alert" && "text-loss",
            footerTone === "watch" && "text-amber",
          )}
        >
          {footerLabel}
        </p>
        <p className="text-[13px] text-secondary leading-relaxed">
          {footerBody}
        </p>
      </div>

      {/* ── Episode timeline ───────────────────────────────────── */}
      {episodes.length > 0 && (
        <div className="border-t border-white/[0.04] pt-4">
          <h3 className="text-[13px] font-medium text-secondary mb-4">
            Tilt Episodes ({episodes.length})
          </h3>

          <div className="space-y-4">
            {episodes.map((ep, idx) => (
              <div
                key={ep.date + idx}
                className="border-t border-white/[0.04] pt-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">
                      {ep.date}
                    </span>
                    <span className="text-[10px] text-tertiary">
                      {ep.losingStreak.length} losses → {ep.postTiltTrades.length} post-tilt trade{ep.postTiltTrades.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {ep.impulseEntry && (
                      <span className="text-[11px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded px-1.5 py-0.5">
                        Impulse
                      </span>
                    )}
                    {ep.deviatedSetup && (
                      <span className="text-[11px] font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded px-1.5 py-0.5">
                        Off-plan
                      </span>
                    )}
                    {ep.postSizeIncrease !== null && ep.postSizeIncrease > REVENGE_SIZE_THRESHOLD_PCT && (
                      <span className="text-[11px] font-medium bg-amber-muted text-amber border border-amber/30 rounded px-1.5 py-0.5">
                        +{ep.postSizeIncrease.toFixed(0)}% size
                      </span>
                    )}
                  </div>
                </div>

                {/* Why flagged — actual numbers + thresholds inline */}
                <p className="text-[11px] text-tertiary mb-2 leading-relaxed">
                  <span className="font-medium text-secondary">Why flagged: </span>
                  {buildTiltExplainer(ep, threshold)}
                </p>

                {/* Trade sequence */}
                <div className="space-y-0">
                  {/* Losing streak trades */}
                  {ep.losingStreak.map((t, ti) => {
                    const pnl = ep.streakPnls[ti];
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 py-1.5 border-b border-border hover:bg-surface-2 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-loss shrink-0" />
                        <span className="text-xs font-medium text-secondary w-14 shrink-0">
                          {t.ticker}
                        </span>
                        <span className="text-[10px] text-tertiary w-16 shrink-0">
                          {t.entry_time?.slice(0, 5)}–{t.exit_time?.slice(0, 5)}
                        </span>
                        {t.setup && (
                          <span className="text-[10px] text-tertiary truncate max-w-[100px]">
                            {t.setup}
                          </span>
                        )}
                        <span className="ml-auto text-xs font-medium font-mono text-loss">
                          {fmtDollar(pnl)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Divider */}
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="flex-1 border-t border-amber/30" />
                    <span className="text-[11px] font-medium text-amber/60">
                      Post-tilt
                    </span>
                    <div className="flex-1 border-t border-amber/30" />
                  </div>

                  {/* Post-tilt trades */}
                  {ep.postTiltTrades.map((t, ti) => {
                    const pnl = ep.postPnls[ti];
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 py-1.5 border-b border-border bg-amber-muted -mx-4 px-4 hover:bg-surface-2 transition-colors"
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            pnl >= 0 ? "bg-brand" : "bg-amber",
                          )}
                        />
                        <span className="text-xs font-medium text-secondary w-14 shrink-0">
                          {t.ticker}
                        </span>
                        <span className="text-[10px] text-tertiary w-16 shrink-0">
                          {t.entry_time?.slice(0, 5)}–{t.exit_time?.slice(0, 5)}
                        </span>
                        {t.setup && (
                          <span className="text-[10px] text-tertiary truncate max-w-[100px]">
                            {t.setup}
                          </span>
                        )}
                        <span
                          className={cn(
                            "ml-auto text-xs font-medium font-mono",
                            pnl >= 0 ? "text-profit" : "text-amber",
                          )}
                        >
                          {fmtDollar(pnl)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Episode summary */}
                <div className="flex gap-4 mt-3 pt-2 border-t border-border">
                  <span className="text-[10px] text-tertiary">
                    Streak Profit / Loss:{" "}
                    <span className="text-loss font-medium font-mono">
                      {fmtDollar(ep.streakPnls.reduce((s, p) => s + p, 0))}
                    </span>
                  </span>
                  <span className="text-[10px] text-tertiary">
                    Post-tilt Profit / Loss:{" "}
                    <span
                      className={cn(
                        "font-medium font-mono",
                        ep.postPnls.reduce((s, p) => s + p, 0) >= 0
                          ? "text-profit"
                          : "text-amber",
                      )}
                    >
                      {fmtDollar(ep.postPnls.reduce((s, p) => s + p, 0))}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
