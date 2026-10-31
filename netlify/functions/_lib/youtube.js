import { HttpError } from "./errors.js";

const BASE = "https://www.googleapis.com/youtube/v3/";

export function getYouTubeKey() {
  const key = (process.env.YOUTUBE_API_KEY || "").trim();
  if (!key) {
    throw new HttpError(
      503,
      "YOUTUBE_NOT_CONFIGURED",
      "The YouTube API key is not configured on the server."
    );
  }
  return key;
}

function mapYouTubeError(status, reason, message) {
  const r = String(reason || "");
  const m = String(message || "");

  if (["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded", "userRateLimitExceeded"].includes(r)) {
    return new HttpError(
      429,
      "YOUTUBE_QUOTA",
      "The YouTube daily quota for this API key is used up. It resets at midnight Pacific Time."
    );
  }
  if (r === "keyInvalid" || m.includes("API key not valid")) {
    return new HttpError(502, "YOUTUBE_KEY_INVALID", "YouTube rejected the API key. Check YOUTUBE_API_KEY in Netlify.");
  }
  if (r === "accessNotConfigured" || r === "SERVICE_DISABLED") {
    return new HttpError(
      502,
      "YOUTUBE_API_DISABLED",
      "YouTube Data API v3 is not enabled for this key's Google Cloud project."
    );
  }
  if (status === 403) {
    return new HttpError(
      502,
      "YOUTUBE_FORBIDDEN",
      "YouTube refused the request. The key may have restrictions. Use no application restriction and limit it to YouTube Data API v3."
    );
  }
  return new HttpError(502, "YOUTUBE_ERROR", "YouTube returned an error (code " + status + "). Please try again.");
}

// Every YouTube call goes through here. The key is added server-side and URLs are never logged.
export async function ytGet(endpoint, params) {
  const key = getYouTubeKey();
  const url = new URL(endpoint, BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("key", key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new HttpError(504, "YOUTUBE_TIMEOUT", "YouTube took too long to respond. Please try again.");
    }
    throw new HttpError(502, "YOUTUBE_UNREACHABLE", "Could not reach YouTube. Please try again.");
  } finally {
    clearTimeout(timer);
  }

  if (res.ok) return res.json();

  let reason = "";
  let message = "";
  try {
    const body = await res.json();
    reason = (body.error && body.error.errors && body.error.errors[0] && body.error.errors[0].reason) || (body.error && body.error.status) || "";
    message = (body.error && body.error.message) || "";
  } catch {
    /* ignore unreadable error body */
  }
  throw mapYouTubeError(res.status, reason, message);
}

export function toNum(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Converts a videos.list item into the shape the frontend uses.
// Only MEASURED public values live here. Scores are calculated in the browser.
export function normalizeVideo(item) {
  const s = item.snippet || {};
  const st = item.statistics || {};
  const t = s.thumbnails || {};
  const thumb = t.medium || t.high || t.default || {};
  return {
    id: item.id,
    title: s.title || "",
    description: (s.description || "").slice(0, 300),
    channelId: s.channelId || "",
    channelTitle: s.channelTitle || "",
    thumbnail: thumb.url || null,
    publishedAt: s.publishedAt || null,
    views: toNum(st.viewCount),
    likes: toNum(st.likeCount),
    comments: toNum(st.commentCount),
    channelSubscribers: null,
    language: s.defaultAudioLanguage || s.defaultLanguage || null,
  };
}

// videos.list costs 1 unit for up to 50 ids.
export async function fetchVideoDetails(ids) {
  if (ids.length === 0) return [];
  const data = await ytGet("videos", { part: "snippet,statistics", id: ids.slice(0, 50).join(",") });
  return data.items || [];
}

// channels.list costs 1 unit for up to 50 ids. Returns { channelId: subscribers | null }.
export async function fetchChannelSubscribers(channelIds) {
  const out = {};
  if (channelIds.length === 0) return out;
  const data = await ytGet("channels", { part: "statistics", id: channelIds.slice(0, 50).join(",") });
  for (const item of data.items || []) {
    const st = item.statistics || {};
    out[item.id] = st.hiddenSubscriberCount ? null : toNum(st.subscriberCount);
  }
  return out;
}
