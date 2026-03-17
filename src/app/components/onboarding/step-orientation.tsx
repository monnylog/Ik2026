import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  Link2,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { SparkleEffect } from "./sparkle-effect";
import type { UserRole } from "./use-auth";
import { AddToHomeScreenCard } from "../ui/pwa-install";

interface OrientationStepProps {
  role: UserRole;
  onEnter: () => void;
}

import { bodyFont, headingFont } from "../../lib/fonts";

const allCards = [
  { id: "dashboard", icon: LayoutDashboard, title: "Dashboard", description: "Your at-a-glance view of event status, updates, and critical items" },
  { id: "roster", icon: Users, title: "Chef Roster / Team Deploy", description: "See who's involved, their profiles, travel status, and assignments" },
  { id: "menu", icon: UtensilsCrossed, title: "Menu & Courses", description: "The full 8-course lineup tied to Filipino-American history across the U.S." },
  { id: "community", icon: Heart, title: "Community", description: "Participant profiles, shared backgrounds, and team connections" },
  { id: "links", icon: Link2, title: "Links & Resources", description: "All working docs, Notion pages, and key references in one place" },
];

function getCardsForRole(role: UserRole) {
  switch (role) {
    case "leadership":
      return allCards;
    case "chef":
      return allCards.filter((c) => !["links"].includes(c.id));
    default:
      return allCards;
  }
}

export function OrientationStep({ role, onEnter }: OrientationStepProps) {
  const cards = getCardsForRole(role);
  const AUTO_CLOSE_SECONDS = 3;
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    // Start countdown quickly — cards animate fast
    const startDelay = setTimeout(() => {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!calledRef.current) {
              calledRef.current = true;
              onEnter();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 400);

    return () => {
      clearTimeout(startDelay);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onEnter]);

  const handleEnterNow = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!calledRef.current) {
      calledRef.current = true;
      onEnter();
    }
  };

  return (
    <div className="px-8 py-10 relative">
      <SparkleEffect />

      <div className="flex justify-center mb-6 relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 12 }}
          className="w-16 h-16 rounded-full flex items-center justify-center relative"
          style={{ backgroundColor: "rgba(126,158,120,0.1)", border: "1px solid rgba(126,158,120,0.2)" }}
        >
          <CheckCircle2 className="w-8 h-8 text-success" />
          <motion.div initial={{ scale: 1, opacity: 0.6 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.2, delay: 0.5 }} className="absolute inset-0 rounded-full" style={{ border: "2px solid rgba(126,158,120,0.3)" }} />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-foreground text-center mb-2 relative z-10"
        style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif", fontSize: "1.5rem" }}
      >
        Setup complete.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground text-center text-[0.875rem] mb-8 relative z-10"
        style={bodyFont}
      >
        {role === "chef"
          ? "Profile saved. Dashboard overview:"
          : "Dashboard overview:"}
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 relative z-10">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45 + idx * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(96,108,56,0.15)" }}
              className="p-4 rounded-xl border border-border cursor-default"
              style={{ backgroundColor: "rgba(221,207,195,0.3)" }}
            >
              <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-gold" />
              </div>
              <h4 className="text-foreground text-[0.875rem] mb-1" style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}>
                {card.title}
              </h4>
              <p className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>
                {card.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Add to Home Screen prompt */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mb-8 relative z-10"
      >
        <AddToHomeScreenCard compact />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="flex flex-col items-center gap-2 relative z-10"
      >
        <motion.button
          whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(96,108,56,0.3)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEnterNow}
          className="px-8 py-3 rounded-xl bg-gold text-white cursor-pointer relative overflow-hidden"
          style={{ ...bodyFont, fontSize: "0.9375rem" }}
        >
          <span className="relative z-10">Enter Dashboard</span>
          <motion.div
            animate={{ x: ["-100%", "250%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="absolute inset-0 w-1/3 skew-x-12"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)" }}
          />
          <motion.div
            animate={{ boxShadow: ["0 0 0 0 rgba(96,108,56,0.4)", "0 0 0 8px rgba(96,108,56,0)"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 rounded-xl"
          />
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-muted-foreground/50 text-[0.75rem]"
          style={bodyFont}
        >
          {countdown > 0
            ? `Auto-entering in ${countdown}s...`
            : "Entering dashboard..."}
        </motion.p>
      </motion.div>
    </div>
  );
}