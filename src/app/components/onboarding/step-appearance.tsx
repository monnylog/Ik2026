import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Check, ChevronRight, Sparkles } from "lucide-react";
import { themes, applyTheme, getSavedTheme, type ThemeId } from "./use-theme";

interface AppearanceStepProps {
  onNext: () => void;
  onBack: () => void;
}

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

export function AppearanceStep({ onNext, onBack }: AppearanceStepProps) {
  const [selected, setSelected] = useState<ThemeId>(getSavedTheme());
  const [hoveredId, setHoveredId] = useState<ThemeId | null>(null);

  const handleSelect = (id: ThemeId) => {
    setSelected(id);
    applyTheme(id);
  };

  const handleContinue = () => {
    applyTheme(selected);
    onNext();
  };

  return (
    <div className="px-8 py-10">
      {/* Header */}
      <div className="flex justify-center mb-5">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(96,108,56,0.1)", border: "1px solid rgba(96,108,56,0.2)" }}
        >
          <Palette className="w-7 h-7 text-gold" />
        </motion.div>
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-foreground text-center mb-1.5"
        style={{ ...headingFont, fontSize: "1.5rem" }}
      >
        Choose Your Palette
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-muted-foreground text-center text-[0.875rem] mb-2 max-w-md mx-auto"
        style={bodyFont}
      >
        Each Istorya chapter has a distinct palette. Select your preferred theme.
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-center text-[0.75rem] mb-8"
        style={{ ...bodyFont, color: "rgba(126,158,120,0.8)" }}
      >
        <Sparkles className="w-3 h-3 inline-block mr-1 -mt-0.5" />
        Changeable anytime in settings
      </motion.p>

      {/* Palette grid */}
      <div className="grid grid-cols-1 gap-3 mb-8">
        {themes.map((theme, idx) => {
          const isSelected = selected === theme.id;
          const isHovered = hoveredId === theme.id;

          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.07, duration: 0.35 }}
              onClick={() => handleSelect(theme.id)}
              onMouseEnter={() => setHoveredId(theme.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="relative w-full text-left rounded-xl p-4 cursor-pointer group"
              style={{
                backgroundColor: isSelected
                  ? theme.colors.card
                  : isHovered
                    ? `${theme.colors.card}88`
                    : "rgba(221,207,195,0.25)",
                border: isSelected
                  ? `2px solid ${theme.colors.primary}`
                  : "2px solid rgba(0,0,0,0)",
                boxShadow: isSelected
                  ? `0 4px 20px ${theme.colors.primary}22, 0 0 0 1px ${theme.colors.primary}33`
                  : "none",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Swatch strip */}
                <div className="flex items-center gap-0 shrink-0">
                  {theme.swatches.map((color, si) => (
                    <motion.div
                      key={si}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.07 + si * 0.04, type: "spring", stiffness: 300, damping: 15 }}
                      className="relative"
                      style={{
                        width: si === 0 ? 28 : 22,
                        height: si === 0 ? 28 : 22,
                        backgroundColor: color,
                        borderRadius: si === 0 ? 8 : "50%",
                        marginLeft: si === 0 ? 0 : -6,
                        zIndex: 5 - si,
                        border: `2px solid ${isSelected ? theme.colors.card : "rgba(255,255,255,0.6)"}`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                    />
                  ))}
                </div>

                {/* Text info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-foreground text-[0.9375rem]"
                      style={headingFont}
                    >
                      {theme.name}
                    </span>
                    <span
                      className="text-[0.625rem] tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
                      style={{
                        ...bodyFont,
                        backgroundColor: isSelected
                          ? `${theme.colors.primary}18`
                          : "rgba(0,0,0,0.04)",
                        color: isSelected
                          ? theme.colors.primary
                          : "rgba(0,0,0,0.35)",
                      }}
                    >
                      {theme.chapter}
                    </span>
                  </div>
                  <p
                    className="text-muted-foreground text-[0.75rem] truncate"
                    style={bodyFont}
                  >
                    {theme.tagline}
                  </p>
                </div>

                {/* Selection indicator */}
                <div className="shrink-0">
                  <AnimatePresence mode="wait">
                    {isSelected ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 15 }}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary }}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-7 h-7 rounded-full"
                        style={{ border: "2px solid rgba(0,0,0,0.1)" }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Expanded mini-preview for selected theme */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${theme.colors.primary}22` }}>
                      {/* Mini dashboard preview */}
                      <div className="flex gap-2 h-16 rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.colors.border}` }}>
                        {/* Mini sidebar */}
                        <div
                          className="w-10 shrink-0 flex flex-col items-center py-2 gap-1.5"
                          style={{ backgroundColor: theme.colors.sidebar }}
                        >
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: theme.colors.primary, opacity: 0.8 }} />
                          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: theme.colors.sidebarForeground, opacity: 0.3 }} />
                          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: theme.colors.sidebarForeground, opacity: 0.2 }} />
                          <div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: theme.colors.sidebarForeground, opacity: 0.15 }} />
                        </div>
                        {/* Mini content */}
                        <div
                          className="flex-1 p-2 flex flex-col gap-1.5"
                          style={{ backgroundColor: theme.colors.background }}
                        >
                          <div className="flex gap-1.5">
                            <div className="flex-1 h-5 rounded" style={{ backgroundColor: theme.colors.card }} />
                            <div className="flex-1 h-5 rounded" style={{ backgroundColor: theme.colors.card }} />
                            <div className="flex-1 h-5 rounded" style={{ backgroundColor: theme.colors.card }} />
                          </div>
                          <div className="flex-1 rounded" style={{ backgroundColor: theme.colors.card }}>
                            <div className="flex items-center gap-1 p-1">
                              <div className="w-2 h-2 rounded" style={{ backgroundColor: theme.colors.primary, opacity: 0.6 }} />
                              <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: theme.colors.mutedForeground, opacity: 0.2 }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex items-center justify-between"
      >
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-muted-foreground hover:text-foreground text-[0.875rem] transition-colors cursor-pointer rounded-lg hover:bg-secondary"
          style={bodyFont}
        >
          Back
        </button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-white cursor-pointer"
          style={{ ...bodyFont, fontSize: "0.9375rem" }}
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}