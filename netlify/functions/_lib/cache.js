// Small in-memory TTL cache. Saves YouTube quota when the same search repeats.
// Per-instance only, so it is a best-effort saving, not a guarantee.
const store = new Map();
const MAX_ENTRIES = 150;

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires <= Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(key, value, ttlMs) {
  if (store.size >= MAX_ENTRIES) {
    store.delete(store.keys().next().value);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}
