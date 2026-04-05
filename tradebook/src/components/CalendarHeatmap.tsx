import { useState } from "react";

interface DayData {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

const CELL = 14;
const GAP = 3;
const STEP = CELL + GAP;
const WEEKS = 18;
const LABEL_LEFT = 32;
const LABEL_TOP = 28;

export default function CalendarHeatmap({
  dailyStats,
}: {
  dailyStats: DayData[];
}) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const statsMap = new Map<string, DayData>();
  for (const d of dailyStats) {
    statsMap.set(d.date, d);
  }

  const today = new Date();
  const todayDow = today.getDay();
  const todayMon = todayDow === 0 ? 6 : todayDow - 1;

  const lastWeekMon = new Date(today);
  lastWeekMon.setDate(today.getDate() - todayMon);

  const startDate = new Date(lastWeekMon);
  startDate.setDate(lastWeekMon.getDate() - (WEEKS - 1) * 7);

  const days: { dateStr: string; month: number; col: number; row: number }[] =
    [];
  const cursor = new Date(startDate);
  for (let col = 0; col < WEEKS; col++) {
    for (let row = 0; row < 7; row++) {
      if (cursor <= today) {
        const dateStr = cursor.toLocaleDateString("en-CA");
        days.push({ dateStr, month: cursor.getMonth(), col, row });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const absPnls = dailyStats.map((d) => Math.abs(d.pnl)).filter((v) => v > 0);
  const maxAbs = absPnls.length > 0 ? Math.max(...absPnls) : 1;

  // Summary counts
  const greenDays = dailyStats.filter((d) => d.pnl > 0).length;
  const redDays = dailyStats.filter((d) => d.pnl < 0).length;

  function cellColor(dateStr: string): string {
    const s = statsMap.get(dateStr);
    if (!s || s.trades === 0) return "rgba(255,255,255,0.03)";
    const t = Math.min(Math.abs(s.pnl) / maxAbs, 1);
    const opacity = 0.15 + t * 0.45;
    return s.pnl >= 0
      ? `rgba(34,197,94,${opacity})`
      : `rgba(239,68,68,${opacity})`;
  }

  // Top labels: "Jan 6", "20", "Feb 3", "17", ... — show month name at month
  // boundaries, day-of-month every other week otherwise
  const topLabels: { label: string; col: number }[] = [];
  let prevMonth = -1;
  for (const d of days) {
    if (d.row !== 0) continue;
    const dt = new Date(d.dateStr + "T00:00");
    const dayNum = dt.getDate();
    if (d.month !== prevMonth) {
      topLabels.push({
        label: `${dt.toLocaleString("default", { month: "short" })} ${dayNum}`,
        col: d.col,
      });
      prevMonth = d.month;
    } else if (d.col % 2 === 0) {
      topLabels.push({ label: String(dayNum), col: d.col });
    }
  }

  const dayLabels: { label: string; row: number }[] = [
    { label: "Mon", row: 0 },
    { label: "Tue", row: 1 },
    { label: "Wed", row: 2 },
    { label: "Thu", row: 3 },
    { label: "Fri", row: 4 },
    { label: "Sat", row: 5 },
    { label: "Sun", row: 6 },
  ];

  const svgW = LABEL_LEFT + WEEKS * STEP;
  const svgH = LABEL_TOP + 7 * STEP;

  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] font-medium text-secondary">Activity</span>
          <span className="text-[12px] text-tertiary">
            {WEEKS} weeks
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-profit/40" />
            <span className="text-tertiary">{greenDays} green</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-loss/40" />
            <span className="text-tertiary">{redDays} red</span>
          </span>
        </div>
      </div>

      {/* Grid */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full"
        style={{ maxWidth: svgW, height: svgH }}
      >
        {topLabels.map((m, i) => (
          <text
            key={i}
            x={LABEL_LEFT + m.col * STEP + CELL / 2}
            y={10}
            fill={m.label.length > 2 ? "#a1a1aa" : "#52525b"}
            fontSize="10"
            fontWeight={m.label.length > 2 ? 500 : 400}
            textAnchor="middle"
          >
            {m.label}
          </text>
        ))}

        {/* Separator line between labels and grid */}
        <line
          x1={LABEL_LEFT}
          y1={LABEL_TOP - 6}
          x2={LABEL_LEFT + WEEKS * STEP - GAP}
          y2={LABEL_TOP - 6}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />

        {dayLabels.map((d) => (
          <text
            key={d.label}
            x={LABEL_LEFT - 6}
            y={LABEL_TOP + d.row * STEP + CELL / 2 + 3.5}
            fill={d.row === 5 || d.row === 6 ? "#3f3f46" : "#52525b"}
            fontSize="10"
            textAnchor="end"
          >
            {d.label}
          </text>
        ))}

        {days.map((d) => {
          const stats = statsMap.get(d.dateStr);
          const isHovered = hoveredDay?.date === d.dateStr;
          return (
            <rect
              key={d.dateStr}
              x={LABEL_LEFT + d.col * STEP}
              y={LABEL_TOP + d.row * STEP}
              width={CELL}
              height={CELL}
              rx={3}
              fill={cellColor(d.dateStr)}
              stroke={isHovered ? "rgba(255,255,255,0.3)" : "transparent"}
              strokeWidth={1}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => stats && stats.trades > 0 ? setHoveredDay(stats) : setHoveredDay(null)}
              onMouseLeave={() => setHoveredDay(null)}
            />
          );
        })}
      </svg>

      {/* Hover detail bar */}
      <div className="mt-3 flex items-center justify-between h-5 text-[12px]">
        {hoveredDay ? (
          <>
            <span className="text-tertiary">{hoveredDay.date}</span>
            <div className="flex items-center gap-4">
              <span className="text-tertiary">
                {hoveredDay.trades} trade{hoveredDay.trades !== 1 ? "s" : ""}
              </span>
              <span className="text-tertiary">
                <span className="text-profit font-medium">{hoveredDay.wins}W</span>
                {" / "}
                <span className="text-loss font-medium">{hoveredDay.losses}L</span>
              </span>
              <span
                className={`font-medium font-mono ${hoveredDay.pnl >= 0 ? "text-profit" : "text-loss"}`}
              >
                {hoveredDay.pnl >= 0 ? "+" : ""}${hoveredDay.pnl.toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <span className="text-zinc-600 text-[11px]">Hover a day for details</span>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-zinc-600">
        <span>Loss</span>
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(239,68,68,0.15)" }} />
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(239,68,68,0.35)" }} />
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255,255,255,0.03)" }} />
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(34,197,94,0.35)" }} />
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(34,197,94,0.55)" }} />
        <span>Profit</span>
      </div>
    </div>
  );
}
