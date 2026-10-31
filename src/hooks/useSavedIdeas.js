import { useCallback } from "react";
import useLocalStorage from "./useLocalStorage.js";
import { makeId } from "../services/storageService.js";

// Saved item: { id, type: "idea" | "video" | "note", title, body, url?, createdAt }
export default function useSavedIdeas() {
  const [raw, setRaw] = useLocalStorage("savedIdeas", []);
  const items = Array.isArray(raw) ? raw : [];

  const add = useCallback(
    (idea) => {
      const id = idea.id || makeId();
      return setRaw((list) => {
        const safe = Array.isArray(list) ? list : [];
        if (safe.some((i) => i.id === id)) return safe;
        return [{ ...idea, id, createdAt: new Date().toISOString() }, ...safe];
      });
    },
    [setRaw]
  );

  const remove = useCallback(
    (id) => setRaw((list) => (Array.isArray(list) ? list : []).filter((i) => i.id !== id)),
    [setRaw]
  );

  const clear = useCallback(() => setRaw([]), [setRaw]);
  const has = useCallback((id) => items.some((i) => i.id === id), [items]);

  return { items, add, remove, clear, has };
}
