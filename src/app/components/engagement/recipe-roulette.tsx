import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dices, RefreshCw, Sparkles } from "lucide-react";
import { apiFetch } from "../../lib/supabase";
import { bodyFont, headingFont } from "../../lib/fonts";

// Roulette categories
const proteins = [
  "Bangus (Milkfish)", "Pork Belly", "Chicken Adobo-style", "Prawns",
  "Ox Tail", "Duck Leg", "Squid", "Goat", "Tofu", "Mussels",
];

const techniques = [
  "Kinilaw (Ceviche)", "Inihaw (Grilled)", "Pinakbet-style Braised",
  "Sinigang (Sour Soup)", "Adobo (Vinegar-braised)", "Ginataan (Coconut-stewed)",
  "Tinola (Ginger Broth)", "Bistek (Pan-seared)", "Lechon (Roasted)",
  "Ensalada (Fresh Salad)",
];

const regions = [
  "Ilocos", "Pampanga", "Bicol", "Visayas", "Mindanao",
  "Metro Manila", "Batangas", "Pangasinan", "Cebu", "Zamboanga",
];

const wildcards = [
  "Must include a pickled element", "Use banana leaves for presentation",
  "Incorporate a childhood snack", "Feature a fermented ingredient",
  "Include something sweet and savory", "Must be shareable kamayan-style",
  "Use a tropical fruit as garnish", "Include a vinegar from a specific region",
  "Cook with coconut in any form", "Add an unexpected citrus note",
];

interface RouletteResult {
  protein: string;
  technique: string;
  region: string;
  wildcard: string;
}

function spin(): RouletteResult {
  return {
    protein: proteins[Math.floor(Math.random() * proteins.length)],
    technique: techniques[Math.floor(Math.random() * techniques.length)],
    region: regions[Math.floor(Math.random() * regions.length)],
    wildcard: wildcards[Math.floor(Math.random() * wildcards.length)],
  };
}

const slotLabels: { key: keyof RouletteResult; label: string; color: string; emoji: string }[] = [
  { key: "protein", label: "Protein", color: "#CDA88A", emoji: "🥩" },
  { key: "technique", label: "Technique", color: "#C9A96E", emoji: "🔥" },
  { key: "region", label: "Region", color: "#3B6298", emoji: "🏝️" },
  { key: "wildcard", label: "Wild Card", color: "#7E9E78", emoji: "✦" },
];

export function RecipeRoulette() {
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const handleSpin = useCallback(() => {
    setSpinning(true);
    setAnimKey((k) => k + 1);

    // Brief delay for animation feel
    setTimeout(() => {
      const newResult = spin();
      setResult(newResult);
      setSpinning(false);
      
      // Track the spin for analytics (TIER 4A)
      const spinId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      apiFetch("/recipe-spins", {
        method: "POST",
        body: JSON.stringify({
          id: spinId,
          userId: typeof window !== "undefined" ? localStorage.getItem("userId") || "anonymous" : "anonymous",
          recipe: `${newResult.protein} / ${newResult.technique} / ${newResult.region}`,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => console.error("Failed to track recipe spin:", err));
    }, 600);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(43,68,100,0.1)" }}
    >
      <div
        className="p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(43,68,100,0.03) 0%, rgba(205,168,138,0.02) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(43,68,100,0.08)" }}
            >
              <Dices className="w-3.5 h-3.5" style={{ color: "#3B6298" }} />
            </div>
            <div>
              <span
                className="text-foreground text-[0.8125rem]"
                style={headingFont}
              >
                Recipe Roulette
              </span>
            </div>
          </div>
        </div>

        <p
          className="text-muted-foreground/50 text-[0.6875rem] mb-3"
          style={bodyFont}
        >
          Spin for a random recipe challenge. No stakes — just creative
          inspiration.
        </p>

        {/* Spin button */}
        <div className="flex justify-center mb-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSpin}
            disabled={spinning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] text-white cursor-pointer transition-opacity"
            style={{
              backgroundColor: spinning ? "#6B7F8E" : "#3B6298",
              ...bodyFont,
            }}
          >
            {spinning ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                Spinning...
              </>
            ) : (
              <>
                <Dices className="w-4 h-4" />
                {result ? "Spin Again" : "Spin the Roulette"}
              </>
            )}
          </motion.button>
        </div>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && !spinning && (
            <motion.div
              key={animKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, staggerChildren: 0.08 }}
              className="space-y-1.5"
            >
              {slotLabels.map((slot, idx) => (
                <motion.div
                  key={slot.key}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.3 }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{
                    backgroundColor: `${slot.color}06`,
                    border: `1px solid ${slot.color}15`,
                  }}
                >
                  <span className="text-[0.875rem] shrink-0">{slot.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[0.5625rem] uppercase tracking-[0.08em] block"
                      style={{ color: `${slot.color}90`, ...bodyFont }}
                    >
                      {slot.label}
                    </span>
                    <span
                      className="text-foreground text-[0.8125rem]"
                      style={bodyFont}
                    >
                      {result[slot.key]}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Creative prompt */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-2 mt-2 p-2.5 rounded-xl"
                style={{
                  backgroundColor: "rgba(205,168,138,0.05)",
                  border: "1px solid rgba(205,168,138,0.12)",
                }}
              >
                <Sparkles
                  className="w-3 h-3 shrink-0 mt-0.5"
                  style={{ color: "#C9A96E" }}
                />
                <p
                  className="text-muted-foreground/60 text-[0.6875rem] italic leading-relaxed"
                  style={headingFont}
                >
                  How would a chef from {result.region} approach{" "}
                  {result.protein.toLowerCase()} using the {result.technique.toLowerCase()} method?
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}