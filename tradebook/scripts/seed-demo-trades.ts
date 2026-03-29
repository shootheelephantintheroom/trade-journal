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
const TICKERS = [
  "LUNR", "SMCI", "MARA", "RIVN", "GRAB", "SOFI", "PLTR", "IONQ", "DNA",
  "DRUG", "NVAX", "OPEN", "WISH", "CLOV", "BBIG", "MULN", "ATER", "GSAT",
  "SOUN", "RKLB", "AFRM", "LCID", "NKLA", "WKHS", "SKLZ", "SPCE", "LAZR",
  "VUZI", "BYND", "SNAP", "PROG", "FCEL", "PLUG", "BLNK", "QS", "RDW",
  "BKKT", "DM", "ENVX", "ORGN", "APLD", "BTBT", "BITF", "CIFR", "HUT",
  "IOVA", "XPEV", "NIO", "LI", "GOEV",
];

const BIG_TICKERS = ["SMCI", "TSLA", "NVDA", "AMD", "META", "AAPL", "GOOGL", "AMZN"];

const SETUPS = [
  "VWAP reclaim", "opening range breakout", "dip buy", "short squeeze",
  "red-to-green", "breakdown short", "gap and go", "ABCD pattern",
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
// Generate trading days (last 90 calendar days, weekdays only)
// ---------------------------------------------------------------------------
const today = new Date();
const tradingDays: string[] = [];
for (let i = 90; i >= 0; i--) {
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
  const totalTrades = randInt(150, 200);
  const trades: TradeRow[] = [];

  // Distribute trades across trading days — heavier on some days
  const dayWeights = tradingDays.map(() => rand(0.3, 3));
  const totalWeight = dayWeights.reduce((a, b) => a + b, 0);

  // Assign trade counts per day
  const tradesPerDay: number[] = dayWeights.map((w) =>
    Math.max(0, Math.round((w / totalWeight) * totalTrades))
  );
  // Adjust to hit target
  let currentTotal = tradesPerDay.reduce((a, b) => a + b, 0);
  while (currentTotal < totalTrades) {
    tradesPerDay[randInt(0, tradesPerDay.length - 1)]++;
    currentTotal++;
  }
  while (currentTotal > totalTrades) {
    const idx = randInt(0, tradesPerDay.length - 1);
    if (tradesPerDay[idx] > 0) {
      tradesPerDay[idx]--;
      currentTotal--;
    }
  }

  // Track recent days for improvement arc
  const totalDays = tradingDays.length;

  for (let dayIdx = 0; dayIdx < tradingDays.length; dayIdx++) {
    const tradeDate = tradingDays[dayIdx];
    const count = tradesPerDay[dayIdx];
    if (count === 0) continue;

    // Improvement arc: win rate improves from ~52% to ~62% over the 90 days
    const dayProgress = dayIdx / totalDays;
    const baseWinRate = 0.52 + dayProgress * 0.10;

    for (let t = 0; t < count; t++) {
      const side: "long" | "short" = Math.random() < 0.75 ? "long" : "short";
      const ticker = pick(TICKERS);

      // Entry price: skew toward $3-$25 range
      let entryPrice: number;
      const priceRoll = Math.random();
      if (priceRoll < 0.15) entryPrice = rand(1.5, 3);
      else if (priceRoll < 0.75) entryPrice = rand(3, 25);
      else if (priceRoll < 0.92) entryPrice = rand(25, 50);
      else entryPrice = rand(50, 80);
      entryPrice = roundTo(entryPrice, 2);

      // Shares: inversely proportional to price
      let shares: number;
      if (entryPrice < 5) shares = randInt(1000, 5000);
      else if (entryPrice < 15) shares = randInt(500, 3000);
      else if (entryPrice < 30) shares = randInt(200, 1500);
      else shares = randInt(100, 800);
      // Round to nearest 100
      shares = Math.round(shares / 100) * 100;
      if (shares === 0) shares = 100;

      // Win/loss determination
      const isWinner = Math.random() < baseWinRate;
      const grade = weightedPick([...GRADES], [...GRADE_WEIGHTS]);

      // Correlate grade with outcome — A grades mostly winners, D grades mostly losers
      let finalWinner = isWinner;
      if (grade === "A" && Math.random() < 0.85) finalWinner = true;
      if (grade === "D" && Math.random() < 0.70) finalWinner = false;

      // Exit price
      let pctMove: number;
      if (finalWinner) {
        // Most winners: +2-5%, some big: +10-15%
        if (Math.random() < 0.15) pctMove = rand(0.10, 0.15);
        else pctMove = rand(0.015, 0.05);
      } else {
        // Most losers: -1-3%, some blowups: -5-8%
        if (Math.random() < 0.12) pctMove = -rand(0.05, 0.08);
        else pctMove = -rand(0.01, 0.03);
      }

      let exitPrice: number;
      if (side === "long") {
        exitPrice = roundTo(entryPrice * (1 + pctMove), 2);
      } else {
        // Short: profit when price goes down
        exitPrice = roundTo(entryPrice * (1 - pctMove), 2);
      }
      if (exitPrice < 0.01) exitPrice = 0.01;

      // Entry time: cluster around market open (9:30-10:30) and afternoon (13:00-15:00)
      let entryHour: number, entryMin: number;
      if (Math.random() < 0.65) {
        // Morning cluster
        entryHour = 9;
        entryMin = randInt(30, 59);
        if (Math.random() < 0.4) {
          entryHour = 10;
          entryMin = randInt(0, 30);
        }
      } else {
        // Afternoon cluster
        entryHour = randInt(13, 15);
        entryMin = randInt(0, 59);
        if (entryHour === 15) entryMin = randInt(0, 30);
      }
      const entryTime = formatTime(entryHour, entryMin);

      // Exit time: 5 min to 3 hours after entry
      const entryMinutes = entryHour * 60 + entryMin;
      const holdMinutes = randInt(5, 180);
      let exitMinutes = entryMinutes + holdMinutes;
      // Cap at 4 PM
      if (exitMinutes > 16 * 60) exitMinutes = 16 * 60 - randInt(1, 15);
      const exitHour = Math.floor(exitMinutes / 60);
      const exitMin = exitMinutes % 60;
      const exitTime = formatTime(exitHour, exitMin);

      // Setup
      const setup = side === "short"
        ? pick(["breakdown short", "short squeeze", "VWAP reclaim", "ABCD pattern"])
        : pick(SETUPS);

      // Emotion — correlated with outcome
      let emotion: string;
      if (finalWinner) {
        emotion = weightedPick(
          ["confident", "disciplined", "patient", "calm", "nervous", "fomo"],
          [3, 3, 2, 2, 1, 1]
        );
      } else {
        emotion = weightedPick(
          ["frustrated", "nervous", "fomo", "revenge trading", "disciplined", "calm"],
          [3, 2, 2, 2, 1, 1]
        );
      }

      // Tags
      const numTags = randInt(1, 3);
      const tags: string[] = [];
      const shuffled = [...TAGS_POOL].sort(() => Math.random() - 0.5);
      for (let i = 0; i < numTags; i++) tags.push(shuffled[i]);

      // Catalyst
      const catalystType = pick([...CATALYST_TYPES]);
      const catalystDescriptions: Record<string, string[]> = {
        earnings: ["Beat earnings estimates", "Missed revenue, but guidance raised", "Surprise profit", "Earnings gap up"],
        news_pr: ["FDA approval news", "Partnership announced", "CEO on CNBC", "Contract win PR", "Analyst upgrade"],
        technical: ["Bounced off 200 SMA", "Broke out of consolidation", "Golden cross forming", "Gap fill setup"],
        short_squeeze: ["High short interest + volume spike", "Utilization at 99%", "CTB spiking", "Shorts trapped above VWAP"],
        sympathy: ["Running with sector leader", "Sympathy play off SMCI", "Sector rotation move", "Following NVDA momentum"],
      };
      const catalyst = pick(catalystDescriptions[catalystType]);

      // Stop loss (~70%)
      let stopLossPrice: number | null = null;
      if (Math.random() < 0.70) {
        const stopPct = rand(0.01, 0.03);
        if (side === "long") stopLossPrice = roundTo(entryPrice * (1 - stopPct), 2);
        else stopLossPrice = roundTo(entryPrice * (1 + stopPct), 2);
      }

      // Float shares (~40%)
      let floatShares: number | null = null;
      if (Math.random() < 0.40) {
        floatShares = roundTo(rand(1_000_000, 50_000_000), 0);
      }

      // Commission
      const commission = Math.random() < 0.85 ? 0 : roundTo(rand(1, 5), 2);

      // Notes
      const winnerNotes = [
        "Clean setup, executed plan perfectly.",
        "Took partial at 2R, let runner go. Good discipline.",
        "Quick scalp, saw the volume come in and pulled trigger.",
        "VWAP held, added on the bounce. Textbook.",
        "Waited for confirmation, entered on the break. Solid trade.",
        "Morning momentum was strong, rode it for a nice gain.",
        "Risk was tight, reward was there. Good R:R.",
      ];
      const loserNotes = [
        "Stopped out. Setup was there but timing was off.",
        "Should have waited for better entry. Chased a bit.",
        "Market reversed hard, stop was too wide.",
        "Oversize on this one. Need to stick to position sizing rules.",
        "Revenge trade after the last loss. Recognized it too late.",
        "News dropped mid-trade, couldn't react fast enough.",
        "Broke my rules on this one. Lesson learned.",
        "Choppy price action, should have sat this one out.",
      ];
      const notes = finalWinner ? pick(winnerNotes) : pick(loserNotes);

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
  const count = randInt(20, 30);
  const missed: MissedTradeRow[] = [];

  // Spread across the 90 days
  const usedDays = new Set<string>();
  for (let i = 0; i < count; i++) {
    let day: string;
    do {
      day = pick(tradingDays);
    } while (usedDays.has(day) && usedDays.size < tradingDays.length);
    usedDays.add(day);

    const ticker = pick([...BIG_TICKERS, ...TICKERS.slice(0, 10)]);

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
  const count = randInt(30, 40);
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
      : pick(TICKERS.slice(0, 5)) + ", " + pick(TICKERS.slice(5, 10));

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
      `Solid day. ${pnlStr} on ${tradeCount} trades. Stuck to the plan and it paid off. Best trade was the ${pick(SETUPS).toLowerCase()} on ${tickers[0] ?? pick(TICKERS)}.`,
      `Green day ${pnlStr}. Executed well on the morning setups. Took profits too early on one trade but overall disciplined.`,
      `Nice day ${pnlStr}. ${tradeCount} trades, mostly winners. The ${pick(SETUPS).toLowerCase()} pattern worked great today. Feeling good about my process.`,
      `${pnlStr} today. Good patience waiting for setups. Didn't chase anything. ${tradeCount > 3 ? "Might have overtaded slightly but all were quality setups." : "Kept it clean."}`,
    ];

    const redReviews = [
      `Tough day. ${pnlStr} on ${tradeCount} trades. Got chopped up in the morning. Should have stopped trading after the second loss.`,
      `Red day ${pnlStr}. Overtraded after the morning losses. Need to respect my daily loss limit. The setups were there but my timing was off.`,
      `${pnlStr}. Frustrating session. Revenge traded after the first loss and it snowballed. Need to walk away when I'm down 2 trades.`,
      `Down ${pnlStr}. Market was choppy all day and I kept trying to force trades. Should have recognized the conditions and sat on my hands.`,
    ];

    const postmarketReview = tradeCount === 0
      ? "No trades today. Market didn't give me anything I liked. Staying disciplined."
      : isGreenDay
        ? pick(greenReviews)
        : pick(redReviews);

    // Lessons
    const allLessons = [
      "Need to size down after 2 consecutive losses.",
      "Morning setups are clearly my edge — stop forcing afternoon trades.",
      "Stopped revenge trading today — progress.",
      "VWAP is a better reference point than arbitrary support levels.",
      "Position sizing is everything. Small size = clear head.",
      "Must respect the daily loss limit. No exceptions.",
      "Wait for the setup to come to me instead of chasing.",
      "Green days come from discipline, not from big winners.",
      "Need to journal more consistently — it helps me see patterns.",
      "Taking partial profits earlier is reducing my drawdowns.",
      "The first 15 minutes are for watching, not trading.",
      "My win rate improves when I'm patient. Patience = edge.",
      "Stop loss placement is key. Too tight = stopped out, too wide = big losses.",
      "Quality over quantity. 2 good trades > 6 mediocre ones.",
      "When I trade my plan, I win. When I go off-script, I lose.",
      "Overtrading is my biggest leak. Must track # of trades per day.",
    ];
    const numLessons = randInt(1, 2);
    const lessons = [...allLessons]
      .sort(() => Math.random() - 0.5)
      .slice(0, numLessons)
      .join(" ");

    // Goals for tomorrow
    const allGoals = [
      "Max 4 trades. Only A+ setups.",
      "Focus on morning session only. Close screens by 11:30.",
      "Size down 25% until I string together 3 green days.",
      "No trading in the first 5 minutes. Wait for the dust to settle.",
      "Review my top setups before the open. Have levels pre-planned.",
      "Daily max loss: $150. Walk away if I hit it.",
      "Take at least one screenshot per trade for review.",
      "Focus on one ticker at a time. No flipping between charts.",
      "Journal this session before doing anything else tomorrow.",
      "Trade the process, not the P&L. Focus on execution quality.",
      "Start the day with 50% position size. Scale up only after a green trade.",
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

  // Quick stats
  const totalPnl = trades.reduce((sum, t) => {
    const pnl =
      t.side === "long"
        ? (t.exit_price - t.entry_price) * t.shares
        : (t.entry_price - t.exit_price) * t.shares;
    return sum + pnl;
  }, 0);
  const winners = trades.filter((t) => {
    const pnl =
      t.side === "long"
        ? (t.exit_price - t.entry_price) * t.shares
        : (t.entry_price - t.exit_price) * t.shares;
    return pnl > 0;
  });
  console.log(`  ${trades.length} trades (${winners.length} winners, ${((winners.length / trades.length) * 100).toFixed(1)}% win rate)`);
  console.log(`  Total P&L: $${totalPnl.toFixed(2)}`);
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
  console.log(`  ${trades.length} trades`);
  console.log(`  ${missedTrades.length} missed trades`);
  console.log(`  ${journalEntries.length} journal entries`);
  console.log(`  Date range: ${tradingDays[0]} to ${tradingDays[tradingDays.length - 1]}`);
  console.log(`  Win rate: ${((winners.length / trades.length) * 100).toFixed(1)}%`);
  console.log(`  Total P&L: $${totalPnl.toFixed(2)}`);
  console.log("=".repeat(50) + "\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
