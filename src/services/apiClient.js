// All backend calls go through here. The browser only talks to /api/*.

export class ApiError extends Error {
  constructor(message, { status = 0, code = "UNKNOWN" } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function friendlyMessage(status) {
  if (status === 400) return "The request was not valid. Please check your input.";
  if (status === 404) return "This backend feature is not available yet.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "The server had a problem. Please try again shortly.";
  return "Something went wrong with the request.";
}

async function request(path, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!res.ok) {
      throw new ApiError(data?.error?.message || friendlyMessage(res.status), {
        status: res.status,
        code: data?.error?.code || "HTTP_ERROR",
      });
    }
    if (data === null) {
      throw new ApiError("The server returned an unexpected response.", {
        status: res.status,
        code: "BAD_RESPONSE",
      });
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", { code: "TIMEOUT" });
    }
    throw new ApiError("Could not reach the server. Check your internet connection.", {
      code: "NETWORK",
    });
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet(path, timeoutMs) {
  return request(path, { method: "GET" }, timeoutMs);
}

export function apiPost(path, body, timeoutMs) {
  return request(path, { method: "POST", body: JSON.stringify(body ?? {}) }, timeoutMs);
}
