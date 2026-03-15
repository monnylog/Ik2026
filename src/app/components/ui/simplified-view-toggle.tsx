import { motion } from "motion/react";
import { Eye, EyeOff } from "lucide-react";
import { useSimplifiedView } from "../../lib/simplified-view-context";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

export function SimplifiedViewToggle() {
  const { simplified, toggleSimplified } = useSimplifiedView();

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={toggleSimplified}
      className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer min-h-[44px]"
      style={{
        backgroundColor: simplified
          ? "rgba(74,127,181,0.12)"
          : "rgba(107,127,142,0.06)",
        border: simplified
          ? "1px solid rgba(74,127,181,0.25)"
          : "1px solid rgba(107,127,142,0.12)",
        ...bodyFont,
      }}
      aria-label={simplified ? "Switch to detailed view" : "Switch to simplified view"}
      aria-pressed={simplified}
      role="switch"
    >
      {simplified ? (
        <EyeOff className="w-4 h-4" style={{ color: "#4A7FB5" }} />
      ) : (
        <Eye className="w-4 h-4" style={{ color: "#6B7F8E" }} />
      )}
      <span
        className="text-[0.8125rem]"
        style={{ color: simplified ? "#4A7FB5" : "#6B7F8E" }}
      >
        {simplified ? "Simplified" : "Simplified View"}
      </span>
      {/* Visual switch indicator */}
      <div
        className="relative w-8 h-[18px] rounded-full"
        style={{
          backgroundColor: simplified
            ? "rgba(74,127,181,0.3)"
            : "rgba(107,127,142,0.15)",
        }}
      >
        <motion.div
          className="absolute top-[2px] w-[14px] h-[14px] rounded-full"
          animate={{ left: simplified ? 15 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{
            backgroundColor: simplified ? "#4A7FB5" : "#6B7F8E",
          }}
        />
      </div>
    </motion.button>
  );
}