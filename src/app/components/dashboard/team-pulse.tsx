import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Sparkles } from "lucide-react";
import { useUserData } from "../../lib/use-user-data";
import { bodyFont, headingFont } from "../../lib/fonts";

interface MoodOption {
  emoji: string;
  label: string;
  color: string;
  bg: string;
}

const moods: MoodOption[] = [
  { emoji: "\u{1F525}", label: "Energized", color: "#D4A67D", bg: "rgba(212,166,125,0.10)" },
  { emoji: "\u{1F60A}", label: "Good", color: "#8AAD84", bg: "rgba(138,173,132,0.10)" },
  { emoji: "\u{1F914}", label: "Focused", color: "#8B7EC8", bg: "rgba(139,126,200,0.10)" },
  { emoji: "\u{1F60C}", label: "Calm", color: "#7EAAB5", bg: "rgba(126,170,181,0.10)" },
  { emoji: "\u{1F62A}", label: "Tired", color: "#A89585", bg: "rgba(168,149,133,0.10)" },
];

// Simulated team pulse data (in production, this would come from aggregated KV)
function getTeamPulse(userMood: string | null) {
  // Deterministic "team" data seeded by today's date
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);

  const distribution = moods.map((m, i) => {
    const base = [28, 32, 18, 14, 8]; // weighted toward positive
    const jitter = ((seed * (i + 1)) % 7) - 3;
    return Math.max(2, base[i] + jitter);
  });

  // If user has checked in, bump their mood's count
  if (userMood) {
    const idx = moods.findIndex((m) => m.label === userMood);
    if (idx >= 0) distribution[idx] += 1;
  }

  const total = distribution.reduce((a, b) => a + b, 0);
  const percentages = distribution.map((d) => Math.round((d / total) * 100));

  // Find dominant mood
  const maxIdx = distribution.indexOf(Math.max(...distribution));

  return {
    distribution: percentages,
    dominant: moods[maxIdx],
    totalCheckins: 8 + ((seed % 5) + (userMood ? 1 : 0)),
  };
}

// Encouraging messages per dominant mood
const encouragements: Record<string, string> = {
  Energized: "The team is fired up \u2014 let's channel that energy.",
  Good: "Positive vibes across the board today.",
  Focused: "Heads down, great work happening.",
  Calm: "Steady and grounded \u2014 just right.",
  Tired: "It's okay to pace yourself. Rest is productive too.",
};

interface TeamPulseProps {
  onNavigate?: (page: string) => void;
}

export function TeamPulse({ onNavigate }: TeamPulseProps) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [checkedMood, setCheckedMood] = useUserData<string | null>(
    `pulse-${todayKey}`,
    null
  );
  const [justChecked, setJustChecked] = useState(false);
  const [showThank, setShowThank] = useState(false);

  const pulse = useMemo(() => getTeamPulse(checkedMood), [checkedMood]);

  const handleCheckIn = (mood: MoodOption) => {
    if (checkedMood) return; // Already checked in today
    setCheckedMood(mood.label);
    setJustChecked(true);
  };

  useEffect(() => {
    if (justChecked) {
      const t = setTimeout(() => {
        setShowThank(true);
        setJustChecked(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [justChecked]);

  useEffect(() => {
    if (showThank) {
      const t = setTimeout(() => setShowThank(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showThank]);

  return (
    <div
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(140,165,135,0.08)" }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <div
            className="w-1 h-4 rounded-full"
            style={{ backgroundColor: "#D0897A" }}
          />
          <h3
            className="text-foreground text-[0.875rem]"
            style={headingFont}
          >
            Team Pulse
          </h3>
          <span
            className="text-[0.625rem] px-1.5 py-0.5 rounded-full ml-auto"
            style={{
              backgroundColor: "rgba(208,137,122,0.08)",
              color: "#D0897A",
              ...bodyFont,
            }}
          >
            Daily
          </span>
        </div>
        <p
          className="text-muted-foreground text-[0.6875rem] ml-3"
          style={bodyFont}
        >
          {checkedMood
            ? encouragements[pulse.dominant.label]
            : "How are you feeling today?"}
        </p>
      </div>

      {/* Mood buttons */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-1.5">
          {moods.map((mood, i) => {
            const isSelected = checkedMood === mood.label;
            const isLocked = !!checkedMood && !isSelected;
            return (
              <motion.button
                key={mood.label}
                whileHover={!checkedMood ? { scale: 1.08 } : undefined}
                whileTap={!checkedMood ? { scale: 0.92 } : undefined}
                onClick={() => handleCheckIn(mood)}
                disabled={!!checkedMood}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                  isLocked ? "opacity-40" : ""
                }`}
                style={{
                  backgroundColor: isSelected ? mood.bg : "transparent",
                  border: isSelected
                    ? `1px solid ${mood.color}30`
                    : "1px solid transparent",
                }}
                aria-label={`Check in as ${mood.label}`}
              >
                <motion.span
                  className="text-[1.25rem] leading-none"
                  animate={
                    isSelected
                      ? { scale: [1, 1.2, 1] }
                      : undefined
                  }
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {mood.emoji}
                </motion.span>
                <span
                  className="text-[0.5625rem] leading-tight"
                  style={{
                    color: isSelected ? mood.color : undefined,
                    fontWeight: isSelected ? 600 : 400,
                    ...bodyFont,
                  }}
                >
                  {mood.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Thank you message */}
      <AnimatePresence>
        {showThank && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 overflow-hidden"
          >
            <div
              className="flex items-center gap-2 py-2.5 px-3 rounded-lg mb-3"
              style={{
                backgroundColor: "rgba(138,173,132,0.06)",
                border: "1px solid rgba(138,173,132,0.12)",
              }}
            >
              <Sparkles className="w-3 h-3" style={{ color: "#C9A96E" }} />
              <span
                className="text-[0.6875rem]"
                style={{ color: "#7E9E78", ...bodyFont }}
              >
                Thanks for checking in
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team aggregate — visible after check-in */}
      {checkedMood && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="px-4 pb-4"
        >
          {/* Distribution bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[0.625rem] text-muted-foreground"
                style={bodyFont}
              >
                Team energy today
              </span>
              <span
                className="text-[0.625rem] text-muted-foreground"
                style={bodyFont}
              >
                {pulse.totalCheckins} check-ins
              </span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              {pulse.distribution.map((pct, i) => (
                <motion.div
                  key={moods[i].label}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    delay: 0.6 + i * 0.08,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="rounded-full"
                  style={{ backgroundColor: moods[i].color, opacity: 0.7 }}
                  title={`${moods[i].label}: ${pct}%`}
                />
              ))}
            </div>
          </div>

          {/* Dominant mood summary */}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[0.75rem]">{pulse.dominant.emoji}</span>
            <span
              className="text-[0.6875rem] text-muted-foreground"
              style={bodyFont}
            >
              Most of the team is feeling{" "}
              <span style={{ color: pulse.dominant.color, fontWeight: 500 }}>
                {pulse.dominant.label.toLowerCase()}
              </span>
            </span>
          </div>
        </motion.div>
      )}

      {/* Gentle footer */}
      {!checkedMood && (
        <div
          className="px-4 py-2.5"
          style={{
            borderTop: "1px solid rgba(140,165,135,0.04)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-muted-foreground/40" />
            <span
              className="text-[0.625rem] text-muted-foreground/60"
              style={bodyFont}
            >
              Tap to share \u2014 your check-in is anonymous
            </span>
          </div>
        </div>
      )}
    </div>
  );
}