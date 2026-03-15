import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import istoryaLogo from "@/assets/b55bcac066687e563f77685fc31f20ef43e81d5d.png";

const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1800 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const holdTimer = setTimeout(() => setPhase("hold"), 400);
    const exitTimer = setTimeout(() => setPhase("exit"), minDuration - 500);
    const completeTimer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, minDuration);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, minDuration]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        animate={phase === "exit" ? { opacity: 0, scale: 1.02 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(43, 68, 64, 1)",
          background: "radial-gradient(ellipse at 50% 40%, rgba(126,158,120,0.25) 0%, rgba(61,82,77,1) 70%)",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        role="status"
        aria-label="Loading Isang Kusina 2026"
      >
        {/* Subtle ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 60%)",
          }}
        />

        <div className="flex flex-col items-center gap-6 relative">
          {/* Logo with entrance animation */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              delay: 0.15,
              type: "spring",
              stiffness: 160,
              damping: 14,
            }}
            className="relative"
          >
            {/* Glow ring behind logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.3 }}
              transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(201,169,110,0.2) 0%, transparent 70%)",
                width: 100,
                height: 100,
                top: -14,
                left: -14,
              }}
            />
            <img
              src={istoryaLogo}
              alt=""
              className="w-[72px] h-[72px] relative z-10"
              width={72}
              height={72}
              style={{ filter: "drop-shadow(0 4px 20px rgba(201,169,110,0.3))" }}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h1
              className="mb-1"
              style={{
                ...headingFont,
                fontSize: "1.75rem",
                lineHeight: 1.2,
                color: "rgba(192, 209, 177, 0.95)",
              }}
            >
              Isang Kusina{" "}
              <span style={{ color: "rgba(212, 168, 67, 0.95)" }}>2026</span>
            </h1>
            <p
              className="text-[0.8125rem]"
              style={{
                ...bodyFont,
                color: "rgba(192, 209, 177, 0.5)",
              }}
            >
              A Filipino Chefs Collaboration Dinner
            </p>
          </motion.div>

          {/* Animated loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-1.5 mt-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "rgba(212, 168, 67, 0.6)" }}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center"
        >
          <span
            className="text-[0.625rem] uppercase tracking-[0.2em]"
            style={{
              ...bodyFont,
              color: "rgba(192, 209, 177, 0.2)",
            }}
          >
            Istorya Creative
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}