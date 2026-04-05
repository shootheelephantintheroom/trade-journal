import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const USER_ID = process.argv[2];
if (!USER_ID) {
  console.error("Usage: npx tsx scripts/seed-demo-trades.ts <user_id>");
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.seed");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (match) env[match[1]] = match[2];
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.seed");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function formatTime(h: number, m: number): string {
  return `${pad2(h)}:${pad2(m)}:00`;
}

// Skip weekends
function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
// Small caps & momentum names — the bread and butter
const SMALL_CAPS = [
  "LUNR", "SMCI", "MARA", "RIVN", "SOFI", "IONQ", "SOUN", "RKLB",
  "AFRM", "LCID", "PLUG", "BITF", "CIFR", "HUT", "NIO", "FFIE",
  "MULN", "ATER", "GSAT", "DNA",
];

// Bigger names that show up in a real trader's log
const BIG_NAMES = ["SPY", "QQQ", "TSLA", "NVDA", "AMD", "META"];

// Crypto-adjacent tickers
const CRYPTO_TICKERS = ["MARA", "RIOT", "BITF", "CIFR", "HUT", "COIN", "MSTR"];

// Combined pool with realistic weighting (small caps most common)
const TICKERS = [...SMALL_CAPS, ...SMALL_CAPS, ...BIG_NAMES, ...CRYPTO_TICKERS];

const SETUPS = [
  "VWAP reclaim", "opening range breakout", "dip buy",
  "red-to-green", "gap and go", "ABCD pattern",
  "break of premarket high", "pullback to 9 EMA",
];

const EMOTIONS = [
  "confident", "nervous", "fomo", "disciplined",
  "frustrated", "patient", "revenge trading", "calm",
];

const GRADES = ["A", "B", "C", "D"];
const GRADE_WEIGHTS = [0.15, 0.35, 0.35, 0.15];

const TAGS_POOL = ["momentum", "scalp", "swing", "news", "earnings", "technical", "high-volume"];

const CATALYST_TYPES = ["earnings", "news_pr", "technical", "short_squeeze", "sympathy"] as const;

const HESITATION_REASONS = [
  "Didn't trust the setup",
  "Was already in a trade",
  "Chasing felt too risky",
  "Waited for a better entry",
  "Account was at daily loss limit",
  "Got distracted",
];

const JOURNAL_MOODS = ["great", "good", "neutral", "frustrated", "tilted"] as const;
const MOOD_WEIGHTS = [0.15, 0.35, 0.25, 0.20, 0.05];
const JOURNAL_GRADES = ["A", "B", "C", "D"] as const;
const JOURNAL_GRADE_WEIGHTS = [0.10, 0.40, 0.40, 0.10];

// ---------------------------------------------------------------------------
// Generate trading days (last ~18 calendar days ≈ 2.5 weeks of weekdays)
// ---------------------------------------------------------------------------
const today = new Date();
const tradingDays: string[] = [];
for (let i = 18; i >= 1; i--) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  if (isWeekday(d)) tradingDays.push(formatDate(d));
}

// ---------------------------------------------------------------------------
// Generate trades
// ---------------------------------------------------------------------------
interface TradeRow {
  user_id: string;
  ticker: string;
  side: "long" | "short";
  entry_price: number;
  exit_price: number;
  shares: number;
  trade_date: string;
  entry_time: string;
  exit_time: string;
  setup: string;
  notes: string;
  emotions: string;
  stop_loss_price: number | null;
  tags: string[];
  grade: string;
  premarket_plan: string;
  screenshot_url: null;
  catalyst: string;
  catalyst_type: string | null;
  float_shares: number | null;
  market_cap: number | null;
  rvol: number | null;
  commission: number;
  is_scaled: boolean;
  avg_entry_price: number | null;
  avg_exit_price: number | null;
  total_shares: number | null;
}

function generateTrades(): TradeRow[] {
  const totalTrades = randInt(45, 55);
  const trades: TradeRow[] = [];

  // --- Day distribution ---
  // Most days: 2-4 trades. Pick 2-3 "overtrading" days with 6-8 trades.
  const overtradeCount = randInt(2, 3);
  const overtradeDayIdxs = new Set<number>();
  while (overtradeDayIdxs.size < overtradeCount) {
    overtradeDayIdxs.add(randInt(0, tradingDays.length - 1));
  }

  const tradesPerDay: number[] = tradingDays.map((_, idx) => {
    if (overtradeDayIdxs.has(idx)) return randInt(6, 8);
    return randInt(2, 4);
  });

  // Adjust total to target range
  let currentTotal = tradesPerDay.reduce((a, b) => a + b, 0);
  while (currentTotal > totalTrades + 3) {
    const idx = randInt(0, tradesPerDay.length - 1);
    if (!overtradeDayIdxs.has(idx) && tradesPerDay[idx] > 1) {
      tradesPerDay[idx]--;
      currentTotal--;
    }
  }
  while (currentTotal < totalTrades - 3) {
    const idx = randInt(0, tradesPerDay.length - 1);
    if (!overtradeDayIdxs.has(idx) && tradesPerDay[idx] < 5) {
      tradesPerDay[idx]++;
      currentTotal++;
    }
  }

  // Give a couple days 0 trades (days off)
  const daysOff = randInt(1, 2);
  for (let i = 0; i < daysOff; i++) {
    let idx: number;
    do { idx = randInt(0, tradesPerDay.length - 1); } while (overtradeDayIdxs.has(idx));
    tradesPerDay[idx] = 0;
  }

  for (let dayIdx = 0; dayIdx < tradingDays.length; dayIdx++) {
    const tradeDate = tradingDays[dayIdx];
    const count = tradesPerDay[dayIdx];
    if (count === 0) continue;

    const isOvertradeDay = overtradeDayIdxs.has(dayIdx);

    for (let t = 0; t < count; t++) {
      const side: "long" | "short" = Math.random() < 0.82 ? "long" : "short";
      const ticker = pick(TICKERS);

      // --- Entry price: realistic per ticker type ---
      let entryPrice: number;
      if (BIG_NAMES.includes(ticker)) {
        // SPY ~550, QQQ ~480, TSLA ~250, NVDA ~120, etc.
        const bigPrices: Record<string, [number, number]> = {
          SPY: [545, 560], QQQ: [475, 490], TSLA: [240, 280],
          NVDA: [110, 130], AMD: [95, 115], META: [580, 620],
        };
        const range = bigPrices[ticker] ?? [100, 200];
        entryPrice = roundTo(rand(range[0], range[1]), 2);
      } else if (CRYPTO_TICKERS.includes(ticker)) {
        if (ticker === "COIN") entryPrice = roundTo(rand(200, 260), 2);
        else if (ticker === "MSTR") entryPrice = roundTo(rand(350, 420), 2);
        else entryPrice = roundTo(rand(3, 25), 2); // miners
      } else {
        // Small caps: mostly $2-$20
        const priceRoll = Math.random();
        if (priceRoll < 0.20) entryPrice = rand(1.5, 4);
        else if (priceRoll < 0.80) entryPrice = rand(4, 20);
        else entryPrice = rand(20, 40);
        entryPrice = roundTo(entryPrice, 2);
      }

      // --- Shares: scale to price so position sizes are ~$2k-$8k ---
      const targetNotional = rand(2000, 8000);
      let shares = Math.round(targetNotional / entryPrice / 10) * 10;
      if (shares < 10) shares = 10;
      if (entryPrice < 5) shares = Math.round(shares / 100) * 100 || 100;

      // --- Morning vs afternoon determines win/loss ---
      // Morning (9:30-11:30): ~70% win rate
      // Afternoon (12:00-16:00): ~35% win rate
      // Overtrading days: afternoon trades are even worse
      let entryHour: number, entryMin: number;
      let isMorning: boolean;
      if (Math.random() < 0.55) {
        // Morning session
        isMorning = true;
        entryHour = 9;
        entryMin = randInt(30, 59);
        if (Math.random() < 0.45) {
          entryHour = 10;
          entryMin = randInt(0, 59);
        }
        if (Math.random() < 0.2) {
          entryHour = 11;
          entryMin = randInt(0, 30);
        }
      } else {
        // Afternoon session
        isMorning = false;
        entryHour = randInt(12, 15);
        entryMin = randInt(0, 59);
        if (entryHour === 15) entryMin = randInt(0, 45);
      }
      const entryTime = formatTime(entryHour, entryMin);

      // Win rate: THE KEY PATTERN — mornings print, afternoons bleed
      let winRate: number;
      if (isMorning) {
        winRate = 0.70;
      } else if (isOvertradeDay) {
        winRate = 0.25; // tilt trades
      } else {
        winRate = 0.35;
      }
      const isWinner = Math.random() < winRate;

      const grade = weightedPick([...GRADES], [...GRADE_WEIGHTS]);
      let finalWinner = isWinner;
      if (grade === "A" && Math.random() < 0.80) finalWinner = true;
      if (grade === "D" && Math.random() < 0.65) finalWinner = false;

      // --- P&L sizing ---
      let pctMove: number;
      if (finalWinner) {
        if (BIG_NAMES.includes(ticker)) {
          pctMove = rand(0.003, 0.012); // big names move less
        } else if (Math.random() < 0.12) {
          pctMove = rand(0.08, 0.15); // occasional big winner
        } else {
          pctMove = rand(0.015, 0.05);
        }
      } else {
        if (isOvertradeDay && !isMorning) {
          // Overtrading losses are bigger — wider stops, chasing
          pctMove = -rand(0.03, 0.07);
        } else if (BIG_NAMES.includes(ticker)) {
          pctMove = -rand(0.002, 0.008);
        } else {
          pctMove = -rand(0.01, 0.035);
        }
      }

      let exitPrice: number;
      if (side === "long") {
        exitPrice = roundTo(entryPrice * (1 + pctMove), 2);
      } else {
        exitPrice = roundTo(entryPrice * (1 - pctMove), 2);
      }
      if (exitPrice < 0.01) exitPrice = 0.01;

      // Exit time: scalps to swing-ish (3 min to 2 hours)
      const entryMinutes = entryHour * 60 + entryMin;
      const holdMinutes = randInt(3, 120);
      let exitMinutes = entryMinutes + holdMinutes;
      if (exitMinutes > 16 * 60) exitMinutes = 16 * 60 - randInt(1, 10);
      const exitHour = Math.floor(exitMinutes / 60);
      const exitMin = exitMinutes % 60;
      const exitTime = formatTime(exitHour, exitMin);

      // Setup
      const setup = pick(SETUPS);

      // Emotion — correlated with session and outcome
      let emotion: string;
      if (isOvertradeDay && !isMorning) {
        emotion = weightedPick(
          ["frustrated", "revenge trading", "fomo", "nervous"],
          [3, 3, 2, 1]
        );
      } else if (finalWinner) {
        emotion = weightedPick(
          ["confident", "disciplined", "patient", "calm"],
          [3, 3, 2, 2]
        );
      } else {
        emotion = weightedPick(
          ["frustrated", "nervous", "fomo", "disciplined"],
          [3, 2, 2, 1]
        );
      }

      // Tags
      const numTags = randInt(1, 3);
      const tags = [...TAGS_POOL].sort(() => Math.random() - 0.5).slice(0, numTags);

      // Catalyst
      const catalystType = pick([...CATALYST_TYPES]);
      const catalystDescriptions: Record<string, string[]> = {
        earnings: ["Beat earnings estimates", "Missed revenue, guidance raised", "Surprise profit", "Earnings gap up"],
        news_pr: ["FDA approval news", "Partnership announced", "CEO on CNBC", "Contract win PR", "Analyst upgrade"],
        technical: ["Bounced off 200 SMA", "Broke out of consolidation", "Golden cross forming", "Gap fill setup"],
        short_squeeze: ["High short interest + volume spike", "Utilization at 99%", "CTB spiking", "Shorts trapped above VWAP"],
        sympathy: ["Running with sector leader", "Sympathy play off SMCI", "Sector rotation move", "Following NVDA momentum"],
      };
      const catalyst = pick(catalystDescriptions[catalystType]);

      // Stop loss (~65%)
      let stopLossPrice: number | null = null;
      if (Math.random() < 0.65) {
        const stopPct = rand(0.01, 0.03);
        if (side === "long") stopLossPrice = roundTo(entryPrice * (1 - stopPct), 2);
        else stopLossPrice = roundTo(entryPrice * (1 + stopPct), 2);
      }

      // Float shares — only for small caps
      let floatShares: number | null = null;
      if (SMALL_CAPS.includes(ticker) && Math.random() < 0.45) {
        floatShares = roundTo(rand(1_000_000, 40_000_000), 0);
      }

      const commission = Math.random() < 0.85 ? 0 : roundTo(rand(1, 5), 2);

      // --- Notes: more natural, match the story ---
      const morningWinnerNotes = [
        "Clean setup, followed the plan. Took profit into the push.",
        "Saw volume come in at open, pulled trigger. Textbook.",
        "VWAP held, entered on the bounce. Let it ride to 2R.",
        "Gap and go worked perfectly. Sold into strength.",
        "Quick scalp off the open. In and out, no stress.",
        "Premarket levels held, took the long. Easy money.",
        "Morning momentum was clean. Took partials on the way up.",
      ];
      const afternoonLoserNotes = [
        "Shouldn't have been trading this late. Market was choppy.",
        "Tried to catch a move but it faded. Afternoon = no edge.",
        "Chased this one. Knew better. Need to stop trading after lunch.",
        "Overtraded today. This was a revenge trade after the 1pm loss.",
        "Boredom trade. No real setup. Just wanted to be in something.",
        "Market was dead, forced this. Small loss but shouldn't have been in it.",
        "Afternoon chop got me again. Literally giving back morning profits.",
      ];
      const generalWinnerNotes = [
        "Good R:R, risk was tight. Executed the plan.",
        "Waited for confirmation, entered on the break. Solid.",
        "Partial at 1.5R, let the rest ride. Discipline paying off.",
      ];
      const generalLoserNotes = [
        "Setup was there but timing was off. Stopped out.",
        "Should have waited for a better entry. Chased it.",
        "Stop was too wide. Need to be tighter.",
        "Broke my rules on this one. Lesson learned.",
      ];

      let notes: string;
      if (isMorning && finalWinner) notes = pick(morningWinnerNotes);
      else if (!isMorning && !finalWinner) notes = pick(afternoonLoserNotes);
      else if (finalWinner) notes = pick(generalWinnerNotes);
      else notes = pick(generalLoserNotes);

      trades.push({
        user_id: USER_ID,
        ticker,
        side,
        entry_price: entryPrice,
        exit_price: exitPrice,
        shares,
        trade_date: tradeDate,
        entry_time: entryTime,
        exit_time: exitTime,
        setup,
        notes,
        emotions: emotion,
        stop_loss_price: stopLossPrice,
        tags,
        grade,
        premarket_plan: "",
        screenshot_url: null,
        catalyst,
        catalyst_type: catalystType,
        float_shares: floatShares,
        market_cap: null,
        rvol: null,
        commission,
        is_scaled: false,
        avg_entry_price: null,
        avg_exit_price: null,
        total_shares: null,
      });
    }
  }

  // Sort chronologically
  trades.sort((a, b) => {
    if (a.trade_date !== b.trade_date) return a.trade_date.localeCompare(b.trade_date);
    return a.entry_time.localeCompare(b.entry_time);
  });

  return trades;
}

// ---------------------------------------------------------------------------
// Generate missed trades
// ---------------------------------------------------------------------------
interface MissedTradeRow {
  user_id: string;
  ticker: string;
  trade_date: string;
  setup: string;
  tags: string[];
  reason: string;
  side: "long" | "short" | null;
  estimated_entry: number | null;
  estimated_exit: number | null;
  estimated_shares: number | null;
  hesitation_reasons: string[];
}

function generateMissedTrades(): MissedTradeRow[] {
  const count = randInt(5, 10);
  const missed: MissedTradeRow[] = [];

  // Spread across the trading days
  const usedDays = new Set<string>();
  for (let i = 0; i < count; i++) {
    let day: string;
    do {
      day = pick(tradingDays);
    } while (usedDays.has(day) && usedDays.size < tradingDays.length);
    usedDays.add(day);

    const ticker = pick([...BIG_NAMES, ...SMALL_CAPS.slice(0, 8)]);

    const entryPrice = roundTo(rand(5, 60), 2);
    // Missed trades had big moves — 5-20% gains
    const movePct = rand(0.05, 0.20);
    const exitPrice = roundTo(entryPrice * (1 + movePct), 2);

    const shares = Math.round(randInt(200, 2000) / 100) * 100;

    const setup = pick(SETUPS);
    const numTags = randInt(1, 3);
    const tags = [...TAGS_POOL].sort(() => Math.random() - 0.5).slice(0, numTags);

    const numReasons = randInt(1, 2);
    const hesitationReasons = [...HESITATION_REASONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, numReasons);

    const reasons = [
      `${ticker} broke out from ${setup.toLowerCase()} setup and ran ${(movePct * 100).toFixed(0)}%. Had it on my watchlist but didn't pull the trigger.`,
      `Watched ${ticker} consolidate then break. Would have been a ${(movePct * 100).toFixed(0)}% winner. ${hesitationReasons[0]}.`,
      `${ticker} gapped and never looked back. Missed the move entirely. ${hesitationReasons[0]}.`,
      `Had ${ticker} on the scanner, saw the volume come in, but hesitated. ${hesitationReasons[0]}.`,
    ];

    missed.push({
      user_id: USER_ID,
      ticker,
      trade_date: day,
      setup,
      tags,
      reason: pick(reasons),
      side: Math.random() < 0.85 ? "long" : "short",
      estimated_entry: entryPrice,
      estimated_exit: exitPrice,
      estimated_shares: shares,
      hesitation_reasons: hesitationReasons,
    });
  }

  missed.sort((a, b) => a.trade_date.localeCompare(b.trade_date));
  return missed;
}

// ---------------------------------------------------------------------------
// Generate journal entries
// ---------------------------------------------------------------------------
interface JournalRow {
  user_id: string;
  entry_date: string;
  premarket_plan: string;
  postmarket_review: string;
  lessons: string;
  mood: string | null;
  grade: string | null;
  goals_for_tomorrow: string;
}

function generateJournalEntries(trades: TradeRow[]): JournalRow[] {
  const count = randInt(8, 12);
  const entries: JournalRow[] = [];

  // Pick days that have trades for more realistic journals
  const daysWithTrades = [...new Set(trades.map((t) => t.trade_date))];
  const selectedDays = daysWithTrades
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, daysWithTrades.length));

  // If we need more days, add some without trades
  while (selectedDays.length < count) {
    const day = pick(tradingDays);
    if (!selectedDays.includes(day)) selectedDays.push(day);
  }
  selectedDays.sort();

  for (const day of selectedDays) {
    const dayTrades = trades.filter((t) => t.trade_date === day);
    const dayPnl = dayTrades.reduce((sum, t) => {
      const pnl =
        t.side === "long"
          ? (t.exit_price - t.entry_price) * t.shares
          : (t.entry_price - t.exit_price) * t.shares;
      return sum + pnl;
    }, 0);
    const isGreenDay = dayPnl > 0;
    const tradeCount = dayTrades.length;
    const tickers = [...new Set(dayTrades.map((t) => t.ticker))];

    // Premarket plan
    const watchlistTickers = tickers.length > 0
      ? tickers.slice(0, 3).join(", ")
      : pick(SMALL_CAPS.slice(0, 5)) + ", " + pick(SMALL_CAPS.slice(5, 10));

    const premarketPlans = [
      `Watchlist: ${watchlistTickers}. Looking for ${pick(SETUPS).toLowerCase()} setups. Gap scanners showing some nice names. Will focus on A+ setups only and keep size small until I get a winner.`,
      `Key levels marked on ${watchlistTickers}. Plan: wait for the first 5 minutes to settle, then look for ${pick(SETUPS).toLowerCase()} entries. Max loss today: $200. No revenge trades.`,
      `Scanning for low float runners this morning. ${watchlistTickers} on the radar. Will focus on morning setups — that's been my edge lately. Tight stops, let winners run.`,
      `Market looks choppy pre-market. Going to be selective today. ${watchlistTickers} showing volume. Only trading if I see a clean ${pick(SETUPS).toLowerCase()} setup. Risk 1R per trade max.`,
      `Good setups forming on ${watchlistTickers}. Goal today: follow my rules, no overtrading. Take 2-3 A-quality setups max. Size appropriately.`,
      `Pre-market gap on ${watchlistTickers}. Looking for ${pick(SETUPS).toLowerCase()} if it holds VWAP. Also watching for a short setup if it fades. Key level is the pre-market high.`,
    ];

    // Post-market review
    const pnlStr = dayPnl >= 0
      ? `+$${Math.abs(dayPnl).toFixed(0)}`
      : `-$${Math.abs(dayPnl).toFixed(0)}`;

    const greenReviews = [
      `Solid day. ${pnlStr} on ${tradeCount} trades. Morning setups printed again. Shut it down before lunch and locked in green.`,
      `Green day ${pnlStr}. Executed well on the open, took profits into the push. Didn't trade the afternoon — that's the move.`,
      `Nice day ${pnlStr}. ${tradeCount} trades. The ${pick(SETUPS).toLowerCase()} on ${tickers[0] ?? pick(SMALL_CAPS)} was the highlight. Feeling good.`,
      `${pnlStr} today. Morning was clean. Resisted the urge to trade after 11:30. Best decision I made all day.`,
    ];

    const redReviews = [
      `Tough day. ${pnlStr} on ${tradeCount} trades. ${tradeCount >= 6 ? "Way too many trades. Gave back all my morning gains and then some in the afternoon." : "Got chopped up. Should have stopped earlier."}`,
      `Red day ${pnlStr}. Was green going into lunch then kept trading and gave it all back. The pattern is so obvious — mornings work, afternoons don't.`,
      `${pnlStr}. ${tradeCount >= 6 ? "Overtraded like crazy. Revenge traded after the 1pm loss and it snowballed." : "Frustrating. One bad trade wiped out the morning."} Need to walk away.`,
      `Down ${pnlStr}. Afternoon was brutal. ${tradeCount >= 6 ? `${tradeCount} trades is insane, I know better than this.` : "Chased setups that weren't there."} Morning P&L was fine.`,
    ];

    const postmarketReview = tradeCount === 0
      ? "No trades today. Market didn't give me anything I liked. Staying disciplined."
      : isGreenDay
        ? pick(greenReviews)
        : pick(redReviews);

    // Lessons
    const allLessons = [
      "Morning is where my edge is. Stop trading after 11:30.",
      "Afternoon trades are -EV for me. The data will prove it eventually.",
      "Overtrading is my biggest leak. 3-4 trades max per day.",
      "When I trade my plan, I win. When I go off-script, I lose.",
      "Green days come from discipline, not from big winners.",
      "Need to size down after 2 consecutive losses.",
      "Revenge trading after lunch is literally burning money.",
      "Position sizing is everything. Small size = clear head.",
      "Quality over quantity. 2 good trades > 6 mediocre ones.",
      "The first 5 minutes are for watching, not trading.",
      "Stop loss placement is key. Too tight = stopped out, too wide = big losses.",
      "When I trade past noon I'm not trading setups, I'm trading boredom.",
    ];
    const numLessons = randInt(1, 2);
    const lessons = [...allLessons]
      .sort(() => Math.random() - 0.5)
      .slice(0, numLessons)
      .join(" ");

    // Goals for tomorrow
    const allGoals = [
      "Max 3 trades. Close screens by 11:30. No exceptions.",
      "Morning session only. If I'm green at lunch, walk away.",
      "No trading in the first 5 minutes. Wait for the dust to settle.",
      "Review my top setups before the open. Have levels pre-planned.",
      "Daily max loss: $150. Walk away if I hit it.",
      "If I'm up on the day, do NOT give it back in the afternoon.",
      "Focus on one ticker at a time. No flipping between charts.",
      "Trade the process, not the P&L. Focus on execution quality.",
      "Prepare watchlist tonight. Morning should be execution only.",
    ];
    const numGoals = randInt(1, 3);
    const goals = [...allGoals]
      .sort(() => Math.random() - 0.5)
      .slice(0, numGoals)
      .join(" ");

    const mood = weightedPick([...JOURNAL_MOODS], [...MOOD_WEIGHTS]);
    // Correlate mood with P&L
    let finalMood = mood;
    if (isGreenDay && (mood === "frustrated" || mood === "tilted")) {
      finalMood = weightedPick(["great", "good", "neutral"], [0.3, 0.5, 0.2]);
    }
    if (!isGreenDay && dayPnl < -100 && (mood === "great")) {
      finalMood = weightedPick(["frustrated", "neutral", "good"], [0.4, 0.3, 0.3]);
    }

    const journalGrade = weightedPick([...JOURNAL_GRADES], [...JOURNAL_GRADE_WEIGHTS]);

    entries.push({
      user_id: USER_ID,
      entry_date: day,
      premarket_plan: pick(premarketPlans),
      postmarket_review: postmarketReview,
      lessons,
      mood: finalMood,
      grade: journalGrade,
      goals_for_tomorrow: goals,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nSeeding demo data for user: ${USER_ID}`);
  console.log("=".repeat(50));

  // Step 1: Delete existing data
  console.log("\nDeleting existing data...");

  const { error: delTrades } = await supabase
    .from("trades")
    .delete()
    .eq("user_id", USER_ID);
  if (delTrades) {
    console.error("Failed to delete trades:", delTrades.message);
    process.exit(1);
  }
  console.log("  Deleted existing trades");

  const { error: delMissed } = await supabase
    .from("missed_trades")
    .delete()
    .eq("user_id", USER_ID);
  if (delMissed) {
    console.error("Failed to delete missed trades:", delMissed.message);
    process.exit(1);
  }
  console.log("  Deleted existing missed trades");

  const { error: delJournal } = await supabase
    .from("journal_entries")
    .delete()
    .eq("user_id", USER_ID);
  if (delJournal) {
    console.error("Failed to delete journal entries:", delJournal.message);
    process.exit(1);
  }
  console.log("  Deleted existing journal entries");

  // Reset free trial on profile
  console.log("\nResetting free trial...");
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      plan: "free",
      trial_ends_at: null,
      subscription_status: "none",
      stripe_customer_id: null,
      stripe_subscription_id: null,
    })
    .eq("id", USER_ID);
  if (profileErr) {
    console.error("Failed to reset profile:", profileErr.message);
    process.exit(1);
  }
  console.log("  Profile reset — plan: free, trial: available, subscription: none");

  // Delete any subscription row
  const { error: delSub } = await supabase
    .from("subscriptions")
    .delete()
    .eq("user_id", USER_ID);
  if (delSub) {
    console.warn("  Warning: could not delete subscription row:", delSub.message);
  } else {
    console.log("  Deleted existing subscription record");
  }

  // Step 2: Generate data
  console.log("\nGenerating data...");
  const trades = generateTrades();
  const missedTrades = generateMissedTrades();
  const journalEntries = generateJournalEntries(trades);

  // Quick stats with morning/afternoon breakdown
  const pnlOf = (t: TradeRow) =>
    t.side === "long"
      ? (t.exit_price - t.entry_price) * t.shares
      : (t.entry_price - t.exit_price) * t.shares;

  const totalPnl = trades.reduce((sum, t) => sum + pnlOf(t), 0);
  const winners = trades.filter((t) => pnlOf(t) > 0);

  const morningTrades = trades.filter((t) => parseInt(t.entry_time) < 12);
  const afternoonTrades = trades.filter((t) => parseInt(t.entry_time) >= 12);
  const morningPnl = morningTrades.reduce((sum, t) => sum + pnlOf(t), 0);
  const afternoonPnl = afternoonTrades.reduce((sum, t) => sum + pnlOf(t), 0);
  const morningWins = morningTrades.filter((t) => pnlOf(t) > 0);
  const afternoonWins = afternoonTrades.filter((t) => pnlOf(t) > 0);

  // Overtrading days
  const dayGroups = new Map<string, TradeRow[]>();
  for (const t of trades) {
    if (!dayGroups.has(t.trade_date)) dayGroups.set(t.trade_date, []);
    dayGroups.get(t.trade_date)!.push(t);
  }
  const overtradeDays = [...dayGroups.entries()].filter(([, ts]) => ts.length >= 6);

  console.log(`  ${trades.length} trades (${winners.length} winners, ${((winners.length / trades.length) * 100).toFixed(1)}% win rate)`);
  console.log(`  Total P&L: $${totalPnl.toFixed(2)}`);
  console.log(`  Morning (before noon): ${morningTrades.length} trades, ${morningWins.length} wins (${morningTrades.length ? ((morningWins.length / morningTrades.length) * 100).toFixed(0) : 0}%), P&L: $${morningPnl.toFixed(2)}`);
  console.log(`  Afternoon (noon+):     ${afternoonTrades.length} trades, ${afternoonWins.length} wins (${afternoonTrades.length ? ((afternoonWins.length / afternoonTrades.length) * 100).toFixed(0) : 0}%), P&L: $${afternoonPnl.toFixed(2)}`);
  console.log(`  Overtrading days (6+): ${overtradeDays.length} days`);
  console.log(`  ${missedTrades.length} missed trades`);
  console.log(`  ${journalEntries.length} journal entries`);

  // Step 3: Insert trades in batches
  console.log("\nInserting trades...");
  const BATCH_SIZE = 50;
  for (let i = 0; i < trades.length; i += BATCH_SIZE) {
    const batch = trades.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("trades").insert(batch);
    if (error) {
      console.error(`Failed to insert trades batch ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`  Inserted ${trades.length} trades`);

  // Step 4: Insert missed trades
  console.log("Inserting missed trades...");
  const { error: missedErr } = await supabase.from("missed_trades").insert(missedTrades);
  if (missedErr) {
    console.error("Failed to insert missed trades:", missedErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${missedTrades.length} missed trades`);

  // Step 5: Insert journal entries
  console.log("Inserting journal entries...");
  const { error: journalErr } = await supabase.from("journal_entries").insert(journalEntries);
  if (journalErr) {
    console.error("Failed to insert journal entries:", journalErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${journalEntries.length} journal entries`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("SEED COMPLETE");
  console.log(`  ${trades.length} trades | ${missedTrades.length} missed | ${journalEntries.length} journal entries`);
  console.log(`  Date range: ${tradingDays[0]} to ${tradingDays[tradingDays.length - 1]}`);
  console.log(`  Overall: ${((winners.length / trades.length) * 100).toFixed(0)}% win rate, $${totalPnl.toFixed(0)} P&L`);
  console.log(`  Morning:   ${morningTrades.length ? ((morningWins.length / morningTrades.length) * 100).toFixed(0) : 0}% win rate, $${morningPnl.toFixed(0)} P&L`);
  console.log(`  Afternoon: ${afternoonTrades.length ? ((afternoonWins.length / afternoonTrades.length) * 100).toFixed(0) : 0}% win rate, $${afternoonPnl.toFixed(0)} P&L`);
  console.log(`  Overtrading blowups: ${overtradeDays.length} days`);
  console.log("=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
