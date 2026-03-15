import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
}

export function SparkleEffect() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const colors = [
      "#7E9E78",
      "#D4AA7C",
      "#FDFAF4",
      "#2E3830",
      "#CDA88A",
      "#EDCBC8",
      "#C9A96E",
      "#8B96C4",
    ];
    const initial: Sparkle[] = [];
    for (let i = 0; i < 28; i++) {
      initial.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 3,
        delay: Math.random() * 0.8,
        duration: Math.random() * 1.2 + 0.6,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setSparkles(initial);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
              rotate: [0, 180],
              y: [0, -30 - Math.random() * 40],
            }}
            transition={{
              delay: s.delay,
              duration: s.duration,
              ease: "easeOut",
            }}
            className="absolute"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
            }}
          >
            <svg viewBox="0 0 24 24" fill={s.color}>
              <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}