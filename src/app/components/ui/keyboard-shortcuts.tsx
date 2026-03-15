import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Bell,
  ArrowUp,
  Command,
  Keyboard,
  Plus,
  CheckSquare,
  ClipboardList,
  Calendar,
  Flame,
  CalendarDays,
  Users,
} from "lucide-react";
import { BUILD_ID } from "../../lib/version";
import { useFocusTrap } from "../../lib/use-focus-trap";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ShortcutItem {
  keys: string[];
  description: string;
  icon?: typeof Search;
  category: "navigation" | "actions" | "general";
}

const shortcuts: ShortcutItem[] = [
  // Navigation
  { keys: ["Ctrl", "K"], description: "Open global search", icon: Search, category: "navigation" },
  { keys: ["/"], description: "Focus search (alternative)", icon: Search, category: "navigation" },
  { keys: ["G", "D"], description: "Go to Dashboard", icon: LayoutDashboard, category: "navigation" },
  { keys: ["G", "T"], description: "Go to Task Board", icon: ClipboardList, category: "navigation" },
  { keys: ["G", "C"], description: "Go to Checklist", icon: CheckSquare, category: "navigation" },
  { keys: ["G", "S"], description: "Go to Settings", icon: Settings, category: "navigation" },
  { keys: ["G", "M"], description: "Go to Comms", icon: MessageCircle, category: "navigation" },
  { keys: ["G", "E"], description: "Go to Event Timeline", icon: CalendarDays, category: "navigation" },
  { keys: ["G", "R"], description: "Go to Chef Roster", icon: Users, category: "navigation" },
  { keys: ["G", "X"], description: "Go to Mission Control", icon: Flame, category: "navigation" },

  // Actions
  { keys: ["N"], description: "New task (on Task Board)", icon: Plus, category: "actions" },
  { keys: ["B"], description: "Open notifications", icon: Bell, category: "actions" },
  { keys: ["Esc"], description: "Close dialog / panel", category: "actions" },

  // General
  { keys: ["?"], description: "Show keyboard shortcuts", icon: Keyboard, category: "general" },
  { keys: ["↑"], description: "Scroll to top (on pages)", icon: ArrowUp, category: "general" },
];

const categoryLabels: Record<string, string> = {
  navigation: "Navigation",
  actions: "Actions",
  general: "General",
};

const categoryColors: Record<string, string> = {
  navigation: "#7E9E78",
  actions: "#CDA88A",
  general: "#6B7F8E",
};

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

function KeyBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-md text-[0.6875rem] font-medium"
      style={{
        backgroundColor: "rgba(126,158,120,0.06)",
        border: "1px solid rgba(61,82,77,0.12)",
        color: "#3D524D",
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: "0 1px 1px rgba(0,0,0,0.04)",
      }}
    >
      {label}
    </span>
  );
}

export function KeyboardShortcuts({ open, onClose }: KeyboardShortcutsProps) {
  const categories = ["navigation", "actions", "general"];
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          ref={trapRef}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(40,54,24,0.35)", backdropFilter: "blur(4px)" }} />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{
                background: "linear-gradient(135deg, rgba(61,82,77,0.04) 0%, rgba(126,158,120,0.04) 100%)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(126,158,120,0.06)" }}
                >
                  <Keyboard className="w-4 h-4" style={{ color: "#3D524D" }} />
                </div>
                <div>
                  <h2 className="text-foreground text-[1rem]" style={headingFont}>
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                    Navigate faster with your keyboard
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                aria-label="Close shortcuts dialog"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
              {categories.map((cat) => {
                const items = shortcuts.filter((s) => s.category === cat);
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: categoryColors[cat] }}
                      />
                      <span
                        className="text-[0.6875rem] uppercase tracking-wider"
                        style={{ color: categoryColors[cat], ...bodyFont, fontWeight: 600 }}
                      >
                        {categoryLabels[cat]}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.icon && (
                              <item.icon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: categoryColors[cat], opacity: 0.6 }}
                              />
                            )}
                            <span
                              className="text-foreground text-[0.8125rem]"
                              style={bodyFont}
                            >
                              {item.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, ki) => (
                              <span key={ki} className="flex items-center gap-0.5">
                                {ki > 0 && (
                                  <span className="text-muted-foreground/30 text-[0.625rem] mx-0.5">+</span>
                                )}
                                <KeyBadge label={key} />
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{
                borderTop: "1px solid var(--border)",
                backgroundColor: "rgba(230,224,210,0.3)",
              }}
            >
              <span className="text-muted-foreground/30 text-[0.5625rem]" style={bodyFont}>
                {BUILD_ID}
              </span>
              <span className="text-muted-foreground/50 text-[0.6875rem]" style={bodyFont}>
                Press <KeyBadge label="?" /> anywhere to toggle this dialog
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage global keyboard shortcuts.
 * Returns the shortcuts dialog open state and a toggle function.
 */
export function useKeyboardShortcuts(onNavigate?: (page: string) => void, onAction?: (action: string) => void) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [gPending, setGPending] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when focused on inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      // ? key - shortcuts dialog (works everywhere except inputs)
      if (e.key === "?" && !isEditable) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      // All other shortcuts don't work in editable fields
      if (isEditable) return;

      // Escape closes shortcuts dialog
      if (e.key === "Escape" && shortcutsOpen) {
        e.preventDefault();
        setShortcutsOpen(false);
        return;
      }

      // / key — focus search (dispatch Ctrl+K event for GlobalSearch)
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Simulate Ctrl+K to open GlobalSearch
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
        return;
      }

      // N key — new task (navigate to Task Board)
      if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey && onNavigate) {
        e.preventDefault();
        onNavigate("Task Board");
        return;
      }

      // B key — open notifications
      if ((e.key === "b" || e.key === "B") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Dispatch custom event for TopBar to pick up
        window.dispatchEvent(new CustomEvent("ik26-toggle-notifications"));
        return;
      }

      // G + key combos for navigation
      if (e.key === "g" || e.key === "G") {
        if (!gPending) {
          setGPending(true);
          setTimeout(() => setGPending(false), 800);
          return;
        }
      }

      if (gPending && onNavigate) {
        setGPending(false);
        switch (e.key) {
          case "d":
          case "D":
            e.preventDefault();
            onNavigate("Dashboard");
            return;
          case "t":
          case "T":
            e.preventDefault();
            onNavigate("Task Board");
            return;
          case "c":
          case "C":
            e.preventDefault();
            onNavigate("Pre-Event Checklist");
            return;
          case "s":
          case "S":
            e.preventDefault();
            onNavigate("Settings");
            return;
          case "m":
          case "M":
            e.preventDefault();
            onNavigate("Comms");
            return;
          case "e":
          case "E":
            e.preventDefault();
            onNavigate("Event Timeline");
            return;
          case "r":
          case "R":
            e.preventDefault();
            onNavigate("Chef Roster");
            return;
          case "x":
          case "X":
            e.preventDefault();
            onNavigate("Mission Control");
            return;
        }
      }
    },
    [gPending, onNavigate, onAction, shortcutsOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcutsOpen,
    setShortcutsOpen,
    toggleShortcuts: () => setShortcutsOpen((p) => !p),
  };
}