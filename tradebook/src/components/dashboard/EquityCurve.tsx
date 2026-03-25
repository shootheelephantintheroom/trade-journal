export default function EquityCurve({
  points,
  drawdownRegion,
}: {
  points: { date: string; value: number }[];
  drawdownRegion?: { peakIdx: number; troughIdx: number };
}) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const minVal = Math.min(0, ...values);
  const maxVal = Math.max(0, ...values);
  const range = maxVal - minVal || 1;

  const W = 520;
  const H = 200;
  const pad = { t: 10, b: 25, l: 45, r: 10 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const coords = points.map((p, i) => ({
    x: pad.l + (i / (points.length - 1)) * cW,
    y: pad.t + cH - ((p.value - minVal) / range) * cH,
  }));

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const last = coords[coords.length - 1];

  const areaPath =
    `M${coords[0].x},${coords[0].y} ` +
    coords
      .slice(1)
      .map((c) => `L${c.x},${c.y}`)
      .join(" ") +
    ` L${last.x},${pad.t + cH} L${coords[0].x},${pad.t + cH} Z`;

  const zeroY = pad.t + cH - ((0 - minVal) / range) * cH;

  const gridLines = [0.25, 0.5, 0.75].map((f) => ({
    y: pad.t + cH * (1 - f),
    val: minVal + range * f,
  }));

  const fmtDollar = (v: number) =>
    Math.abs(v) >= 1000
      ? `$${(v / 1000).toFixed(1)}k`
      : `$${v.toFixed(0)}`;

  const lineColor =
    points[points.length - 1].value >= 0 ? "#22c55e" : "#ef4444";

  const firstDateIdx = points.findIndex((p) => p.date);
  const lastDateIdx = points.length - 1;

  let lineLength = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i].x - coords[i - 1].x;
    const dy = coords[i].y - coords[i - 1].y;
    lineLength += Math.sqrt(dx * dx + dy * dy);
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ height: 200, ["--line-length" as string]: Math.ceil(lineLength) }}
    >
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={pad.l}
            y1={g.y}
            x2={W - pad.r}
            y2={g.y}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
          <text
            x={pad.l - 4}
            y={g.y + 3}
            fill="#52525b"
            fontSize="9"
            textAnchor="end"
          >
            {fmtDollar(g.val)}
          </text>
        </g>
      ))}
      <line
        x1={pad.l}
        y1={zeroY}
        x2={W - pad.r}
        y2={zeroY}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      <text
        x={pad.l - 4}
        y={zeroY + 3}
        fill="#52525b"
        fontSize="9"
        textAnchor="end"
      >
        $0
      </text>
      <path d={areaPath} fill="url(#eqGrad)" className="equity-area" />
      {drawdownRegion &&
        drawdownRegion.peakIdx < drawdownRegion.troughIdx &&
        (() => {
          const { peakIdx, troughIdx } = drawdownRegion;
          const peakY = coords[peakIdx].y;
          const region = coords.slice(peakIdx, troughIdx + 1);
          const ddPath =
            `M${region[0].x},${peakY} ` +
            `L${region[region.length - 1].x},${peakY} ` +
            [...region]
              .reverse()
              .map((c) => `L${c.x},${c.y}`)
              .join(" ") +
            " Z";
          return <path d={ddPath} fill="rgba(239, 68, 68, 0.1)" />;
        })()}
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="equity-line"
      />
      <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
      <circle
        cx={last.x}
        cy={last.y}
        r="7"
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        opacity="0.35"
      />
      {firstDateIdx >= 0 && (
        <text
          x={coords[firstDateIdx].x}
          y={H - 4}
          fill="#52525b"
          fontSize="9"
          textAnchor="start"
        >
          {points[firstDateIdx].date}
        </text>
      )}
      {lastDateIdx !== firstDateIdx && (
        <text
          x={last.x}
          y={H - 4}
          fill="#52525b"
          fontSize="9"
          textAnchor="end"
        >
          {points[lastDateIdx].date}
        </text>
      )}
    </svg>
  );
}
