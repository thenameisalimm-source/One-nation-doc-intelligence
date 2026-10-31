import { useCallback } from "react";
import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../services/storageService.js";

const MAX_ENTRIES = 100;

// Entry: { id, type, query, summary?, at }
export default function useHistory() {
  const [raw, setRaw] = useLocalStorage("history", []);
  const items = Array.isArray(raw) ? raw : [];

  const add = useCallback(
    (entry) =>
      setRaw((list) => {
        const safe = Array.isArray(list) ? list : [];
        const next = [{ ...entry, id: makeId(), at: new Date().toISOString() }, ...safe];
        return next.slice(0, MAX_ENTRIES);
      }),
    [setRaw]
  );

  const remove = useCallback(
    (id) => setRaw((list) => (Array.isArray(list) ? list : []).filter((i) => i.id !== id)),
    [setRaw]
  );

  const clear = useCallback(() => setRaw([]), [setRaw]);

  return { items, add, remove, clear };
}
