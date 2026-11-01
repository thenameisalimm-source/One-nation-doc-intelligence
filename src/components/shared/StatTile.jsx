import Card from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";

// kind: "measured" (straight from YouTube) | "calculated" (arithmetic on measured values)
export default function StatTile({ label, value, kind = "calculated" }) {
  return (
    <Card className="stat stat-sm">
      <div className="faint">{label}</div>
      <div className="stat-value">{value}</div>
      {kind === "measured" ? (
        <Badge tone="live" title="Read directly from the YouTube API">Measured</Badge>
      ) : (
        <Badge title="Calculated by this app from measured values">Calculated</Badge>
      )}
    </Card>
  );
}
