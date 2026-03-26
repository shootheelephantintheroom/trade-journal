import { cn } from "../../lib/utils";

interface TrendBadge {
  direction: "up" | "down" | "flat";
  label: string;
}

export function StatCard({
  label,
  value,
  color,
  sub,
  trend,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  trend?: TrendBadge;
}) {
  return (
    <div className="rounded-[12px] bg-surface-1 border border-white/[0.06] p-5">
      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "text-[28px] font-semibold font-mono tabular-nums leading-tight",
            color || "text-primary"
          )}
        >
          {value}
        </p>
        {trend && (
          <span
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
              trend.direction === "up" && "text-profit bg-profit-muted",
              trend.direction === "down" && "text-loss bg-loss-muted",
              trend.direction === "flat" && "text-tertiary bg-surface-2"
            )}
          >
            {trend.direction === "up" && "↑ "}
            {trend.direction === "down" && "↓ "}
            {trend.label}
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-tertiary mt-1">{sub}</p>}
    </div>
  );
}
