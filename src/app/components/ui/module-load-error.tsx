import { useState } from "react";
import { motion } from "motion/react";
import { WifiOff, RotateCcw, RefreshCw, Home } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = {
  fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif",
};

interface ModuleLoadErrorProps {
  moduleName?: string;
  onRetry?: () => void;
}

/**
 * Graceful fallback shown when a lazy-loaded page module fails to load
 * after automatic retries. Replaces the old hard-reload behavior.
 */
export function ModuleLoadError({ moduleName, onRetry }: ModuleLoadErrorProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    if (onRetry) {
      setRetrying(true);
      onRetry();
      // Reset after a brief timeout in case the retry itself fails
      setTimeout(() => setRetrying(false), 4000);
    } else {
      window.location.reload();
    }
  };

  const handleHardReload = () => {
    // Clear any module caches and do a full reload
    if ("caches" in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      });
    }
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center text-center px-6 py-16 rounded-xl mx-auto max-w-md"
      style={{
        backgroundColor: "rgba(248,245,239,0.6)",
        border: "1px solid rgba(201,169,110,0.12)",
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,169,110,0.08), rgba(212,170,124,0.12))",
          border: "1px solid rgba(201,169,110,0.15)",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <WifiOff className="w-6 h-6" style={{ color: "#C9A96E" }} />
      </motion.div>

      {/* Title */}
      <h3
        className="text-foreground text-[1.125rem] mb-2"
        style={headingFont}
      >
        Page couldn't load
      </h3>

      {/* Description */}
      <p
        className="text-muted-foreground text-[0.8125rem] leading-relaxed mb-1 max-w-xs"
        style={bodyFont}
      >
        {moduleName
          ? `The "${moduleName}" module failed to load after retrying.`
          : "This page module failed to load after retrying."}
      </p>
      <p
        className="text-muted-foreground/50 text-[0.75rem] leading-relaxed mb-6 max-w-xs"
        style={bodyFont}
      >
        This usually means a slow connection or a deployment in progress. Your data is safe.
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 flex-wrap justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer min-h-[44px] disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #7E9E78, #6a8b64)",
            color: "#F5F0E8",
            border: "1px solid rgba(126,158,120,0.3)",
            ...bodyFont,
            fontWeight: 600,
          }}
        >
          {retrying ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          {retrying ? "Retrying…" : "Try Again"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleHardReload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer min-h-[44px]"
          style={{
            backgroundColor: "rgba(201,169,110,0.08)",
            color: "#C9A96E",
            border: "1px solid rgba(201,169,110,0.15)",
            ...bodyFont,
            fontWeight: 500,
          }}
        >
          <Home className="w-4 h-4" />
          Full Reload
        </motion.button>
      </div>

      {/* Technical hint */}
      <p
        className="mt-5 text-[0.625rem] text-muted-foreground/30"
        style={bodyFont}
      >
        If this persists, try a hard refresh (Ctrl+Shift+R) or clear your browser cache.
      </p>
    </motion.div>
  );
}
