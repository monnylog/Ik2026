import { useState, useCallback } from "react";

// Shared screen-reader announcement hook.
// Returns { message, announce } — render `message` inside an aria-live region,
// and call `announce(text)` to push a new announcement.
// The message auto-clears after a short delay so the region stays clean.

export function useAnnouncement() {
  const [message, setMessage] = useState("");

  const announce = useCallback((text: string) => {
    // Clear first so screen readers re-read even if the text is the same
    setMessage("");
    requestAnimationFrame(() => {
      setMessage(text);
    });
    // Auto-clear after 5s so the region doesn't accumulate stale content
    setTimeout(() => setMessage(""), 5000);
  }, []);

  return { message, announce };
}
