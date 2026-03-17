import { useEffect, useRef } from "react";

/**
 * Prefetches commonly visited lazy-loaded page modules on browser idle,
 * so subsequent navigation is instant. Only runs once per session.
 */
export function usePrefetchPages(enabled: boolean) {
  const prefetched = useRef(false);

  useEffect(() => {
    if (!enabled || prefetched.current) return;
    prefetched.current = true;

    // Modules to prefetch — ordered by typical navigation frequency
    const modules = [
      () => import("../components/chef-roster"),
      () => import("../components/event-timeline"),
      () => import("../components/comms-chat"),
      () => import("../components/task-board"),
      () => import("../components/event-schedule"),
      () => import("../components/menu-courses"),
    ];

    const prefetch = () => {
      let idx = 0;
      const loadNext = () => {
        if (idx >= modules.length) return;
        modules[idx]().catch(() => {
          // Silently ignore — the lazyRetry wrapper will handle it when the user navigates
        });
        idx++;
        // Stagger prefetches by 2s to avoid blocking
        if (idx < modules.length) {
          setTimeout(loadNext, 2000);
        }
      };
      loadNext();
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 5000 });
    } else {
      setTimeout(prefetch, 3000);
    }
  }, [enabled]);
}
