import type { Trade } from "../../types/trade";
import { calcPnl, calcRR } from "../../lib/calc";

export interface DayStats {
  date: string;
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
}

export function buildDailyStats(trades: Trade[]): DayStats[] {
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

export interface TagStats {
  tag: string;
  totalTrades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  avgRR: number | null;
}

export function buildTagStats(trades: Trade[]): TagStats[] {
  const byTag = new Map<string, Trade[]>();
  for (const t of trades) {
    for (const tag of t.tags || []) {
      const existing = byTag.get(tag) || [];
      existing.push(t);
      byTag.set(tag, existing);
    }
  }

  const stats: TagStats[] = [];
  for (const [tag, tagTrades] of byTag) {
    const pnls = tagTrades.map(calcPnl);
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const wins = pnls.filter((p) => p > 0).length;
    const rrValues = tagTrades.map(calcRR).filter((r): r is number => r !== null);
    stats.push({
      tag,
      totalTrades: tagTrades.length,
      winRate: (wins / tagTrades.length) * 100,
      avgPnl: totalPnl / tagTrades.length,
      totalPnl,
      avgRR: rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : null,
    });
  }

  stats.sort((a, b) => b.totalTrades - a.totalTrades);
  return stats;
}

export interface EmotionStats {
  emotion: string;
  totalTrades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

export function buildEmotionStats(trades: Trade[]): EmotionStats[] {
  const byEmotion = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!t.emotions) continue;
    const emotions = t.emotions.split(",").map((e) => e.trim()).filter(Boolean);
    for (const emotion of emotions) {
      const existing = byEmotion.get(emotion) || [];
      existing.push(t);
      byEmotion.set(emotion, existing);
    }
  }

  const stats: EmotionStats[] = [];
  for (const [emotion, emotionTrades] of byEmotion) {
    const pnls = emotionTrades.map(calcPnl);
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const wins = pnls.filter((p) => p > 0).length;
    stats.push({
      emotion,
      totalTrades: emotionTrades.length,
      winRate: (wins / emotionTrades.length) * 100,
      avgPnl: totalPnl / emotionTrades.length,
      totalPnl,
    });
  }

  stats.sort((a, b) => b.totalTrades - a.totalTrades);
  return stats;
}

export interface DrawdownInfo {
  maxDrawdown: number;
  maxDrawdownPct: number;
  currentDrawdown: number;
  maxDdPeakIdx: number;
  maxDdTroughIdx: number;
}

export function calcDrawdownInfo(
  equityPoints: { value: number }[],
): DrawdownInfo {
  let peak = 0;
  let maxDd = 0;
  let maxDdPct = 0;
  let maxDdPeakIdx = 0;
  let maxDdTroughIdx = 0;
  let currentPeakIdx = 0;

  for (let i = 0; i < equityPoints.length; i++) {
    const val = equityPoints[i].value;
    if (val >= peak) {
      peak = val;
      currentPeakIdx = i;
    }
    const dd = peak - val;
    if (dd > maxDd) {
      maxDd = dd;
      maxDdPct = peak > 0 ? (dd / peak) * 100 : 0;
      maxDdPeakIdx = currentPeakIdx;
      maxDdTroughIdx = i;
    }
  }

  const lastVal =
    equityPoints.length > 0
      ? equityPoints[equityPoints.length - 1].value
      : 0;

  return {
    maxDrawdown: maxDd,
    maxDrawdownPct: maxDdPct,
    currentDrawdown: Math.max(0, peak - lastVal),
    maxDdPeakIdx,
    maxDdTroughIdx,
  };
}
