import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wifi, WifiOff } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

/**
 * Hook to track online/offline status.
 * Returns current status + whether the user just came back online (for toast).
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Clear "back online" indicator after a few seconds
      setTimeout(() => setWasOffline(false), 4000);
    };
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * Slim banner that slides in from the top when offline,
 * then briefly shows a "back online" confirmation.
 */
export function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  const showBanner = !isOnline || wasOffline;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-[0.75rem]"
            style={{
              backgroundColor: isOnline
                ? "rgba(126,158,120,0.12)"
                : "rgba(205,168,138,0.12)",
              borderBottom: isOnline
                ? "1px solid rgba(126,158,120,0.2)"
                : "1px solid rgba(205,168,138,0.2)",
              color: isOnline ? "#7E9E78" : "#CDA88A",
              ...bodyFont,
            }}
            role="status"
            aria-live="assertive"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>You're back online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>You're offline — some features may be unavailable</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}