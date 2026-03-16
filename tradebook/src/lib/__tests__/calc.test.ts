import { describe, it, expect } from "vitest";
import { calcPnl, calcRR, calcMaxRisk, calcStreak } from "../calc";
import type { Trade } from "../../types/trade";

// Helper to build a minimal trade object
function makeTrade(overrides: Partial<Trade>): Trade {
  return {
    id: "1",
    ticker: "AAPL",
    side: "long",
    entry_price: 100,
    exit_price: 110,
    shares: 10,
    trade_date: "2026-01-01",
    entry_time: "09:30",
    exit_time: "10:00",
    setup: "",
    notes: "",
    emotions: "",
    stop_loss_price: null,
    tags: [],
    grade: "",
    premarket_plan: "",
    screenshot_url: null,
    catalyst: "",
    catalyst_type: null,
    float_shares: null,
    market_cap: null,
    rvol: null,
    commission: 0,
    is_scaled: false,
    avg_entry_price: null,
    avg_exit_price: null,
    total_shares: null,
    created_at: "",
    ...overrides,
  };
}

describe("calcPnl", () => {
  it("calculates profit on a long trade", () => {
    expect(calcPnl({ side: "long", entry_price: 100, exit_price: 110, shares: 10 })).toBe(100);
  });

  it("calculates loss on a long trade", () => {
    expect(calcPnl({ side: "long", entry_price: 100, exit_price: 90, shares: 10 })).toBe(-100);
  });

  it("calculates profit on a short trade", () => {
    expect(calcPnl({ side: "short", entry_price: 100, exit_price: 90, shares: 10 })).toBe(100);
  });

  it("calculates loss on a short trade", () => {
    expect(calcPnl({ side: "short", entry_price: 100, exit_price: 110, shares: 10 })).toBe(-100);
  });
});

describe("calcRR", () => {
  it("calculates R:R with stop loss (long)", () => {
    const rr = calcRR({ side: "long", entry_price: 100, exit_price: 110, stop_loss_price: 95 });
    expect(rr).toBe(2); // reward 10 / risk 5
  });

  it("calculates R:R with stop loss (short)", () => {
    const rr = calcRR({ side: "short", entry_price: 100, exit_price: 90, stop_loss_price: 105 });
    expect(rr).toBe(2); // reward 10 / risk 5
  });

  it("returns null without stop loss", () => {
    expect(calcRR({ side: "long", entry_price: 100, exit_price: 110, stop_loss_price: null })).toBeNull();
  });

  it("returns null when risk is zero", () => {
    expect(calcRR({ side: "long", entry_price: 100, exit_price: 110, stop_loss_price: 100 })).toBeNull();
  });
});

describe("calcMaxRisk", () => {
  it("calculates max risk in dollars", () => {
    expect(calcMaxRisk({ entry_price: 100, stop_loss_price: 95, shares: 20 })).toBe(100);
  });

  it("returns null when stop loss is null", () => {
    expect(calcMaxRisk({ entry_price: 100, stop_loss_price: null, shares: 20 })).toBeNull();
  });
});

describe("calcStreak", () => {
  it("detects a win streak", () => {
    const trades = [
      makeTrade({ entry_price: 100, exit_price: 110, shares: 1 }),
      makeTrade({ entry_price: 100, exit_price: 120, shares: 1 }),
      makeTrade({ entry_price: 100, exit_price: 105, shares: 1 }),
    ];
    expect(calcStreak(trades)).toEqual({ type: "win", count: 3 });
  });

  it("detects a loss streak", () => {
    const trades = [
      makeTrade({ entry_price: 100, exit_price: 90, shares: 1 }),
      makeTrade({ entry_price: 100, exit_price: 80, shares: 1 }),
    ];
    expect(calcStreak(trades)).toEqual({ type: "loss", count: 2 });
  });

  it("returns none for empty trades", () => {
    expect(calcStreak([])).toEqual({ type: "none", count: 0 });
  });

  it("stops streak on direction change", () => {
    const trades = [
      makeTrade({ entry_price: 100, exit_price: 110, shares: 1 }),
      makeTrade({ entry_price: 100, exit_price: 110, shares: 1 }),
      makeTrade({ entry_price: 100, exit_price: 90, shares: 1 }), // loss breaks streak
    ];
    expect(calcStreak(trades)).toEqual({ type: "win", count: 2 });
  });
});
