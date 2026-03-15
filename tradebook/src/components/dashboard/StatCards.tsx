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
  const accentClass =
    accent === "green"
      ? "stat-card-green"
      : accent === "red"
        ? "stat-card-red"
        : "stat-card-neutral";

  return (
    <div
      className={`stat-card ${accentClass} rounded-xl border border-gray-800/80 bg-gray-900/60 p-5`}
    >
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-bold font-display ${color || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
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
    <div className="stat-card stat-card-yellow rounded-xl border border-yellow-500/15 bg-gray-900/60 p-5">
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-bold font-display ${color || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
