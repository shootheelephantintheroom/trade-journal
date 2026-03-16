import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import type { Trade, CatalystType } from "../types/trade";
import { calcPnl, calcRR } from "../lib/calc";
import { useToast } from "./Toast";
import DashboardFilters, {
  FilterSummary,
  useDashboardFilters,
  applyFilters,
} from "./dashboard/DashboardFilters";
import TimeOfDayAnalysis from "./analytics/TimeOfDayAnalysis";
import HoldTimeAnalysis from "./analytics/HoldTimeAnalysis";
import TiltDetection from "./analytics/TiltDetection";

/* ── Collapsible Section ─────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card-panel p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between group"
      >
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ── Catalyst Performance ────────────────────────────── */

const CATALYST_LABELS: Record<CatalystType, string> = {
  earnings: "Earnings",
  news_pr: "News / PR",
  fda: "FDA",
  sec_filing: "SEC Filing",
  short_squeeze: "Short Squeeze",
  sympathy: "Sympathy",
  technical: "Technical",
  other: "Other",
};

interface CatalystStats {
  type: string;
  count: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

function buildCatalystStats(trades: Trade[]): CatalystStats[] {
  const byType = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!t.catalyst_type) continue;
    const existing = byType.get(t.catalyst_type) || [];
    existing.push(t);
    byType.set(t.catalyst_type, existing);
  }

  const stats: CatalystStats[] = [];
  for (const [type, typeTrades] of byType) {
    const pnls = typeTrades.map(calcPnl);
    const totalPnl = pnls.reduce((a, b) => a + b, 0);
    const wins = pnls.filter((p) => p > 0).length;
    stats.push({
      type,
      count: typeTrades.length,
      winRate: (wins / typeTrades.length) * 100,
      avgPnl: totalPnl / typeTrades.length,
      totalPnl,
    });
  }

  stats.sort((a, b) => b.count - a.count);
  return stats;
}

function CatalystPerformance({ trades }: { trades: Trade[] }) {
  const stats = useMemo(() => buildCatalystStats(trades), [trades]);

  if (stats.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No trades with catalyst data yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="trade-table w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              Catalyst
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              Trades
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              Win Rate
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
              Avg P&L
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
              Total P&L
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.type} className="border-t border-gray-800/40">
              <td className="py-2.5">
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20">
                  {CATALYST_LABELS[s.type as CatalystType] ?? s.type}
                </span>
              </td>
              <td className="py-2.5 text-gray-300 text-xs">{s.count}</td>
              <td
                className={`py-2.5 text-xs font-semibold ${s.winRate >= 50 ? "text-accent-400" : "text-red-400"}`}
              >
                {s.winRate.toFixed(0)}%
              </td>
              <td
                className={`py-2.5 text-right text-xs font-semibold ${s.avgPnl >= 0 ? "text-accent-400" : "text-red-400"}`}
              >
                {s.avgPnl >= 0 ? "+" : ""}${s.avgPnl.toFixed(2)}
              </td>
              <td
                className={`py-2.5 text-right text-xs font-semibold ${s.totalPnl >= 0 ? "text-accent-400" : "text-red-400"}`}
              >
                {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Float Size Performance ──────────────────────────── */

interface FloatBucket {
  label: string;
  min: number;
  max: number;
}

const FLOAT_BUCKETS: FloatBucket[] = [
  { label: "<10M", min: 0, max: 10_000_000 },
  { label: "10–50M", min: 10_000_000, max: 50_000_000 },
  { label: "50–200M", min: 50_000_000, max: 200_000_000 },
  { label: ">200M", min: 200_000_000, max: Infinity },
];

interface FloatStats {
  label: string;
  count: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

function buildFloatStats(trades: Trade[]): FloatStats[] {
  const bucketTrades: Trade[][] = FLOAT_BUCKETS.map(() => []);

  for (const t of trades) {
    if (t.float_shares == null) continue;
    for (let i = 0; i < FLOAT_BUCKETS.length; i++) {
      const b = FLOAT_BUCKETS[i];
      if (t.float_shares >= b.min && t.float_shares < b.max) {
        bucketTrades[i].push(t);
        break;
      }
    }
  }

  return FLOAT_BUCKETS.map((b, i) => {
    const bt = bucketTrades[i];
    if (bt.length === 0) {
      return { label: b.label, count: 0, winRate: 0, avgPnl: 0, totalPnl: 0 };
    }
    const pnls = bt.map(calcPnl);
    const totalPnl = pnls.reduce((a, c) => a + c, 0);
    const wins = pnls.filter((p) => p > 0).length;
    return {
      label: b.label,
      count: bt.length,
      winRate: (wins / bt.length) * 100,
      avgPnl: totalPnl / bt.length,
      totalPnl,
    };
  }).filter((s) => s.count > 0);
}

function FloatSizePerformance({ trades }: { trades: Trade[] }) {
  const stats = useMemo(() => buildFloatStats(trades), [trades]);

  if (stats.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No trades with float data yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="trade-table w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              Float Size
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              Trades
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
              Win Rate
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
              Avg P&L
            </th>
            <th className="pb-2.5 text-[10px] text-gray-500 uppercase font-semibold tracking-wider text-right">
              Total P&L
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.label} className="border-t border-gray-800/40">
              <td className="py-2.5">
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-accent-500/10 text-accent-400/80 border border-accent-500/20">
                  {s.label}
                </span>
              </td>
              <td className="py-2.5 text-gray-300 text-xs">{s.count}</td>
              <td
                className={`py-2.5 text-xs font-semibold ${s.winRate >= 50 ? "text-accent-400" : "text-red-400"}`}
              >
                {s.winRate.toFixed(0)}%
              </td>
              <td
                className={`py-2.5 text-right text-xs font-semibold ${s.avgPnl >= 0 ? "text-accent-400" : "text-red-400"}`}
              >
                {s.avgPnl >= 0 ? "+" : ""}${s.avgPnl.toFixed(2)}
              </td>
              <td
                className={`py-2.5 text-right text-xs font-semibold ${s.totalPnl >= 0 ? "text-accent-400" : "text-red-400"}`}
              >
                {s.totalPnl >= 0 ? "+" : ""}${s.totalPnl.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Analytics Page ──────────────────────────────────── */

export default function Analytics() {
  const { showToast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllTrades() {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("trade_date", { ascending: false })
        .order("entry_time", { ascending: false });
      if (error) {
        showToast("Failed to load trades", "error");
      } else {
        setTrades((data as Trade[]) || []);
      }
      setLoading(false);
    }
    fetchAllTrades();
  }, [showToast]);

  const [filters, updateFilters] = useDashboardFilters();
  const filteredTrades = useMemo(
    () => applyFilters(trades, filters),
    [trades, filters],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-6 w-6 border-2 border-gray-600 border-t-accent-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white font-display tracking-tight">
          Analytics
        </h2>
      </div>

      {/* Filters */}
      <DashboardFilters
        trades={trades}
        filters={filters}
        onUpdate={updateFilters}
      />
      <FilterSummary
        total={trades.length}
        filtered={filteredTrades.length}
        from={filters.from}
        to={filters.to}
      />

      {/* Sections */}
      <Section title="Time of Day Analysis">
        <TimeOfDayAnalysis trades={filteredTrades} />
      </Section>

      <Section title="Hold Time Analysis">
        <HoldTimeAnalysis trades={filteredTrades} />
      </Section>

      <Section title="Tilt Detection">
        <TiltDetection trades={filteredTrades} />
      </Section>

      <Section title="Catalyst Performance">
        <CatalystPerformance trades={filteredTrades} />
      </Section>

      <Section title="Float Size Performance">
        <FloatSizePerformance trades={filteredTrades} />
      </Section>
    </div>
  );
}
