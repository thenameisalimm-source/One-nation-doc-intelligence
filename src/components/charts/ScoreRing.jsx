function colorFor(score) {
  if (score >= 70) return "var(--teal-400)";
  if (score >= 40) return "var(--purple-400)";
  return "var(--warn)";
}

// Shows an ESTIMATED score from 0 to 100.
export default function ScoreRing({ score, size = 64, label = "Est." }) {
  const valid = typeof score === "number" && !Number.isNaN(score);
  const value = valid ? Math.max(0, Math.min(100, score)) : 0;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="score-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={valid ? "Estimated opportunity score " + Math.round(value) + " out of 100" : "No score"}
    >
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={stroke} />
        {valid && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colorFor(value)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value / 100)}
            transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
          />
        )}
      </svg>
      <div className="score-ring-text">
        <strong>{valid ? Math.round(value) : "—"}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
