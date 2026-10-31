import { useCallback, useEffect, useState } from "react";
import { readStore, writeStore } from "../services/storageService.js";

const EVENT = "ond-store-change";

// Like useState, but persisted. All components using the same key stay in sync.
// The setter returns true if the data was actually saved to the device.
export default function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => readStore(key, fallback));

  useEffect(() => {
    const onChange = (e) => {
      if (e.detail && e.detail.key === key) setValue(readStore(key, fallback));
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next) => {
      const current = readStore(key, fallback);
      const resolved = typeof next === "function" ? next(current) : next;
      const ok = writeStore(key, resolved);
      setValue(resolved);
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
      return ok;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [value, update];
}
