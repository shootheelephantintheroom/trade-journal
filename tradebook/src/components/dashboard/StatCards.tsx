import { cn } from "../../lib/utils";
import type { LucideIcon } from "lucide-react";

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
  icon: Icon,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  trend?: TrendBadge;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl bg-surface-1 border border-white/[0.06] p-5 hover:border-white/[0.1] transition-colors duration-150">
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <Icon size={14} strokeWidth={1.8} className="text-zinc-500" />
        )}
        <p className="text-[13px] font-medium text-secondary">
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "text-2xl font-semibold font-mono tabular-nums leading-tight tracking-tight",
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
      {sub && <p className="text-[12px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="text-[12px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}
