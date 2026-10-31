import { Link } from "react-router-dom";
import { useStatus } from "../../hooks/useStatus.jsx";
import Icon from "../ui/Icon.jsx";

export default function DemoBanner() {
  const { loading, error, data, refresh } = useStatus();

  if (loading) return null;

  if (error) {
    return (
      <div className="banner banner-warn" role="status">
        <Icon name="alert" size={18} />
        <div className="banner-text">
          <strong>Backend not reachable.</strong> {error} Live research and AI are
          unavailable until the backend responds.
        </div>
        <button className="banner-btn" onClick={refresh}>Retry</button>
      </div>
    );
  }

  const missing = [];
  if (!data?.youtube) missing.push("YouTube API key");
  if (!data?.anthropic) missing.push("Anthropic API key");

  if (missing.length === 0) return null;

  return (
    <div className="banner banner-demo" role="status">
      <Icon name="alert" size={18} />
      <div className="banner-text">
        <strong>DEMO MODE.</strong> Missing: {missing.join(" and ")}. Features that need
        them are disabled, and any sample content is labeled.
      </div>
      <Link className="banner-btn" to="/settings">Settings</Link>
    </div>
  );
}
