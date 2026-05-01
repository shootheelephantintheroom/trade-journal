import { useEffect, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const LINE_COLOR = "#3b82f6";

const fmtDollar = (v: number) =>
  Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`;

export default function EquityCurve({
  points,
}: {
  points: { date: string; value: number }[];
  drawdownRegion?: { peakIdx: number; troughIdx: number };
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activePoint, setActivePoint] = useState<
    { date: string; value: number } | null
  >(null);

  // Animate the stroke line drawing from left to right on mount
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // recharts renders the Area stroke as the first <path> inside .recharts-area-curve
    const curvePath = el.querySelector<SVGPathElement>(
      ".recharts-area-curve path"
    );
    if (!curvePath) return;

    const length = curvePath.getTotalLength();
    curvePath.style.strokeDasharray = `${length}`;
    curvePath.style.strokeDashoffset = `${length}`;
    // force reflow
    curvePath.getBoundingClientRect();
    curvePath.style.transition =
      "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
    curvePath.style.strokeDashoffset = "0";

    // Fade in the area fill
    const areaPath = el.querySelector<SVGPathElement>(
      ".recharts-area-area path"
    );
    if (areaPath) {
      areaPath.style.opacity = "0";
      areaPath.style.transition =
        "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s";
      // force reflow
      areaPath.getBoundingClientRect();
      areaPath.style.opacity = "1";
    }
  }, [points]);

  if (points.length < 2) return null;

  return (
    <div ref={wrapperRef}>
      {/* Value readout — desktop hover + mobile touch */}
      <div className="flex items-center justify-between h-5 text-[12px] mb-1 px-1">
        {activePoint ? (
          <>
            <span className="text-tertiary">{activePoint.date}</span>
            <span
              className={`font-medium font-mono ${activePoint.value >= 0 ? "text-profit" : "text-loss"}`}
            >
              {activePoint.value >= 0 ? "+" : ""}
              {fmtDollar(activePoint.value)}
            </span>
          </>
        ) : (
          <span className="text-zinc-600 text-[11px]">
            Tap or hover the chart for value
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
          onMouseMove={(state: any) => {
            const i = state?.activeTooltipIndex;
            if (typeof i === "number" && points[i]) setActivePoint(points[i]);
          }}
          onMouseLeave={() => setActivePoint(null)}
        >
          <defs>
            <linearGradient id="eqGradRc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.15)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
          </defs>

          <CartesianGrid
            horizontal
            vertical={false}
            stroke="rgba(255,255,255,0.04)"
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#71717a",
              fontSize: 11,
              fontFamily: "'Geist Mono', ui-monospace, monospace",
            }}
            interval="preserveStartEnd"
            minTickGap={60}
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtDollar}
            tick={{
              fill: "#71717a",
              fontSize: 11,
              fontFamily: "'Geist Mono', ui-monospace, monospace",
            }}
            width={48}
          />

          <Tooltip
            content={() => null}
            cursor={{
              stroke: "rgba(255,255,255,0.2)",
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={LINE_COLOR}
            strokeWidth={2}
            fill="url(#eqGradRc)"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
