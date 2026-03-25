import { cn } from "../../lib/utils";

export function StatCard({
  label,
  value,
  color,
  sub,
  accent,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
  accent?: "green" | "red" | "neutral";
}) {
  return (
    <div className="rounded-xl bg-surface-1 p-5">
      <p className="text-[11px] font-medium text-tertiary uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={cn("text-2xl font-semibold", color || "text-primary")}>
        {value}
      </p>
      {sub && <p className="text-xs text-tertiary mt-1">{sub}</p>}
    </div>
  );
}

export function AmberStatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-surface-1 p-5">
      <p className="text-[11px] font-medium text-tertiary uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={cn("text-2xl font-semibold", color || "text-primary")}>
        {value}
      </p>
      {sub && <p className="text-xs text-tertiary mt-1">{sub}</p>}
    </div>
  );
}
