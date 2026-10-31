import { json, errorResponse, requireMethod, HttpError } from "./_lib/errors.js";
import { readJsonBody, cleanText } from "./_lib/validate.js";
import { rateLimit } from "./_lib/rateLimit.js";
import { cacheGet, cacheSet } from "./_lib/cache.js";
import { getYouTubeKey, ytGet, toNum, normalizeVideo, fetchVideoDetails } from "./_lib/youtube.js";

const CACHE_MS = 30 * 60 * 1000;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

function parseChannelInput(text) {
  if (CHANNEL_ID.test(text)) return { type: "id", value: text };

  if (/^https?:\/\//i.test(text) || /^(www\.|m\.)?youtube\.com\//i.test(text)) {
    let url;
    let parts;
    try {
      url = new URL(/^https?:/i.test(text) ? text : "https://" + text);
      parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    } catch {
      throw new HttpError(400, "BAD_INPUT", "That link could not be read.");
    }
    if (!/(^|\.)youtube\.com$/i.test(url.hostname)) {
      throw new HttpError(400, "BAD_INPUT", "Only youtube.com links are supported.");
    }
    if (parts[0] && parts[0].startsWith("@")) return { type: "handle", value: parts[0] };
    if (parts[0] === "channel" && CHANNEL_ID.test(parts[1] || "")) return { type: "id", value: parts[1] };
    if (parts[0] === "user" && parts[1]) return { type: "username", value: parts[1] };
    if (parts[0] === "c" && parts[1]) return { type: "search", value: parts[1] };
    throw new HttpError(400, "BAD_INPUT", "No channel found in that link. Use the channel's @handle or its channel page link.");
  }

  if (text.startsWith("@")) return { type: "handle", value: text };
  return { type: "search", value: text };
}

// Cost: handle, id or link = 1 + 1 + 1 = 3 units. A plain name adds a 100-unit search.
export default async (req, context) => {
  try {
    requireMethod(req, "POST");
    getYouTubeKey();
    rateLimit(req, context, "yt-channel", 15, 10 * 60 * 1000);

    const body = await readJsonBody(req);
    const input = cleanText(body.channel, { name: "Channel", required: true, max: 200 });
    const target = parseChannelInput(input);

    const cacheKey = "channel|" + target.type + "|" + target.value.toLowerCase();
    const cached = cacheGet(cacheKey);
    if (cached) {
      return json({ ...cached, meta: { ...cached.meta, cached: true, quotaUnitsUsed: 0 } });
    }

    let quota = 0;
    const params = { part: "snippet,statistics,contentDetails" };

    if (target.type === "id") params.id = target.value;
    else if (target.type === "handle") params.forHandle = target.value;
    else if (target.type === "username") params.forUsername = target.value;
    else {
      const found = await ytGet("search", { part: "snippet", type: "channel", q: target.value, maxResults: 1 });
      quota += 100;
      const channelId = found.items && found.items[0] && found.items[0].id && found.items[0].id.channelId;
      if (!channelId) throw new HttpError(404, "CHANNEL_NOT_FOUND", "No public channel matched that name.");
      params.id = channelId;
    }

    const data = await ytGet("channels", params);
    quota += 1;
    const item = data.items && data.items[0];
    if (!item) throw new HttpError(404, "CHANNEL_NOT_FOUND", "No public channel matched that input.");

    const s = item.snippet || {};
    const st = item.statistics || {};
    const t = s.thumbnails || {};
    const channel = {
      id: item.id,
      title: s.title || "",
      handle: s.customUrl || null,
      description: (s.description || "").slice(0, 400),
      thumbnail: (t.medium || t.default || {}).url || null,
      country: s.country || null,
      createdAt: s.publishedAt || null,
      subscribers: st.hiddenSubscriberCount ? null : toNum(st.subscriberCount),
      subscribersHidden: Boolean(st.hiddenSubscriberCount),
      totalViews: toNum(st.viewCount),
      videoCount: toNum(st.videoCount),
    };

    let videos = [];
    const uploads = item.contentDetails && item.contentDetails.relatedPlaylists && item.contentDetails.relatedPlaylists.uploads;
    if (uploads) {
      const list = await ytGet("playlistItems", { part: "contentDetails", playlistId: uploads, maxResults: 15 });
      quota += 1;
      const ids = (list.items || [])
        .map((i) => i.contentDetails && i.contentDetails.videoId)
        .filter(Boolean);
      if (ids.length > 0) {
        const details = await fetchVideoDetails(ids);
        quota += 1;
        videos = details
          .map((d) => {
            const v = normalizeVideo(d);
            v.channelSubscribers = channel.subscribers;
            return v;
          })
          .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      }
    }

    const payload = {
      channel,
      videos,
      meta: {
        source: "YouTube Data API v3",
        fetchedAt: new Date().toISOString(),
        quotaUnitsUsed: quota,
        cached: false,
        note: "Public data only. Watch time, revenue and click-through rate are private to the channel owner.",
      },
    };

    cacheSet(cacheKey, payload, CACHE_MS);
    return json(payload);
  } catch (err) {
    return errorResponse(err);
  }
};
