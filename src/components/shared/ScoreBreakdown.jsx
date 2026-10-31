// Expected shape (produced by src/utils/opportunityScore.js in Phase 3):
// { score: number, components: [{ label, value (0-100), weight (0-1), detail }] }
export default function ScoreBreakdown({ score }) {
  if (!score || !Array.isArray(score.components)) return null;

  return (
    <div className="score-breakdown">
      <p className="faint">
        Estimated score, not a measured statistic. It is calculated from public data using
        the weights below. It is not real-time view velocity.
      </p>
      {score.components.map((c) => (
        <div key={c.label} className="sb-row">
          <div className="row-between">
            <span>{c.label}</span>
            <span className="faint">
              {Math.round(c.value)}/100 · weight {Math.round(c.weight * 100)}%
            </span>
          </div>
          <div className="bar-track">
            <div className="bar-fill bar-ai" style={{ width: Math.max(2, c.value) + "%" }} />
          </div>
          {c.detail && <div className="faint">{c.detail}</div>}
        </div>
      ))}
    </div>
  );
}
