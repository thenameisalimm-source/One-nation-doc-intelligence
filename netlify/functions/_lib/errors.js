export class HttpError extends Error {
  constructor(status, code, message, headers = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

// Converts any thrown error into a safe JSON response. Never leaks internals or keys.
export function errorResponse(err) {
  if (err instanceof HttpError) {
    return json({ error: { code: err.code, message: err.message } }, err.status, err.headers);
  }
  console.error("Unhandled function error:", err && err.name, err && err.message);
  return json(
    { error: { code: "SERVER_ERROR", message: "Unexpected server error. Please try again." } },
    500
  );
}

export function requireMethod(req, method) {
  if (req.method !== method) {
    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Method not allowed.", { Allow: method });
  }
}
