import { HttpError } from "./errors.js";

const MAX_BODY_CHARS = 8000;

export async function readJsonBody(req) {
  const type = req.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    throw new HttpError(415, "BAD_CONTENT_TYPE", "Request must be JSON.");
  }
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) {
    throw new HttpError(413, "TOO_LARGE", "Request is too large.");
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new HttpError(400, "BAD_JSON", "Request body is not valid JSON.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "BAD_JSON", "Request body must be a JSON object.");
  }
  return data;
}

export function cleanText(value, { name, required = false, max = 200 }) {
  if (value === undefined || value === null) value = "";
  if (typeof value !== "string") {
    throw new HttpError(400, "BAD_INPUT", name + " must be text.");
  }
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (required && !cleaned) {
    throw new HttpError(400, "BAD_INPUT", name + " is required.");
  }
  if (cleaned.length > max) {
    throw new HttpError(400, "BAD_INPUT", name + " is too long (maximum " + max + " characters).");
  }
  return cleaned;
}

export function pickOption(value, allowed, fallback, name) {
  if (value === undefined || value === null || value === "") return fallback;
  const v = String(value);
  if (!allowed.includes(v)) {
    throw new HttpError(400, "BAD_INPUT", name + " has an unsupported value.");
  }
  return v;
}
