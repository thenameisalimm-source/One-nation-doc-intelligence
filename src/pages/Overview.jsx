import { Link } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Icon from "../components/ui/Icon.jsx";
import BarChart from "../components/charts/BarChart.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useStatus } from "../hooks/useStatus.jsx";
import useSavedIdeas from "../hooks/useSavedIdeas.js";
import useHistory from "../hooks/useHistory.js";
import { ROUTES } from "../routes.jsx";
import { timeAgo } from "../utils/formatters.js";

function StatusStat({ label, loading, error, on }) {
  let badge = <Badge tone="warn">Missing</Badge>;
  if (loading) badge = <Badge>Checking</Badge>;
  else if (error) badge = <Badge tone="danger">Offline</Badge>;
  else if (on) badge = <Badge tone="live">Connected</Badge>;
  return (
    <Card className="stat">
      <div className="faint">{label}</div>
      {badge}
    </Card>
  );
}

export default function Overview() {
  const { loading, error, data } = useStatus();
  const { items: ideas } = useSavedIdeas();
  const { items: history } = useHistory();

  const byType = Object.entries(
    history.reduce((acc, h) => {
      acc[h.type] = (acc[h.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([label, value]) => ({ label, value }));

  const recent = history.slice(0, 5);
  const modules = ROUTES.filter((r) => r.path !== "/");

  return (
    <div className="stack">
      <PageHeader
        title="Overview"
        blurb="Your documentary research at a glance. Everything here is real stored data, never sample data."
      />

      <div className="stat-grid">
        <StatusStat label="YouTube research" loading={loading} error={error} on={data?.youtube} />
        <StatusStat label="AI generation" loading={loading} error={error} on={data?.anthropic} />
        <Card className="stat">
          <div className="faint">Saved ideas</div>
          <div className="stat-value">{ideas.length}</div>
        </Card>
        <Card className="stat">
          <div className="faint">Research runs</div>
          <div className="stat-value">{history.length}</div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Research by module" subtitle="Counted from your saved history" />
        {byType.length > 0 ? (
          <BarChart items={byType} tone="live" />
        ) : (
          <EmptyState
            icon="chart"
            title="No research yet"
            message="Charts appear here after you run research. Live YouTube research connects in Phase 3."
          />
        )}
      </Card>

      <Card>
        <CardHeader
          title="Recent research"
          action={history.length > 0 ? <Link to="/history" className="text-btn">View all</Link> : null}
        />
        {recent.length === 0 ? (
          <p className="muted">Nothing yet.</p>
        ) : (
          <div className="stack-sm">
            {recent.map((h) => (
              <div key={h.id} className="list-line">
                <Badge tone="ai">{h.type}</Badge>
                <span className="truncate">{h.query}</span>
                <span className="faint">{timeAgo(h.at)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div>
        <h2 className="section-title">All modules</h2>
        <div className="quick-grid">
          {modules.map((r) => (
            <Link key={r.path} to={r.path} className="quick-item">
              <Icon name={r.icon} size={22} />
              <div className="quick-text">
                <strong>{r.label}</strong>
                <span className="faint">{r.blurb}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
