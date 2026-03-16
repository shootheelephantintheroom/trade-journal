import type { Trade } from "../types/trade";

export function calcPnl(t: Pick<Trade, "side" | "entry_price" | "exit_price" | "shares">): number {
  const mult = t.side === "long" ? 1 : -1;
  return mult * (t.exit_price - t.entry_price) * t.shares;
}

export function calcRR(t: Pick<Trade, "side" | "entry_price" | "exit_price" | "stop_loss_price">): number | null {
  if (!t.stop_loss_price) return null;
  const risk = Math.abs(t.entry_price - t.stop_loss_price);
  if (risk === 0) return null;
  const reward = t.side === "long"
    ? t.exit_price - t.entry_price
    : t.entry_price - t.exit_price;
  return reward / risk;
}

export function calcMaxRisk(t: Pick<Trade, "entry_price" | "stop_loss_price" | "shares">): number | null {
  if (!t.stop_loss_price) return null;
  return Math.abs(t.entry_price - t.stop_loss_price) * t.shares;
}

export function calcNetPnl(t: Pick<Trade, "side" | "entry_price" | "exit_price" | "shares"> & { commission?: number }): number {
  return calcPnl(t) - (t.commission || 0);
}

export function calcStreak(trades: Trade[]): { type: "win" | "loss" | "none"; count: number } {
  if (trades.length === 0) return { type: "none", count: 0 };

  const pnls = trades.map((t) => calcPnl(t));
  const firstNonZero = pnls.findIndex((p) => p !== 0);
  if (firstNonZero === -1) return { type: "none", count: 0 };

  const type = pnls[firstNonZero] > 0 ? "win" : "loss";
  let count = 0;

  for (let i = firstNonZero; i < pnls.length; i++) {
    if ((type === "win" && pnls[i] > 0) || (type === "loss" && pnls[i] < 0)) {
      count++;
    } else {
      break;
    }
  }

  return { type, count };
}
