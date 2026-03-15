import { useState, useEffect, useCallback } from "react";

/**
 * Detects when the service worker has a new version waiting,
 * and provides a callback to activate it + reload.
 */
export function useSWUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleControllerChange = () => {
      // New SW has taken over — reload to pick up new assets
      window.location.reload();
    };

    const listenForWaiting = (reg: ServiceWorkerRegistration) => {
      // If there's already a waiting worker (e.g. from a previous page load)
      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setUpdateAvailable(true);
        return;
      }

      // Listen for new installing worker
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // New content is available — show the toast
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      });
    };

    navigator.serviceWorker.ready.then(listenForWaiting);
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    // Also check for updates periodically (every 5 minutes)
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => {
        reg.update().catch(() => {});
      });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      // The controllerchange listener above will reload
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, applyUpdate, dismissUpdate };
}
