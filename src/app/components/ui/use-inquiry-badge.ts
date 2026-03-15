import { useState, useEffect, useCallback } from "react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/**
 * Polls the inquiry count endpoint and returns the new-inquiry count
 * for display as a sidebar badge. Polls every 60s when the tab is visible.
 */
export function useInquiryBadge(enabled: boolean) {
  const [newCount, setNewCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/portal-inquiries/count`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setNewCount(data.new || 0);
      }
    } catch {
      // silent — don't disrupt UX for a badge
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);

    // Re-fetch when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchCount();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, fetchCount]);

  return { newCount, refresh: fetchCount };
}
