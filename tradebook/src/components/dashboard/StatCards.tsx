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
  large,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  trend?: TrendBadge;
  icon?: LucideIcon;
  large?: boolean;
}) {
  return (
    <div className={cn("py-2 pl-3 border-l-2 border-white/[0.06]", large && "py-3")}>
      <p className="text-[12px] text-tertiary mb-0.5">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "font-medium font-mono tabular-nums leading-tight tracking-tight",
            large ? "text-3xl" : "text-xl",
            color || "text-primary"
          )}
        >
          {value}
        </p>
        {trend && (
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] leading-none",
              trend.direction === "up" && "text-profit bg-profit-muted",
              trend.direction === "down" && "text-loss bg-loss-muted",
              trend.direction === "flat" && "text-tertiary bg-surface-2"
            )}
          >
            {trend.direction === "up" && "\u2191 "}
            {trend.direction === "down" && "\u2193 "}
            {trend.label}
          </span>
        )}
      </div>
      {sub && <p className="text-[12px] text-tertiary mt-0.5">{sub}</p>}
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
    <div>
      <h3 className="text-[13px] font-medium text-secondary mb-0.5">{title}</h3>
      {description && (
        <p className="text-[12px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}
