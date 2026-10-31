import { json, errorResponse, requireMethod } from "./_lib/errors.js";
import { rateLimit } from "./_lib/rateLimit.js";

function has(name) {
  return Boolean((process.env[name] || "").trim());
}

// Reports ONLY whether keys exist. Key values are never returned.
export default async (req, context) => {
  try {
    requireMethod(req, "GET");
    rateLimit(req, context, "status", 60, 60 * 1000);
    return json({
      youtube: has("YOUTUBE_API_KEY"),
      anthropic: has("ANTHROPIC_API_KEY"),
      model: (process.env.ANTHROPIC_MODEL || "").trim() || null,
    });
  } catch (err) {
    return errorResponse(err);
  }
};
