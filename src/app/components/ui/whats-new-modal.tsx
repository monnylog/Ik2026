import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  X,
  Bell,
  GripVertical,
  Timer,
  Volume2,
  Newspaper,
  Wifi,
  ArrowUp,
  Smartphone,
  Zap,
  Accessibility,
  Type,
} from "lucide-react";

import { useFocusTrap } from "../../lib/use-focus-trap";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const CURRENT_VERSION = "2.9.0";
const STORAGE_KEY = "ik26_changelog_seen_version";

interface ChangelogEntry {
  icon: typeof Sparkles;
  title: string;
  description: string;
  color: string;
  tag?: string;
}

const changelog: ChangelogEntry[] = [
  {
    icon: Type,
    title: "Degular Typography Update (v1.2.2)",
    description:
      "Replaced Maragsa/Playfair Display with Degular as the primary heading font across all 94 references in 83 files. Old fonts retained as fallbacks in the stack for graceful degradation.",
    color: "#CDA88A",
    tag: "New",
  },
  {
    icon: Zap,
    title: "Deep Motion Cleanup (v1.2.1)",
    description:
      "Completed thorough audit of all motion.* elements across 12+ files — removed remaining transition-colors/transition-all CSS classes that competed with Motion's animation engine. Dashboard widgets now use safe onMouseEnter/onMouseLeave patterns.",
    color: "#C9A96E",
    tag: "Fix",
  },
  {
    icon: Zap,
    title: "Animation Stability Fix",
    description:
      "Resolved Framer Motion errors caused by Tailwind v4 oklab() color values. All motion elements now use explicit rgba() inline styles for buttery-smooth animations.",
    color: "#C9A96E",
    tag: "Fix",
  },
  {
    icon: Accessibility,
    title: "Enhanced Motion Accessibility",
    description:
      "Replaced 10+ files worth of hover:bg-* and transition-colors classes on motion elements with proper whileHover props — smoother, more accessible interactions throughout.",
    color: "#7E9E78",
    tag: "Fix",
  },
  {
    icon: Newspaper,
    title: "What's New Changelog Modal",
    description:
      "You're looking at it! A versioned changelog that shows once per update so you always know what's new.",
    color: "#CDA88A",
    tag: "New",
  },
  {
    icon: Volume2,
    title: "Chat Notification Sounds",
    description:
      "Hear a gentle chime when new messages arrive in Comms. Toggle on/off in Profile Settings.",
    color: "#7E9E78",
    tag: "New",
  },
  {
    icon: GripVertical,
    title: "Drag-to-Reorder Favorites",
    description:
      "Reorder your pinned sidebar pages by dragging them into your preferred order.",
    color: "#7E9E78",
  },
  {
    icon: Timer,
    title: "Session Timeout Warning",
    description:
      "A gentle reminder appears after 30 minutes of inactivity — stay logged in or sign out safely.",
    color: "#CDA88A",
  },
  {
    icon: Smartphone,
    title: "Enhanced Mobile Navigation",
    description:
      "Redesigned bottom nav with 4 primary tabs and a 'More' overflow panel for all role-appropriate pages.",
    color: "#8B96C4",
  },
  {
    icon: Wifi,
    title: "Network Status Banner",
    description:
      "Automatically detects when you go offline and confirms when you're back online.",
    color: "#C27B6B",
  },
  {
    icon: ArrowUp,
    title: "Scroll-to-Top Button",
    description:
      "A floating button appears after scrolling down on the Dashboard for quick return to top.",
    color: "#A3B898",
  },
  {
    icon: Bell,
    title: "Unread Badge on Comms Tab",
    description:
      "Mobile bottom nav now shows an unread notification dot when new chat messages arrive.",
    color: "#C9A96E",
  },
];

interface WhatsNewModalProps {
  onDismiss?: () => void;
}

export function useWhatsNewModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seenVersion = localStorage.getItem(STORAGE_KEY);
      if (seenVersion !== CURRENT_VERSION) {
        // Small delay so the dashboard renders first
        const timer = setTimeout(() => setOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    } catch {}
  };

  return { open, dismiss };
}

export function WhatsNewModal({
  open,
  onDismiss,
}: {
  open: boolean;
  onDismiss: () => void;
}) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onDismiss();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={onDismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="changelog-title"
          ref={trapRef}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ border: "1px solid rgba(201,169,110,0.15)" }}
          >
            {/* Gold accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, #C9A96E 0%, #CDA88A 50%, #7E9E78 100%)",
              }}
            />

            {/* Header */}
            <div className="px-6 pt-5 pb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,169,110,0.15) 0%, rgba(205,168,138,0.1) 100%)",
                    border: "1px solid rgba(201,169,110,0.2)",
                  }}
                >
                  <Sparkles
                    className="w-5 h-5"
                    style={{ color: "#C9A96E" }}
                  />
                </div>
                <div>
                  <h2
                    id="changelog-title"
                    className="text-foreground text-[1.125rem]"
                    style={headingFont}
                  >
                    What's New
                  </h2>
                  <span
                    className="text-[0.6875rem] text-muted-foreground/60"
                    style={bodyFont}
                  >
                    Version {CURRENT_VERSION} · March 2026
                  </span>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </div>

            {/* Changelog entries */}
            <div className="px-4 pb-2 max-h-[50vh] overflow-y-auto">
              <div className="space-y-1">
                {changelog.map((entry, idx) => {
                  const Icon = entry.icon;
                  return (
                    <motion.div
                      key={entry.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.15 + idx * 0.04,
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${entry.color}15`,
                        }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: entry.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-foreground text-[0.8125rem] font-medium"
                            style={bodyFont}
                          >
                            {entry.title}
                          </span>
                          {entry.tag && (
                            <span
                              className="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider"
                              style={{
                                backgroundColor: `${entry.color}15`,
                                color: entry.color,
                                ...bodyFont,
                              }}
                            >
                              {entry.tag}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-muted-foreground text-[0.6875rem] leading-relaxed"
                          style={bodyFont}
                        >
                          {entry.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/30">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDismiss}
                className="w-full py-2.5 rounded-xl text-[0.875rem] font-medium cursor-pointer"
                style={{
                  backgroundColor: "rgba(201,169,110,0.12)",
                  color: "#C9A96E",
                  border: "1px solid rgba(201,169,110,0.2)",
                  ...bodyFont,
                }}
              >
                Got it ✨
              </motion.button>
              <p
                className="text-center text-muted-foreground/30 text-[0.5625rem] mt-2"
                style={bodyFont}
              >
                Isang Kusina 2026 — isangkusina.com
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}