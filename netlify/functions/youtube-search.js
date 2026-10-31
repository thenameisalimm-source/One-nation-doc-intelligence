import { json, errorResponse, requireMethod } from "./_lib/errors.js";
import { readJsonBody, cleanText, pickOption } from "./_lib/validate.js";
import { rateLimit } from "./_lib/rateLimit.js";
import { cacheGet, cacheSet } from "./_lib/cache.js";
import {
  getYouTubeKey,
  ytGet,
  normalizeVideo,
  fetchVideoDetails,
  fetchChannelSubscribers,
} from "./_lib/youtube.js";

const CACHE_MS = 15 * 60 * 1000;

// Cost: search.list 100 units + videos.list 1 + channels.list 1 = 102 units (0 when cached).
export default async (req, context) => {
  try {
    requireMethod(req, "POST");
    getYouTubeKey();
    rateLimit(req, context, "yt-search", 10, 10 * 60 * 1000);

    const body = await readJsonBody(req);
    const query = cleanText(body.topic || body.keyword, { name: "Topic", required: true, max: 120 });
    const mode = pickOption(body.mode, ["india", "global"], "india", "Research mode");
    const language = pickOption(body.language, ["any", "hi", "en"], "any", "Language");
    const days = Number(pickOption(body.days, ["7", "30", "90"], "30", "Time window"));

    const cacheKey = ["search", query.toLowerCase(), mode, language, days].join("|");
    const cached = cacheGet(cacheKey);
    if (cached) {
      return json({ ...cached, meta: { ...cached.meta, cached: true, quotaUnitsUsed: 0 } });
    }

    const publishedAfter = new Date(Date.now() - days * 86400000).toISOString();
    const search = await ytGet("search", {
      part: "snippet",
      type: "video",
      q: query,
      maxResults: 25,
      order: "relevance",
      publishedAfter,
      regionCode: mode === "india" ? "IN" : undefined,
      relevanceLanguage: language === "any" ? undefined : language,
      safeSearch: "moderate",
    });

    const ids = (search.items || [])
      .map((i) => i.id && i.id.videoId)
      .filter(Boolean);

    let videos = [];
    let quota = 100;

    if (ids.length > 0) {
      const details = await fetchVideoDetails(ids);
      const channelIds = [...new Set(details.map((d) => d.snippet && d.snippet.channelId).filter(Boolean))];
      const subs = await fetchChannelSubscribers(channelIds);
      quota += 2;
      videos = details.map((d) => {
        const v = normalizeVideo(d);
        v.channelSubscribers = Object.prototype.hasOwnProperty.call(subs, v.channelId) ? subs[v.channelId] : null;
        return v;
      });
    }

    const payload = {
      videos,
      meta: {
        source: "YouTube Data API v3",
        fetchedAt: new Date().toISOString(),
        query,
        mode,
        language,
        days,
        resultCount: videos.length,
        quotaUnitsUsed: quota,
        cached: false,
      },
    };

    cacheSet(cacheKey, payload, CACHE_MS);
    return json(payload);
  } catch (err) {
    return errorResponse(err);
  }
};
