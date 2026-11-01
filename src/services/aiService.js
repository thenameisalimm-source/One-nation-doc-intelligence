import { apiPost } from "./apiClient.js";

// The server allows Anthropic up to 24 seconds, so the browser waits a little longer.
const AI_TIMEOUT_MS = 30000;

function call(task, fields) {
  return apiPost("/api/ai-generate", { task, ...fields }, AI_TIMEOUT_MS);
}

// Returns { outline: { title, hook, sections: [{ title, summary }] }, meta }
export function generateOutline({ topic, length, notes }) {
  return call("script-outline", { topic, length, notes });
}

// Returns { text, meta }. `previous` is the tail of the section before this one.
export function generateSectionText({ topic, notes, sections, index, previous }) {
  return call("script-section", { topic, notes, sections, index, previous });
}

// Same gate logic FeaturePage uses, for pages that build their own UI.
export function aiBlockedReason(status) {
  if (status.loading) return "Checking backend status…";
  if (status.error) return "Backend not reachable. " + status.error;
  if (!status.data || !status.data.anthropic) {
    return "Needs the Anthropic API key. Add it in Netlify environment variables, then redeploy.";
  }
  if (!status.data.model) {
    return "ANTHROPIC_MODEL is not set. Add it in Netlify environment variables, then redeploy.";
  }
  return null;
}
