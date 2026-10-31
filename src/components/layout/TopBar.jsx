import { useLocation } from "react-router-dom";
import { findRoute } from "../../routes.jsx";
import { useStatus } from "../../hooks/useStatus.jsx";

function StatusPill() {
  const { loading, error, data } = useStatus();

  if (loading) return <span className="pill pill-muted">Checking…</span>;
  if (error) return <span className="pill pill-warn">Backend offline</span>;

  const youtubeOn = Boolean(data?.youtube);
  const aiOn = Boolean(data?.anthropic);

  if (youtubeOn && aiOn) {
    return (
      <span className="pill pill-live">
        <span className="live-dot" /> Live
      </span>
    );
  }
  return <span className="pill pill-warn">Demo mode</span>;
}

export default function TopBar() {
  const { pathname } = useLocation();
  const route = findRoute(pathname);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand-mark brand-mark-sm">ON</div>
        <div className="topbar-title truncate">{route ? route.label : "Not found"}</div>
      </div>
      <StatusPill />
    </header>
  );
}
