/* SVG donut showing 0–100 % health, color-thresholded:
   ≥80 run-green, ≥50 wait-amber, else stop-red. null → em dash. */
const ringColor = (v) =>
  v == null ? "var(--color-status-nodata)"
  : v >= 80 ? "var(--color-status-run)"
  : v >= 50 ? "var(--color-status-wait)"
  : "var(--color-status-stop)";

export default function HealthRing({ value, size = 30, strokeWidth = 3, fontSize = 10 }) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value));
  const color = ringColor(value);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem` }}
      className="shrink-0 -rotate-90"
      role="img"
      aria-label={value == null ? "No health data" : `Health ${Math.round(value)}%`}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border-line)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        style={{ transition: "stroke-dashoffset .6s ease, stroke .6s ease" }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle" dominantBaseline="central"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        fill={color}
        style={{ fontSize, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
      >
        {value == null ? "—" : Math.round(value)}
      </text>
    </svg>
  );
}
