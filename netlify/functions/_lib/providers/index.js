import { HttpError } from "../errors.js";
import anthropic from "./anthropic.js";

// To add another provider later: create a file with the same shape
// ({ id, isConfigured, modelName, assertReady, generate }) and register it here.
const PROVIDERS = { anthropic };

export function getProvider() {
  const id = (process.env.AI_PROVIDER || "anthropic").trim().toLowerCase();
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new HttpError(503, "AI_PROVIDER_UNKNOWN", "The configured AI provider is not supported.");
  }
  return provider;
}
