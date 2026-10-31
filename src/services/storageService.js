// Versioned LocalStorage wrapper. Never throws: private mode or a full disk
// returns the fallback / false instead of crashing the app.
const PREFIX = "ond:v1:";

export function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStore(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
