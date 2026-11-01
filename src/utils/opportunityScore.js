import { ageInDays, formatCount } from "./formatters.js";

// ESTIMATED opportunity score. Everything here is calculated by this app from a
// single snapshot of public YouTube data. It is not measured by YouTube and it is
// not real-time view velocity.

export const WEIGHT_PROFILES = {
  trending: { label: "Trending", velocity: 0.35, engagement: 0.2, outperform: 0.2, recency: 0.25 },
  viral: { label: "Viral", velocity: 0.25, engagement: 0.15, outperform: 0.5, recency: 0.1 },
  research: { label: "Balanced", velocity: 0.3, engagement: 0.25, outperform: 0.25, recency: 0.2 },
};

export const MIN_SUBSCRIBERS_FOR_RATIO = 100;

const LABELS = {
  velocity: "Average views per day",
  engagement: "Engagement rate",
  outperform: "Views vs channel size",
  recency: "Freshness",
};

function clamp(n) {
  return Math.max(0, Math.min(100, n));
}

// For the "how is it weighted" bar chart.
export function weightItems(profileKey) {
  const p = WEIGHT_PROFILES[profileKey] || WEIGHT_PROFILES.research;
  return Object.keys(LABELS).map((k) => ({
    label: LABELS[k],
    value: p[k] * 100,
    display: Math.round(p[k] * 100) + "%",
  }));
}

// Views divided by the channel's subscribers, or null when it cannot be trusted.
export function viewsPerSubscriber(video) {
  const subs = video.channelSubscribers;
  if (typeof video.views !== "number" || typeof subs !== "number" || subs < MIN_SUBSCRIBERS_FOR_RATIO) {
    return null;
  }
  return video.views / subs;
}

export function median(values) {
  const nums = values
    .filter((n) => typeof n === "number" && Number.isFinite(n))
    .sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

// Returns { score, components: [{ label, value, weight, detail }], profile, missing }
// or null when views or the publish date are unavailable.
export function scoreVideo(video, { profile = "research", windowDays = 30 } = {}) {
  const w = WEIGHT_PROFILES[profile] || WEIGHT_PROFILES.research;
  const age = ageInDays(video.publishedAt);
  const views = typeof video.views === "number" ? video.views : null;
  if (views === null || age === null) return null;

  const win = Math.max(1, Number(windowDays) || 30);
  const parts = [];
  const missing = [];

  // 1. Average views per day since publishing (log scale: 100,000 per day = 100)
  const perDay = views / Math.max(age, 1);
  parts.push({
    key: "velocity",
    label: LABELS.velocity,
    value: clamp((Math.log10(perDay + 1) / 5) * 100),
    detail: formatCount(perDay) + " views per day on average since publishing (age counted as at least 1 day).",
  });

  // 2. Engagement rate: (likes + comments) / views. 6% or more = 100.
  const hasEngagement = (video.likes !== null && video.likes !== undefined) ||
    (video.comments !== null && video.comments !== undefined);
  if (hasEngagement && views > 0) {
    const rate = ((video.likes || 0) + (video.comments || 0)) / views;
    parts.push({
      key: "engagement",
      label: LABELS.engagement,
      value: clamp((rate / 0.06) * 100),
      detail: (rate * 100).toFixed(2) + "% of views came with a like or comment (6% or more scores 100).",
    });
  } else {
    missing.push("likes and comments");
  }

  // 3. Views compared with channel subscribers: 0.01x = 0, 1x = 67, 10x or more = 100.
  const ratio = viewsPerSubscriber(video);
  if (ratio !== null) {
    parts.push({
      key: "outperform",
      label: LABELS.outperform,
      value: clamp(((Math.log10(Math.max(ratio, 0.01)) + 2) / 3) * 100),
      detail:
        "Views are " + (ratio >= 10 ? ratio.toFixed(0) : ratio.toFixed(2)) +
        "x the channel's subscriber count (10x or more scores 100).",
    });
  } else {
    missing.push("channel subscriber count");
  }

  // 4. Freshness inside the search window: 100 when new, 20 at the window edge.
  parts.push({
    key: "recency",
    label: LABELS.recency,
    value: 100 - (80 * Math.min(age, win)) / win,
    detail:
      "Published " + (age < 1 ? "less than a day" : Math.floor(age) + " days") +
      " ago. 100 means brand new, 20 means the edge of the " + win + "-day window.",
  });

  const total = parts.reduce((sum, p) => sum + w[p.key], 0);
  const score = parts.reduce((sum, p) => sum + p.value * w[p.key], 0) / total;

  const components = parts.map((p) => ({
    label: p.label,
    value: p.value,
    weight: w[p.key] / total,
    detail: p.detail,
  }));

  if (missing.length > 0) {
    components[0].detail += " Not available: " + missing.join(", ") + ". Weights were rescaled.";
  }

  return { score, components, profile: w.label, missing };
}

export function scoreVideos(videos, options) {
  const list = Array.isArray(videos) ? videos : [];
  return list.map((v) => ({ ...v, score: scoreVideo(v, options) }));
}
