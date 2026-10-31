import { json, errorResponse, requireMethod, HttpError } from "./_lib/errors.js";
import { readJsonBody } from "./_lib/validate.js";
import { rateLimit } from "./_lib/rateLimit.js";
import { getYouTubeKey, normalizeVideo, fetchVideoDetails } from "./_lib/youtube.js";

// Fresh statistics for up to 50 known video ids. Cost: 1 unit.
// Used later to store repeat observations so real view velocity can be measured.
export default async (req, context) => {
  try {
    requireMethod(req, "POST");
    getYouTubeKey();
    rateLimit(req, context, "yt-videos", 30, 10 * 60 * 1000);

    const body = await readJsonBody(req);
    if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 50) {
      throw new HttpError(400, "BAD_INPUT", "Send between 1 and 50 video ids.");
    }
    const ids = [...new Set(body.ids.map(String))];
    if (!ids.every((id) => /^[A-Za-z0-9_-]{11}$/.test(id))) {
      throw new HttpError(400, "BAD_INPUT", "One or more video ids are not valid.");
    }

    const items = await fetchVideoDetails(ids);
    return json({
      videos: items.map(normalizeVideo),
      meta: {
        source: "YouTube Data API v3",
        observedAt: new Date().toISOString(),
        quotaUnitsUsed: 1,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
};
