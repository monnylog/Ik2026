import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Focus, Eye, EyeOff } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

const STORAGE_KEY = "ik26_focus_mode";

export function useFocusMode() {
  const [focusMode, setFocusMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(focusMode));
    } catch {}
  }, [focusMode]);

  return { focusMode, setFocusMode, toggleFocusMode: () => setFocusMode((p) => !p) };
}

interface FocusModeToggleProps {
  focusMode: boolean;
  onToggle: () => void;
}

export function FocusModeToggle({ focusMode, onToggle }: FocusModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[0.75rem] cursor-pointer transition-colors"
        style={{
          backgroundColor: focusMode
            ? "rgba(74,127,181,0.12)"
            : "rgba(192,209,177,0.1)",
          color: focusMode ? "#4A7FB5" : "var(--muted-foreground)",
          border: focusMode
            ? "1px solid rgba(74,127,181,0.25)"
            : "1px solid rgba(192,209,177,0.15)",
          ...bodyFont,
        }}
        aria-label={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
        aria-pressed={focusMode}
      >
        {focusMode ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Focus className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">
          {focusMode ? "Exit Focus" : "Focus Mode"}
        </span>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-foreground text-background text-[0.6875rem] whitespace-nowrap z-50 pointer-events-none"
            style={bodyFont}
          >
            {focusMode
              ? "Show all dashboard widgets"
              : "Hide non-essential widgets"}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}