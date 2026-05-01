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
const LABEL_LEFT = 30;
const LABEL_TOP = 18;

export default function CalendarHeatmap({
  dailyStats,
}: {
  dailyStats: DayData[];
}) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const activeDay = selectedDay ?? hoveredDay;

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

  const monthLabels: { label: string; col: number }[] = [];
  let prevMonth = -1;
  for (const d of days) {
    if (d.row === 0 && d.month !== prevMonth) {
      const dt = new Date(d.dateStr + "T00:00");
      monthLabels.push({
        label: dt.toLocaleString("default", { month: "short" }),
        col: d.col,
      });
      prevMonth = d.month;
    }
  }

  const dayLabels: { label: string; row: number }[] = [
    { label: "Mon", row: 0 },
    { label: "Wed", row: 2 },
    { label: "Fri", row: 4 },
  ];

  const svgW = LABEL_LEFT + WEEKS * STEP;
  const svgH = LABEL_TOP + 7 * STEP;

  return (
    <div
      className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4"
      onClick={() => setSelectedDay(null)}
    >
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
        {monthLabels.map((m, i) => (
          <text
            key={i}
            x={LABEL_LEFT + m.col * STEP}
            y={11}
            fill="#a1a1aa"
            fontSize="10"
            fontWeight={500}
            textAnchor="start"
          >
            {m.label}
          </text>
        ))}

        {dayLabels.map((d) => (
          <text
            key={d.label}
            x={LABEL_LEFT - 6}
            y={LABEL_TOP + d.row * STEP + CELL / 2 + 3.5}
            fill="#52525b"
            fontSize="10"
            textAnchor="end"
          >
            {d.label}
          </text>
        ))}

        {days.map((d) => {
          const stats = statsMap.get(d.dateStr);
          const isActive = activeDay?.date === d.dateStr;
          return (
            <rect
              key={d.dateStr}
              x={LABEL_LEFT + d.col * STEP}
              y={LABEL_TOP + d.row * STEP}
              width={CELL}
              height={CELL}
              rx={3}
              fill={cellColor(d.dateStr)}
              stroke={isActive ? "rgba(255,255,255,0.3)" : "transparent"}
              strokeWidth={1}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => stats && stats.trades > 0 ? setHoveredDay(stats) : setHoveredDay(null)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (!stats || stats.trades === 0) {
                  setSelectedDay(null);
                  return;
                }
                setSelectedDay((prev) => (prev?.date === stats.date ? null : stats));
              }}
            />
          );
        })}
      </svg>

      {/* Hover detail bar */}
      <div className="mt-3 flex items-center justify-between h-5 text-[12px]">
        {activeDay ? (
          <>
            <span className="text-tertiary">{activeDay.date}</span>
            <div className="flex items-center gap-4">
              <span className="text-tertiary">
                {activeDay.trades} trade{activeDay.trades !== 1 ? "s" : ""}
              </span>
              <span className="text-tertiary">
                <span className="text-profit font-medium">{activeDay.wins}W</span>
                {" / "}
                <span className="text-loss font-medium">{activeDay.losses}L</span>
              </span>
              <span
                className={`font-medium font-mono ${activeDay.pnl >= 0 ? "text-profit" : "text-loss"}`}
              >
                {activeDay.pnl >= 0 ? "+" : ""}${activeDay.pnl.toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <span className="text-zinc-600 text-[11px]">Tap or hover a day for details</span>
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
