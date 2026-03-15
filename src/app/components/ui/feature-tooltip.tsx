import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

/* ── Storage key per role ── */
function getStorageKey(role: string) {
  return `ik26_tooltips_${role}_seen`;
}

function getSeenTooltips(role: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey(role)) || "[]");
  } catch {
    return [];
  }
}

function markTooltipSeen(role: string, id: string) {
  const seen = getSeenTooltips(role);
  if (!seen.includes(id)) {
    seen.push(id);
    localStorage.setItem(getStorageKey(role), JSON.stringify(seen));
  }
}

function markAllSeen(role: string, ids: string[]) {
  localStorage.setItem(getStorageKey(role), JSON.stringify(ids));
}

/* ── Tooltip definitions per role ── */
export interface TooltipDef {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

export const roleTooltips: Record<string, TooltipDef[]> = {
  leadership: [
    {
      id: "ldr-dashboard",
      targetSelector: "#main-content",
      title: "Your Command Center",
      description: "This dashboard gives you a bird's-eye view of all event preparation. KPIs, milestones, and team progress are all here.",
      position: "bottom",
    },
    {
      id: "ldr-kpi",
      targetSelector: "[data-tooltip-id='kpi-cards']",
      title: "Key Metrics at a Glance",
      description: "Track confirmed chefs, guests, travel bookings, and critical gaps. These update in real-time from Notion.",
      position: "bottom",
    },
    {
      id: "ldr-action",
      targetSelector: "[data-tooltip-id='action-needed']",
      title: "Action Items",
      description: "Items needing your attention surface here. Address them to keep things on track.",
      position: "top",
    },
  ],
  team: [
    {
      id: "team-dashboard",
      targetSelector: "#main-content",
      title: "Your Team Hub",
      description: "Everything you need to support the event — your tasks, checklists, and team updates are organized here.",
      position: "bottom",
    },
    {
      id: "team-tasks",
      targetSelector: "[data-tooltip-id='my-tasks']",
      title: "Your Tasks",
      description: "Tasks assigned to you appear here. Check them off as you complete them.",
      position: "bottom",
    },
  ],
  chef: [
    {
      id: "chef-dashboard",
      targetSelector: "#main-content",
      title: "Welcome, Chef!",
      description: "This is your personal hub for Isang Kusina 2026. Track your progress, submit dishes, and connect with the team.",
      position: "bottom",
    },
    {
      id: "chef-progress",
      targetSelector: "[data-tooltip-id='chef-progress']",
      title: "Your Submission Progress",
      description: "See what steps you've completed and what's still needed. We'll guide you through everything.",
      position: "bottom",
    },
    {
      id: "chef-submit",
      targetSelector: "[data-tooltip-id='quick-actions']",
      title: "Submit Your Menu",
      description: "When you're ready, use the quick action to submit your dish details, story, and ingredients.",
      position: "bottom",
    },
  ],
};

/* ── Context ── */
interface TooltipWalkthroughContextType {
  startWalkthrough: () => void;
  isActive: boolean;
}

const TooltipWalkthroughContext = createContext<TooltipWalkthroughContextType>({
  startWalkthrough: () => {},
  isActive: false,
});

export function useTooltipWalkthrough() {
  return useContext(TooltipWalkthroughContext);
}

/* ── Provider ── */
interface TooltipWalkthroughProviderProps {
  role: string;
  children: ReactNode;
  enabled?: boolean;
}

export function TooltipWalkthroughProvider({ role, children, enabled = true }: TooltipWalkthroughProviderProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isActive, setIsActive] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  const tooltips = roleTooltips[role] || [];
  const totalSteps = tooltips.length;

  // Auto-start for first-time users (only once)
  useEffect(() => {
    if (!enabled || autoStarted || tooltips.length === 0) return;
    const seen = getSeenTooltips(role);
    const allSeen = tooltips.every((t) => seen.includes(t.id));
    if (!allSeen) {
      // Delay to let dashboard render first
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsActive(true);
      }, 1500);
      setAutoStarted(true);
      return () => clearTimeout(timer);
    }
    setAutoStarted(true);
  }, [enabled, role, tooltips, autoStarted]);

  const startWalkthrough = useCallback(() => {
    if (tooltips.length > 0) {
      setCurrentStep(0);
      setIsActive(true);
    }
  }, [tooltips]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      markTooltipSeen(role, tooltips[currentStep].id);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, totalSteps, role, tooltips]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleDismiss = useCallback(() => {
    markAllSeen(role, tooltips.map((t) => t.id));
    setCurrentStep(-1);
    setIsActive(false);
  }, [role, tooltips]);

  const handleFinish = useCallback(() => {
    markAllSeen(role, tooltips.map((t) => t.id));
    setCurrentStep(-1);
    setIsActive(false);
  }, [role, tooltips]);

  const currentTooltip = isActive && currentStep >= 0 ? tooltips[currentStep] : null;

  return (
    <TooltipWalkthroughContext.Provider value={{ startWalkthrough, isActive }}>
      {children}
      <AnimatePresence>
        {currentTooltip && (
          <WalkthroughOverlay
            tooltip={currentTooltip}
            step={currentStep}
            totalSteps={totalSteps}
            onNext={handleNext}
            onPrev={handlePrev}
            onDismiss={handleDismiss}
            onFinish={handleFinish}
          />
        )}
      </AnimatePresence>
    </TooltipWalkthroughContext.Provider>
  );
}

/* ── Overlay Component ── */
interface WalkthroughOverlayProps {
  tooltip: TooltipDef;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  onFinish: () => void;
}

function WalkthroughOverlay({ tooltip, step, totalSteps, onNext, onPrev, onDismiss, onFinish }: WalkthroughOverlayProps) {
  const isLast = step === totalSteps - 1;

  return (
    <motion.div
      key={tooltip.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200]"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(126,158,120,0.4)", backdropFilter: "blur(2px)" }}
        onClick={onDismiss}
      />

      {/* Floating tooltip card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm"
      >
        <div
          className="rounded-2xl p-5 shadow-2xl"
          style={{
            backgroundColor: "rgba(248,245,239,0.98)",
            border: "1px solid rgba(205,168,138,0.3)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(201,169,110,0.12)" }}
              >
                <Sparkles className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
              </div>
              <span
                className="text-muted-foreground text-[0.6875rem]"
                style={bodyFont}
              >
                Tip {step + 1} of {totalSteps}
              </span>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 rounded-md cursor-pointer transition-colors hover:bg-black/5"
              aria-label="Dismiss walkthrough"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <h4
            className="text-foreground text-[1rem] mb-1.5"
            style={headingFont}
          >
            {tooltip.title}
          </h4>
          <p
            className="text-muted-foreground text-[0.8125rem] leading-relaxed mb-4"
            style={bodyFont}
          >
            {tooltip.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  backgroundColor: i === step ? "#7E9E78" : i < step ? "rgba(126,158,120,0.4)" : "rgba(126,158,120,0.15)",
                }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onDismiss}
              className="text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1"
              style={bodyFont}
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: "rgba(126,158,120,0.08)",
                    color: "#7E9E78",
                    ...bodyFont,
                  }}
                >
                  <ChevronLeft className="w-3 h-3" />
                  Back
                </button>
              )}
              <button
                onClick={isLast ? onFinish : onNext}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[0.75rem] text-white cursor-pointer transition-all hover:brightness-110"
                style={{
                  backgroundColor: "#7E9E78",
                  ...bodyFont,
                }}
              >
                {isLast ? "Got it!" : "Next"}
                {!isLast && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}