import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";

/**
 * Thin animated progress bar that shows during page transitions.
 * Inspired by NProgress — appears at the top of the viewport.
 */
export function PageProgressBar({ isTransitioning }: { isTransitioning: boolean }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isTransitioning) {
      setVisible(true);
      setProgress(0);

      // Quick burst to ~30%, then slow trickle
      const start = performance.now();
      intervalRef.current = setInterval(() => {
        const elapsed = performance.now() - start;
        if (elapsed < 100) {
          setProgress(30);
        } else if (elapsed < 300) {
          setProgress((p) => Math.min(p + 8, 65));
        } else {
          setProgress((p) => Math.min(p + 2, 85));
        }
      }, 50);
    } else if (visible) {
      // Complete the bar
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timeout);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTransitioning]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed top-0 left-0 right-0 z-[55] h-[2px] pointer-events-none"
          style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
        >
          <motion.div
            className="h-full rounded-r-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #C9A96E 0%, #D4AA7C 60%, #CDA88A 100%)",
              boxShadow: "0 0 8px rgba(201,169,110,0.4)",
              transition: progress === 100 ? "width 0.2s ease-out" : "width 0.15s ease-out",
            }}
          />
          {/* Shimmer dot at the end */}
          {progress < 100 && (
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 h-full w-5 rounded-full"
              style={{
                left: `${progress}%`,
                transform: "translateX(-100%)",
                background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.6), transparent)",
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage page transition state.
 */
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startTransition = () => {
    setIsTransitioning(true);
  };

  const endTransition = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { isTransitioning, startTransition, endTransition };
}