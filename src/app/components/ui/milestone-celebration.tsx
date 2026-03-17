import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Sparkles, Star } from "lucide-react";
import { bodyFont, headingFont } from "../../lib/fonts";

// ── Confetti colors from IK26 palette ──────────────────────────
const CONFETTI_COLORS = [
  "#CBA47A", // warm sand
  "#C08E7E", // dusty rose
  "#9FB0D4", // periwinkle
  "#4E8282", // medium teal
  "#D4B896", // light gold
  "#8AAD84", // sage
];

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.6,
    rotation: Math.random() * 360,
    size: 4 + Math.random() * 6,
  }));
}

// ── Celebration Toast Component ────────────────────────────────
// Shows a warm, branded celebration when a milestone is completed

interface MilestoneCelebrationProps {
  /** Whether the celebration is visible */
  show: boolean;
  /** Title of the milestone (e.g., "Concept Submitted") */
  title: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Callback when celebration completes */
  onComplete?: () => void;
  /** Duration in ms before auto-dismiss (default: 4000) */
  duration?: number;
}

export function MilestoneCelebration({
  show,
  title,
  subtitle,
  onComplete,
  duration = 4000,
}: MilestoneCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setConfetti(generateConfetti(24));
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-24 lg:bottom-8 left-1/2 z-[80] w-[90vw] max-w-sm"
          style={{ transform: "translateX(-50%)" }}
        >
          <div
            className="relative overflow-hidden rounded-2xl px-5 py-4"
            style={{
              background: "linear-gradient(135deg, #2E4F52 0%, #3D6B6B 100%)",
              border: "1px solid rgba(203,164,122,0.25)",
              boxShadow:
                "0 8px 32px rgba(46,79,82,0.3), 0 0 0 1px rgba(203,164,122,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Confetti particles */}
            {confetti.map((p) => (
              <motion.div
                key={p.id}
                initial={{
                  y: -10,
                  x: 0,
                  rotate: 0,
                  scale: 0,
                  opacity: 0,
                }}
                animate={{
                  y: 100,
                  x: (Math.random() - 0.5) * 40,
                  rotate: p.rotation,
                  scale: [0, 1, 0.4],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.6,
                  delay: p.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="absolute pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: -10,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.size > 7 ? "50%" : "1px",
                }}
              />
            ))}

            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(203,164,122,0.12) 0%, transparent 60%)",
              }}
            />

            <div className="relative flex items-center gap-3.5">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 12,
                }}
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{
                  background: "rgba(203,164,122,0.15)",
                  border: "1px solid rgba(203,164,122,0.2)",
                }}
              >
                <Sparkles
                  className="w-5 h-5"
                  style={{ color: "#CBA47A" }}
                />
              </motion.div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm font-semibold"
                  style={{
                    ...headingFont,
                    color: "rgba(240,244,246,0.95)",
                  }}
                >
                  {title}
                </motion.p>
                {subtitle && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-xs mt-0.5"
                    style={{
                      ...bodyFont,
                      color: "rgba(203,164,122,0.7)",
                    }}
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>

              {/* Check icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.4,
                  type: "spring",
                  stiffness: 300,
                  damping: 15,
                }}
              >
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: "rgba(138,173,132,0.9)" }}
                />
              </motion.div>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(203,164,122,0.6), rgba(192,142,126,0.6))",
              }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Hook for triggering celebrations ─────────────────────────────

interface CelebrationConfig {
  title: string;
  subtitle?: string;
  duration?: number;
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationConfig | null>(
    null
  );

  const celebrate = useCallback((config: CelebrationConfig) => {
    setCelebration(config);
  }, []);

  const dismiss = useCallback(() => {
    setCelebration(null);
  }, []);

  return { celebration, celebrate, dismiss };
}
