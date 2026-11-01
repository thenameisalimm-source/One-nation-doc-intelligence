import { useMemo } from "react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import StatTile from "./StatTile.jsx";
import VideoCard from "./VideoCard.jsx";
import { useToast } from "../ui/Toast.jsx";
import useSavedIdeas from "../../hooks/useSavedIdeas.js";
import useVideoSave from "../../hooks/useVideoSave.js";
import { scoreVideos, median } from "../../utils/opportunityScore.js";
import { formatCount, formatDate } from "../../utils/formatters.js";

function uploadsPerMonth(videos) {
  const times = videos
    .map((v) => new Date(v.publishedAt).getTime())
    .filter((t) => Number.isFinite(t))
    .sort((a, b) => a - b);
  if (times.length < 3) return null;
  const spanDays = (times[times.length - 1] - times[0]) / 86400000;
  if (spanDays < 1) return null;
  return ((times.length - 1) / spanDays) * 30;
}

// data: response of /api/youtube-channel. kind: "competitor" | "analytics"
export default function ChannelResults({ data, kind = "analytics" }) {
  const ch = data.channel;
  const meta = data.meta || {};
  const toast = useToast();
  const saved = useSavedIdeas();
  const { isSaved, toggle } = useVideoSave();

  const videos = useMemo(() => (Array.isArray(data.videos) ? data.videos : []), [data]);
  const scored = useMemo(
    () => scoreVideos(videos, { profile: "research", windowDays: 365 }),
    [videos]
  );

  const viewsList = videos.map((v) => v.views).filter((n) => typeof n === "number");
  const medianViews = median(viewsList);
  const avgRecent = viewsList.length
    ? Math.round(viewsList.reduce((a, b) => a + b, 0) / viewsList.length)
    : null;
  const avgLifetime =
    typeof ch.totalViews === "number" && typeof ch.videoCount === "number" && ch.videoCount > 0
      ? Math.round(ch.totalViews / ch.videoCount)
      : null;
  const perMonth = uploadsPerMonth(videos);

  const standouts =
    medianViews && medianViews > 0
      ? videos
          .filter((v) => typeof v.views === "number")
          .map((v) => ({ v, mult: v.views / medianViews }))
          .filter((x) => x.mult >= 1.5)
          .sort((a, b) => b.mult - a.mult)
          .slice(0, 3)
      : [];

  const channelUrl = "https://www.youtube.com/channel/" + encodeURIComponent(ch.id);
  const channelSaveId = "channel:" + ch.id;
  const channelSaved = saved.has(channelSaveId);

  function toggleChannel() {
    if (channelSaved) {
      saved.remove(channelSaveId);
      toast("Removed from saved.");
      return;
    }
    const subs = ch.subscribersHidden
      ? "subscribers hidden"
      : formatCount(ch.subscribers) + " subscribers";
    const ok = saved.add({
      id: channelSaveId,
      type: "note",
      title: "Channel: " + ch.title,
      body: subs + " · " + formatCount(ch.videoCount) + " videos",
      url: channelUrl,
    });
    toast(ok ? "Saved on this device." : "Could not save. Browser storage may be blocked.", ok ? "ok" : "danger");
  }

  const fetched = meta.fetchedAt
    ? new Date(meta.fetchedAt).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : "unknown time";

  return (
    <div className="stack">
      <p className="meta-line">
        <Badge tone="live">Live data</Badge> {meta.source || "YouTube"} · fetched {fetched} ·{" "}
        {meta.cached
          ? "served from the 30-minute cache, 0 quota units"
          : (meta.quotaUnitsUsed ?? "?") + " quota units used"}
      </p>

      <Card glow>
        <div className="channel-head">
          {ch.thumbnail ? (
            <img className="channel-avatar" src={ch.thumbnail} alt="" loading="lazy" />
          ) : (
            <div className="channel-avatar" />
          )}
          <div className="channel-head-text">
            <h2>{ch.title}</h2>
            {ch.handle && <span className="faint truncate">{ch.handle}</span>}
            {ch.description && <p className="muted note-body">{ch.description}</p>}
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <a className="btn btn-secondary" href={channelUrl} target="_blank" rel="noopener noreferrer">
            Open on YouTube
          </a>
          <Button variant={channelSaved ? "ghost" : "secondary"} onClick={toggleChannel}>
            {channelSaved ? "Saved ✓" : "Save channel"}
          </Button>
        </div>
      </Card>

      <div className="stat-grid">
        <StatTile
          label="Subscribers"
          value={ch.subscribersHidden ? "Hidden" : formatCount(ch.subscribers)}
          kind="measured"
        />
        <StatTile label="Total views" value={formatCount(ch.totalViews)} kind="measured" />
        <StatTile label="Videos" value={formatCount(ch.videoCount)} kind="measured" />
        <StatTile label="Started" value={ch.createdAt ? formatDate(ch.createdAt) : "—"} kind="measured" />
        <StatTile label="Avg views per video (lifetime)" value={formatCount(avgLifetime)} />
        <StatTile label={"Avg views (last " + viewsList.length + " uploads)"} value={formatCount(avgRecent)} />
        <StatTile label="Median views (recent)" value={formatCount(medianViews)} />
        <StatTile label="Uploads per month (recent)" value={perMonth === null ? "—" : perMonth.toFixed(1)} />
      </div>

      {kind === "competitor" && (
        <Card>
          <CardHeader
            title="Standout recent videos"
            subtitle="Videos with at least 1.5x this channel's recent median views (calculated)"
          />
          {standouts.length === 0 ? (
            <p className="muted">
              No recent upload reached 1.5x the median, so no single video stands out in this sample.
            </p>
          ) : (
            <div className="stack-sm">
              {standouts.map(({ v, mult }) => (
                <div key={v.id} className="standout">
                  <a
                    href={"https://www.youtube.com/watch?v=" + encodeURIComponent(v.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {v.title}
                  </a>
                  <span className="faint">
                    {formatCount(v.views)} views · {mult.toFixed(1)}x the recent median
                  </span>
                </div>
              ))}
            </div>
          )}
          <p className="faint" style={{ marginTop: 8 }}>
            Newer videos have had less time to collect views, so this comparison favours older uploads.
          </p>
        </Card>
      )}

      {kind === "analytics" && (
        <Card>
          <CardHeader title="What public data cannot show" />
          <ul className="plain-list muted">
            <li>Watch time and average view duration</li>
            <li>Revenue and RPM</li>
            <li>Click-through rate and impressions</li>
            <li>Audience demographics and traffic sources</li>
          </ul>
          <p className="faint" style={{ marginTop: 8 }}>
            {meta.note || "Public data only."} Those numbers are visible only to the channel owner in YouTube Studio.
          </p>
        </Card>
      )}

      <div>
        <h2 className="section-title">Recent uploads ({scored.length})</h2>
        {scored.length === 0 ? (
          <EmptyState
            icon="film"
            title="No public uploads found"
            message="This channel has no public videos available through the API."
          />
        ) : (
          <>
            <p className="faint" style={{ marginBottom: 12 }}>
              Estimated scores here compare each video with this channel's own subscriber count and
              use a 365-day freshness window.
            </p>
            <div className="video-grid">
              {scored.map((v) => (
                <VideoCard key={v.id} video={v} saved={isSaved(v)} onSave={toggle} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
