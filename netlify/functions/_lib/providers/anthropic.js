import { HttpError } from "../errors.js";

// The ONLY file that reads ANTHROPIC_API_KEY and ANTHROPIC_MODEL.
// Keys are never logged, returned or included in error messages.
const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
const TIMEOUT_MS = 24000;

function apiKey() {
  return (process.env.ANTHROPIC_API_KEY || "").trim();
}

function modelName() {
  return (process.env.ANTHROPIC_MODEL || "").trim();
}

function isConfigured() {
  return Boolean(apiKey());
}

function assertReady() {
  if (!apiKey()) {
    throw new HttpError(
      503,
      "AI_NOT_CONFIGURED",
      "The Anthropic API key is not configured on the server."
    );
  }
  if (!modelName()) {
    throw new HttpError(
      503,
      "AI_MODEL_NOT_SET",
      "ANTHROPIC_MODEL is not set on the server. Add it in Netlify environment variables, then redeploy."
    );
  }
}

function mapError(status, type, message) {
  const m = String(message || "").toLowerCase();
  if (m.includes("credit balance")) {
    return new HttpError(402, "AI_NO_CREDIT", "The Anthropic account has no credit left. Add credit in the Anthropic console.");
  }
  if (status === 401) {
    return new HttpError(502, "AI_KEY_INVALID", "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in Netlify.");
  }
  if (status === 403) {
    return new HttpError(502, "AI_FORBIDDEN", "Anthropic refused the request. The key may not have access to this model.");
  }
  if (status === 404) {
    return new HttpError(502, "AI_MODEL_NOT_FOUND", "Anthropic could not find the model named in ANTHROPIC_MODEL. Check the spelling in Netlify.");
  }
  if (status === 429) {
    return new HttpError(429, "AI_RATE_LIMIT", "Anthropic rate limit reached. Please wait a minute and try again.");
  }
  if (status === 529 || type === "overloaded_error") {
    return new HttpError(503, "AI_OVERLOADED", "Anthropic is busy right now. Please try again shortly.");
  }
  if (status === 400) {
    return new HttpError(502, "AI_BAD_REQUEST", "Anthropic rejected the request. Check that ANTHROPIC_MODEL is a valid, available model.");
  }
  return new HttpError(502, "AI_ERROR", "Anthropic returned an error (code " + status + "). Please try again.");
}

async function post(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey(),
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === "AbortError") {
      throw new HttpError(504, "AI_TIMEOUT", "The AI took too long to answer. Please try again, or use a faster model.");
    }
    throw new HttpError(502, "AI_UNREACHABLE", "Could not reach Anthropic. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

async function readError(res) {
  try {
    const b = await res.json();
    return {
      type: (b.error && b.error.type) || "",
      message: (b.error && b.error.message) || "",
    };
  } catch {
    return { type: "", message: "" };
  }
}

// Returns { text, truncated, model }.
async function generate({ system, prompt, maxTokens, temperature }) {
  assertReady();

  const body = {
    model: modelName(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  };
  if (typeof temperature === "number") body.temperature = temperature;

  let res = await post(body);

  // Some models reject the temperature setting. Retry once without it.
  if (!res.ok && res.status === 400 && "temperature" in body) {
    const first = await readError(res);
    if (/temperature/i.test(first.message)) {
      delete body.temperature;
      res = await post(body);
    } else {
      throw mapError(res.status, first.type, first.message);
    }
  }

  if (!res.ok) {
    const err = await readError(res);
    throw mapError(res.status, err.type, err.message);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new HttpError(502, "AI_BAD_RESPONSE", "Anthropic sent a response that could not be read.");
  }

  if (data.stop_reason === "refusal") {
    throw new HttpError(422, "AI_REFUSED", "The AI declined this request. Try rewording it.");
  }

  const text = (Array.isArray(data.content) ? data.content : [])
    .filter((b) => b && b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("")
    .trim();

  if (!text) {
    throw new HttpError(502, "AI_EMPTY", "The AI returned an empty answer. Please try again.");
  }

  return {
    text,
    truncated: data.stop_reason === "max_tokens",
    model: data.model || modelName(),
  };
}

export default { id: "anthropic", isConfigured, modelName, assertReady, generate };
