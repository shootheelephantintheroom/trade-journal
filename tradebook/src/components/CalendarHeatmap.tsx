interface DayData {
  date: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

const CELL = 12;
const GAP = 2;
const STEP = CELL + GAP;
const WEEKS = 13;
const LABEL_LEFT = 20;
const LABEL_TOP = 16;

export default function CalendarHeatmap({
  dailyStats,
}: {
  dailyStats: DayData[];
}) {
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

  function cellColor(dateStr: string): string {
    const s = statsMap.get(dateStr);
    if (!s || s.trades === 0) return "#18181b"; // surface-2
    const t = Math.min(Math.abs(s.pnl) / maxAbs, 1);
    const opacity = 0.15 + t * 0.45;
    return s.pnl >= 0
      ? `rgba(34,197,94,${opacity})`  // profit
      : `rgba(239,68,68,${opacity})`; // loss
  }

  function tooltip(dateStr: string): string {
    const s = statsMap.get(dateStr);
    if (!s || s.trades === 0) return `${dateStr}: No trades`;
    const sign = s.pnl >= 0 ? "+" : "";
    return `${dateStr}: ${sign}$${s.pnl.toFixed(2)} (${s.trades} trade${s.trades !== 1 ? "s" : ""})`;
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
    { label: "M", row: 0 },
    { label: "W", row: 2 },
    { label: "F", row: 4 },
  ];

  const svgW = LABEL_LEFT + WEEKS * STEP;
  const svgH = LABEL_TOP + 7 * STEP;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="w-full"
      style={{ maxWidth: svgW, height: svgH }}
    >
      {monthLabels.map((m, i) => (
        <text
          key={i}
          x={LABEL_LEFT + m.col * STEP + CELL / 2}
          y={10}
          fill="#52525b"
          fontSize="9"
          textAnchor="middle"
        >
          {m.label}
        </text>
      ))}

      {dayLabels.map((d) => (
        <text
          key={d.label}
          x={LABEL_LEFT - 5}
          y={LABEL_TOP + d.row * STEP + CELL / 2 + 3}
          fill="#52525b"
          fontSize="9"
          textAnchor="end"
        >
          {d.label}
        </text>
      ))}

      {days.map((d) => (
        <rect
          key={d.dateStr}
          x={LABEL_LEFT + d.col * STEP}
          y={LABEL_TOP + d.row * STEP}
          width={CELL}
          height={CELL}
          rx={2}
          fill={cellColor(d.dateStr)}
        >
          <title>{tooltip(d.dateStr)}</title>
        </rect>
      ))}
    </svg>
  );
}
