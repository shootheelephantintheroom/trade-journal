import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Trade, CatalystType } from "../../types/trade";
import TagSelect from "../TagSelect";
import PaywallGate from "../PaywallGate";
import { cn } from "../../lib/utils";

const CATALYST_OPTIONS: { value: CatalystType; label: string }[] = [
  { value: "earnings", label: "Earnings" },
  { value: "news_pr", label: "News/PR" },
  { value: "fda", label: "FDA" },
  { value: "sec_filing", label: "SEC Filing" },
  { value: "short_squeeze", label: "Short Squeeze" },
  { value: "sympathy", label: "Sympathy" },
  { value: "technical", label: "Technical" },
  { value: "other", label: "Other" },
];

type QuickRange = "30d" | "90d" | "6mo" | "1yr" | "All";

const QUICK_LABELS: Record<QuickRange, string> = {
  "30d": "30 days",
  "90d": "90 days",
  "6mo": "6 months",
  "1yr": "1 year",
  "All": "All time",
};

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getQuickRange(key: QuickRange): { from: string; to: string } {
  const now = new Date();
  const to = toDateStr(now);
  if (key === "All") return { from: "", to: "" };
  const days = key === "30d" ? 30 : key === "90d" ? 90 : key === "6mo" ? 180 : 365;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: toDateStr(from), to };
}

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return toDateStr(d);
}

function defaultTo(): string {
  return toDateStr(new Date());
}

export interface DashboardFilterState {
  from: string;
  to: string;
  ticker: string;
  side: "all" | "long" | "short";
  catalysts: CatalystType[];
  tags: string[];
}

function activeQuickRange(from: string, to: string): QuickRange | null {
  const today = toDateStr(new Date());
  if (!from && !to) return "All";
  for (const key of ["30d", "90d", "6mo", "1yr"] as QuickRange[]) {
    const r = getQuickRange(key);
    if (r.from === from && (to === today || to === r.to)) return key;
  }
  return null;
}

export function useDashboardFilters(): [DashboardFilterState, (patch: Partial<DashboardFilterState>) => void] {
  const [params, setParams] = useSearchParams();

  const state: DashboardFilterState = useMemo(() => ({
    from: params.get("from") ?? defaultFrom(),
    to: params.get("to") ?? defaultTo(),
    ticker: params.get("ticker") ?? "",
    side: (params.get("side") as DashboardFilterState["side"]) || "all",
    catalysts: params.get("catalyst")
      ? (params.get("catalyst")!.split(",") as CatalystType[])
      : [],
    tags: params.get("tags") ? params.get("tags")!.split(",") : [],
  }), [params]);

  function update(patch: Partial<DashboardFilterState>) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const merged = { ...state, ...patch };

      if (merged.from && merged.from !== defaultFrom()) {
        next.set("from", merged.from);
      } else {
        next.delete("from");
      }
      if (merged.to && merged.to !== defaultTo()) {
        next.set("to", merged.to);
      } else {
        next.delete("to");
      }

      if (merged.ticker) next.set("ticker", merged.ticker);
      else next.delete("ticker");

      if (merged.side !== "all") next.set("side", merged.side);
      else next.delete("side");

      if (merged.catalysts.length > 0) next.set("catalyst", merged.catalysts.join(","));
      else next.delete("catalyst");

      if (merged.tags.length > 0) next.set("tags", merged.tags.join(","));
      else next.delete("tags");

      return next;
    }, { replace: true });
  }

  return [state, update];
}

export function applyFilters(trades: Trade[], f: DashboardFilterState): Trade[] {
  return trades.filter((t) => {
    if (f.from && t.trade_date < f.from) return false;
    if (f.to && t.trade_date > f.to) return false;
    if (f.ticker && !t.ticker.toLowerCase().includes(f.ticker.toLowerCase())) return false;
    if (f.side !== "all" && t.side !== f.side) return false;
    if (f.catalysts.length > 0 && (!t.catalyst_type || !f.catalysts.includes(t.catalyst_type))) return false;
    if (f.tags.length > 0 && !f.tags.some((tag) => t.tags.includes(tag))) return false;
    return true;
  });
}

const QUICK_KEYS: QuickRange[] = ["30d", "90d", "6mo", "1yr", "All"];
const SIDES = ["all", "long", "short"] as const;

const pillBase =
  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border cursor-pointer";
const pillActive =
  "bg-brand-muted text-brand border-brand/30";
const pillInactive =
  "text-tertiary border-transparent hover:text-secondary hover:border-border-hover";

const inputClass =
  "w-full rounded-lg border border-transparent bg-surface-2 px-3 py-2 text-sm text-primary placeholder-tertiary hover:border-border-hover focus:border-brand focus:outline-none transition-colors";
const labelClass =
  "block text-[11px] font-medium text-tertiary uppercase tracking-wider mb-1.5";

export default function DashboardFilters({
  trades,
  filters,
  onUpdate,
}: {
  trades: Trade[];
  filters: DashboardFilterState;
  onUpdate: (patch: Partial<DashboardFilterState>) => void;
}) {
  const tickers = useMemo(() => {
    const set = new Set<string>();
    for (const t of trades) set.add(t.ticker);
    return Array.from(set).sort();
  }, [trades]);

  function toggleCatalyst(c: CatalystType) {
    const next = filters.catalysts.includes(c)
      ? filters.catalysts.filter((x) => x !== c)
      : [...filters.catalysts, c];
    onUpdate({ catalysts: next });
  }

  return (
    <PaywallGate feature="Advanced Filters">
      <div className="rounded-xl bg-surface-1 p-4 mb-6">
        <div className="flex flex-wrap gap-x-6 gap-y-4 items-end">
          {/* Date range */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Date Range</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.from}
                onChange={(e) => onUpdate({ from: e.target.value })}
                className={inputClass + " w-[140px]"}
              />
              <span className="text-tertiary text-xs">to</span>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => onUpdate({ to: e.target.value })}
                className={inputClass + " w-[140px]"}
              />
            </div>
          </div>

          {/* Ticker */}
          <div className="flex flex-col gap-1.5 min-w-[140px]">
            <label className={labelClass}>Ticker</label>
            <input
              type="text"
              list="filter-tickers"
              value={filters.ticker}
              onChange={(e) => onUpdate({ ticker: e.target.value })}
              placeholder="e.g. AAPL"
              className={inputClass}
            />
            <datalist id="filter-tickers">
              {tickers.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* Side */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Side</span>
            <div className="flex gap-1">
              {SIDES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate({ side: s })}
                  className={cn(
                    pillBase,
                    filters.side === s
                      ? s === "long"
                        ? "bg-profit-muted text-profit border-profit/30"
                        : s === "short"
                          ? "bg-loss-muted text-loss border-loss/30"
                          : pillActive
                      : pillInactive
                  )}
                >
                  {s === "all" ? "All" : s === "long" ? "Long" : "Short"}
                </button>
              ))}
            </div>
          </div>

          {/* Catalyst Type */}
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Catalyst</span>
            <div className="flex flex-wrap gap-1.5">
              {CATALYST_OPTIONS.map((c) => {
                const active = filters.catalysts.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleCatalyst(c.value)}
                    className={cn(pillBase, active ? pillActive : pillInactive)}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5 w-full">
            <span className={labelClass}>Tags</span>
            <TagSelect
              selected={filters.tags}
              onChange={(tags) => onUpdate({ tags })}
            />
          </div>
        </div>
      </div>
    </PaywallGate>
  );
}

export function QuickDatePills({
  filters,
  onUpdate,
}: {
  filters: DashboardFilterState;
  onUpdate: (patch: Partial<DashboardFilterState>) => void;
}) {
  const active = activeQuickRange(filters.from, filters.to);
  return (
    <div className="flex gap-1.5 flex-wrap">
      {QUICK_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            const range = getQuickRange(k);
            onUpdate({ from: range.from, to: range.to });
          }}
          className={cn(pillBase, active === k ? pillActive : pillInactive)}
        >
          {QUICK_LABELS[k]}
        </button>
      ))}
    </div>
  );
}

export function FilterSummary({
  filtered,
  total,
  from,
  to,
}: {
  filtered: number;
  total: number;
  from: string;
  to: string;
}) {
  if (filtered === total && !from && !to) return null;

  function fmtDate(d: string) {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const range =
    from && to
      ? ` · ${fmtDate(from)} – ${fmtDate(to)}`
      : from
        ? ` · from ${fmtDate(from)}`
        : to
          ? ` · until ${fmtDate(to)}`
          : "";

  return (
    <p className="text-xs text-tertiary mb-4">
      Showing {filtered} of {total} trades{range}
    </p>
  );
}
