// Draws a trend from REAL stored observations only.
// With fewer than 2 points it says so instead of drawing anything.
export default function Sparkline({ values, height = 48 }) {
  const clean = Array.isArray(values) ? values.filter((v) => typeof v === "number" && !Number.isNaN(v)) : [];

  if (clean.length < 2) {
    return <p className="faint">Not enough stored observations to draw a trend yet.</p>;
  }

  const W = 200;
  const H = height;
  const pad = 3;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  const points = clean.map((v, i) => {
    const x = pad + (i / (clean.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / span) * (H - pad * 2);
    return x.toFixed(1) + "," + y.toFixed(1);
  });

  return (
    <svg
      className="sparkline"
      viewBox={"0 0 " + W + " " + H}
      preserveAspectRatio="none"
      style={{ width: "100%", height }}
      role="img"
      aria-label="Trend line"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--teal-400)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
