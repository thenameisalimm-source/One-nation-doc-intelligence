import { useMemo, useState } from "react";
import Card, { CardHeader } from "../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import BarChart from "../charts/BarChart.jsx";
import FilterBar from "./FilterBar.jsx";
import VideoCard from "./VideoCard.jsx";
import StatTile from "./StatTile.jsx";
import useVideoSave from "../../hooks/useVideoSave.js";
import {
  scoreVideos,
  weightItems,
  WEIGHT_PROFILES,
  median,
  viewsPerSubscriber,
} from "../../utils/opportunityScore.js";
import { formatCount, ageInDays } from "../../utils/formatters.js";

const FILTERS = [
  {
    key: "sort",
    label: "Sort by",
    options: [
      { value: "score", label: "Estimated score" },
      { value: "views", label: "Most views" },
      { value: "newest", label: "Newest" },
      { value: "engagement", label: "Engagement rate" },
    ],
  },
  {
    key: "show",
    label: "Show",
    options: [
      { value: "all", label: "All videos" },
      { value: "outperformers", label: "Views above channel subscribers" },
      { value: "fresh", label: "Published in last 7 days" },
    ],
  },
];

function engagementOf(v) {
  const has = (v.likes !== null && v.likes !== undefined) || (v.comments !== null && v.comments !== undefined);
  if (!has || !v.views) return -1;
  return ((v.likes || 0) + (v.comments || 0)) / v.views;
}

function medianAgeText(videos) {
  const d = median(videos.map((v) => ageInDays(v.publishedAt)));
  if (d === null) return "—";
  if (d < 1) return "Under 1 day";
  const r = Math.round(d);
  return r + (r === 1 ? " day" : " days");
}

function countBy(videos, keyFn) {
  const map = new Map();
  for (const v of videos) {
    const k = keyFn(v);
    if (k) map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// data: response of /api/youtube-search. kind: "trending" | "viral" | "research"
export default function VideoResults({ data, kind = "research" }) {
  const { isSaved, toggle } = useVideoSave();
  const meta = data.meta || {};
  const [filters, setFilters] = useState({
    sort: "score",
    show: kind === "viral" ? "outperformers" : "all",
  });

  const windowDays = Number(meta.days) || 30;

  const scored = useMemo(
    () => scoreVideos(data.videos, { profile: kind, windowDays }),
    [data, kind, windowDays]
  );

  const stats = useMemo(() => {
    const ratios = scored.map((v) => viewsPerSubscriber(v)).filter((r) => r !== null);
    return {
      count: scored.length,
      medianViews: median(scored.map((v) => v.views)),
      medianAge: medianAgeText(scored),
      rated: ratios.length,
      outperformers: ratios.filter((r) => r >= 1).length,
      topChannels: countBy(scored, (v) => v.channelTitle)
        .slice(0, 6)
        .map(([label, value]) => ({ label, value })),
      mostViewed: [...scored]
        .filter((v) => typeof v.views === "number")
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
        .map((v) => ({ label: v.title, value: v.views, display: formatCount(v.views) })),
    };
  }, [scored]);

  const shown = useMemo(() => {
    let list = scored.filter((v) => {
      if (filters.show === "outperformers") return (viewsPerSubscriber(v) ?? 0) >= 1;
      if (filters.show === "fresh") return (ageInDays(v.publishedAt) ?? 999) <= 7;
      return true;
    });
    list = [...list];
    if (filters.sort === "views") list.sort((a, b) => (b.views ?? -1) - (a.views ?? -1));
    else if (filters.sort === "newest") list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    else if (filters.sort === "engagement") list.sort((a, b) => engagementOf(b) - engagementOf(a));
    else list.sort((a, b) => (b.score?.score ?? -1) - (a.score?.score ?? -1));
    return list;
  }, [scored, filters]);

  if (scored.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="No videos found"
        message="YouTube returned no videos for this search. Try a broader keyword, a longer time window, or the other research mode."
      />
    );
  }

  const fetched = meta.fetchedAt
    ? new Date(meta.fetchedAt).toLocaleString("en-IN", {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : "unknown time";
  const profile = WEIGHT_PROFILES[kind] || WEIGHT_PROFILES.research;

  return (
    <div className="stack">
      <p className="meta-line">
        <Badge tone="live">Live data</Badge>{" "}
        {meta.source || "YouTube"} · fetched {fetched} ·{" "}
        {meta.mode === "india" ? "India mode (region bias, not a strict filter)" : "Global mode"} ·
        last {windowDays} days ·{" "}
        {meta.cached
          ? "served from the 15-minute cache, 0 quota units"
          : (meta.quotaUnitsUsed ?? "?") + " quota units used"}
      </p>

      <div className="stat-grid">
        <StatTile label="Videos found" value={stats.count} />
        <StatTile label="Median views" value={formatCount(stats.medianViews)} />
        <StatTile label="Median age" value={stats.medianAge} />
        <StatTile
          label="Beat channel size"
          value={stats.rated > 0 ? stats.outperformers + " of " + stats.rated : "—"}
        />
      </div>

      {kind === "research" && (
        <div className="grid-auto">
          <Card>
            <CardHeader
              title="Who covers this topic"
              subtitle="Channels appearing most often in these results"
            />
            <BarChart items={stats.topChannels} tone="live" />
          </Card>
          <Card>
            <CardHeader title="Most viewed" subtitle="Top 5 by measured views" />
            <BarChart items={stats.mostViewed} tone="ai" />
          </Card>
        </div>
      )}

      <FilterBar filters={FILTERS} values={filters} onChange={setFilters} />

      {shown.length === 0 ? (
        <EmptyState
          icon="search"
          title="No videos match this filter"
          message={
            filters.show === "outperformers"
              ? "None of these videos has more views than its channel has subscribers, or subscriber counts were hidden."
              : "Try a different filter."
          }
          action={
            <Button onClick={() => setFilters({ ...filters, show: "all" })}>Show all videos</Button>
          }
        />
      ) : (
        <div className="video-grid">
          {shown.map((v, i) => (
            <VideoCard key={v.id} video={v} rank={i + 1} saved={isSaved(v)} onSave={toggle} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="How to read this data" />
        <div className="legend">
          <div className="legend-row">
            <Badge tone="live">Measured</Badge>
            <span>Views, likes, comments, dates and subscriber counts come straight from YouTube at the time shown above.</span>
          </div>
          <div className="legend-row">
            <Badge>Calculated</Badge>
            <span>Medians and counts are arithmetic on the measured values.</span>
          </div>
          <div className="legend-row">
            <Badge tone="ai">Estimated</Badge>
            <span>The opportunity score is this app's own formula, not a YouTube number.</span>
          </div>
        </div>

        <details className="explain">
          <summary>How the {profile.label} score is weighted</summary>
          <div className="stack-sm">
            <BarChart items={weightItems(kind)} tone="ai" />
            <p className="faint">
              If a video has no likes or comments, or its channel hides subscribers or has under
              100, that part is left out and the other weights are rescaled. Tap "How is this
              calculated?" on any video to see its own numbers.
            </p>
            <p className="faint">
              This is one snapshot, not real-time view velocity. True velocity needs the same video
              measured repeatedly over time, which this app does not store yet.
            </p>
          </div>
        </details>
      </Card>
    </div>
  );
      }
