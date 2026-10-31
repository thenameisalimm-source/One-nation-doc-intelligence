import { HttpError } from "./errors.js";

// Best-effort limiter. Memory is per serverless instance, so it slows abuse
// but is not a hard guarantee. YouTube quota caching adds a second layer.
const buckets = new Map();

function clientKey(req, context) {
  const fwd = req.headers.get("x-forwarded-for");
  return (
    (context && context.ip) ||
    req.headers.get("x-nf-client-connection-ip") ||
    (fwd ? fwd.split(",")[0].trim() : "") ||
    "unknown"
  );
}

export function rateLimit(req, context, name, limit, windowMs) {
  const now = Date.now();

  if (buckets.size > 2000) {
    for (const [k, b] of buckets) {
      if (b.reset <= now) buckets.delete(k);
    }
  }

  const key = name + ":" + clientKey(req, context);
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const wait = Math.max(1, Math.ceil((bucket.reset - now) / 1000));
    throw new HttpError(
      429,
      "RATE_LIMITED",
      "Too many requests. Please wait " + wait + " seconds and try again.",
      { "Retry-After": String(wait) }
    );
  }
}
