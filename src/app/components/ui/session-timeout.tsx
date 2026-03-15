import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, LogOut, RefreshCw } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

interface SessionTimeoutProps {
  onSignOut: () => void;
  enabled?: boolean;
}

export function SessionTimeout({ onSignOut, enabled = true }: SessionTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) return; // Don't reset if warning is showing
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS);
  }, [showWarning]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    lastActivityRef.current = Date.now();
    // Reset the inactivity timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, TIMEOUT_MS);
  };

  const handleSignOut = () => {
    setShowWarning(false);
    onSignOut();
  };

  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      if (!showWarning) {
        resetTimer();
      }
    };

    // Start the timer
    resetTimer();

    // Listen for user activity
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, resetTimer, showWarning]);

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[75] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="timeout-title"
          aria-describedby="timeout-desc"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden"
            style={{ border: "1px solid rgba(205,168,138,0.15)" }}
          >
            {/* Warm accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #CDA88A 0%, #C9A96E 100%)",
              }}
            />

            <div className="px-6 py-6 text-center">
              {/* Icon */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(205,168,138,0.12) 0%, rgba(201,169,110,0.08) 100%)",
                  border: "1px solid rgba(205,168,138,0.2)",
                }}
              >
                <Clock className="w-7 h-7" style={{ color: "#CDA88A" }} />
              </motion.div>

              <h3
                id="timeout-title"
                className="text-foreground text-[1.125rem] mb-2"
                style={headingFont}
              >
                Still there?
              </h3>
              <p
                id="timeout-desc"
                className="text-muted-foreground text-[0.8125rem] leading-relaxed mb-6"
                style={bodyFont}
              >
                You've been away for a while. Would you like to stay logged in
                or sign out to keep your session secure?
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStayLoggedIn}
                  className="w-full py-2.5 rounded-xl text-[0.875rem] font-medium cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "rgba(126,158,120,0.12)",
                    color: "#7E9E78",
                    border: "1px solid rgba(126,158,120,0.2)",
                    ...bodyFont,
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Stay Logged In
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="w-full py-2.5 rounded-xl text-[0.875rem] cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "rgba(205,168,138,0.08)",
                    color: "#CDA88A",
                    border: "1px solid rgba(205,168,138,0.15)",
                    ...bodyFont,
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </div>

              <p
                className="text-muted-foreground/30 text-[0.625rem] mt-4"
                style={bodyFont}
              >
                Your data is always safe — sign back in anytime
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}