const POINTS = 60;

export default function Sparkline({ values = [], color = "var(--accent)", height = 32 }) {
  if (values.length < 2) return <svg width="100%" height={height} />;

  const w = 100;
  const max = Math.max(...values, 1);
  const step = w / (POINTS - 1);

  const pts = values.map((v, i) => {
    const x = ((POINTS - values.length + i) * step).toFixed(1);
    const y = (height - (v / max) * (height - 2) - 1).toFixed(1);
    return `${x},${y}`;
  });

  const polyPts = pts.join(" ");
  const fillPts = `${pts[0].split(",")[0]},${height} ${polyPts} ${pts[pts.length - 1].split(",")[0]},${height}`;
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, "")}-${height}`;

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill={`url(#${gradId})`} />
      <polyline
        points={polyPts}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
