import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet } from "../services/apiClient.js";

// Expected /api/status response (built in Phase 3):
// { youtube: boolean, anthropic: boolean, model: string | null }

const StatusContext = createContext(null);

export function StatusProvider({ children }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiGet("/api/status", 10000);
      setState({ loading: false, error: null, data });
    } catch (err) {
      setState({ loading: false, error: err.message, data: null });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

export function useStatus() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useStatus must be used inside StatusProvider");
  return ctx;
}
