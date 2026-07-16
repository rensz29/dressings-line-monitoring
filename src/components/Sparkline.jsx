/* Inline SVG sparkline — no chart library. Values are normalized to their
   own min/max so the shape reads at tiny sizes. */
export default function Sparkline({ points, width = 60, height = 20, stroke = "var(--color-accent-cyan)", fill = true }) {
  if (!points || points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 2;
  const xy = points.map((v, i) => [
    pad + (i * (width - pad * 2)) / (points.length - 1),
    height - pad - ((v - min) / span) * (height - pad * 2),
  ]);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: `${width / 16}rem`, height: `${height / 16}rem` }}
      className="shrink-0"
      aria-hidden
    >
      {fill && (
        <polygon
          points={`${pad},${height - pad} ${line} ${width - pad},${height - pad}`}
          fill={stroke}
          opacity="0.1"
        />
      )}
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        opacity="0.85"
      />
    </svg>
  );
}
