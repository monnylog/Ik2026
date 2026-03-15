import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopProps {
  /** Optional ref to the scrollable container. If not provided, finds #main-content automatically. */
  scrollRef?: React.RefObject<HTMLElement | null>;
  /** Scroll threshold in pixels before showing the button */
  threshold?: number;
}

/**
 * Floating action button that appears when the user scrolls down past the threshold.
 * Scrolls the container smoothly back to top on click.
 * If no scrollRef is provided, auto-detects the #main-content element.
 */
export function ScrollToTop({ scrollRef, threshold = 500 }: ScrollToTopProps) {
  const [visible, setVisible] = useState(false);
  const autoRef = useRef<HTMLElement | null>(null);

  const getEl = useCallback(() => {
    if (scrollRef?.current) return scrollRef.current;
    if (!autoRef.current) {
      autoRef.current = document.getElementById("main-content");
    }
    return autoRef.current;
  }, [scrollRef]);

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const el = getEl();
      if (!el) return;

      const handleScroll = () => {
        setVisible(el.scrollTop > threshold);
      };

      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    }, 100);

    return () => clearTimeout(timer);
  }, [getEl, threshold]);

  // Also listen after initial mount since the element may appear later
  useEffect(() => {
    const el = getEl();
    if (!el) return;

    const handleScroll = () => {
      setVisible(el.scrollTop > threshold);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [getEl, threshold]);

  const scrollToTop = useCallback(() => {
    const el = getEl();
    el?.scrollTo({ top: 0, behavior: "smooth" });
  }, [getEl]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          style={{
            backgroundColor: "rgba(40,54,24,0.92)",
            border: "1px solid rgba(221,161,94,0.3)",
            backdropFilter: "blur(8px)",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 text-white" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
