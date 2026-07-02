import { useEffect } from "react";

/**
 * Re-runs `callback` whenever the active store is switched in the Header.
 * The Header dispatches a "store-changed" window event on every switch.
 * Pass a stable reference (e.g. a useCallback result) to avoid repeated
 * listener churn.
 */
const useStoreRefresh = (callback) => {
  useEffect(() => {
    window.addEventListener("store-changed", callback);
    return () => window.removeEventListener("store-changed", callback);
  }, [callback]);
};

export default useStoreRefresh;
