import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck,
  Clock,
  Keyboard,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
} from "lucide-react";

import { bodyFont, headingFont } from "../../lib/fonts";

const TOUR_STORAGE_KEY = "ik26-guided-tour-completed";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
  accentColor: string;
}

const tourSteps: TourStep[] = [
  {
    id: "dashboard",
    title: "Welcome to Your Dashboard",
    description:
      "This is your command center. See event countdown, KPIs, action items, and team activity all in one place. Everything updates in real-time.",
    icon: LayoutDashboard,
    targetSelector: "#main-content",
    position: "bottom",
    accentColor: "#7E9E78",
  },
  {
    id: "task-board",
    title: "Task Board",
    description:
      "Track all event tasks across To Do, In Progress, and Done columns. Drag cards between columns, filter by priority, and assign to team members.",
    icon: ClipboardList,
    targetSelector: "[data-tooltip-id='quick-actions']",
    position: "bottom",
    accentColor: "#C9A96E",
  },
  {
    id: "checklist",
    title: "Pre-Event Checklist",
    description:
      "Stay on top of every detail with the countdown checklist. Check off items as they're completed, filter by category, and track critical deadlines.",
    icon: CalendarCheck,
    targetSelector: "[data-tooltip-id='action-needed']",
    position: "top",
    accentColor: "#CDA88A",
  },
  {
    id: "timeline",
    title: "Event Timeline",
    description:
      "Visualize the entire event journey from planning to execution. See milestones, deadlines, and key dates on an interactive timeline.",
    icon: Clock,
    targetSelector: "[data-tooltip-id='kpi-cards']",
    position: "bottom",
    accentColor: "#4A7FB5",
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    description:
      "Press ? anytime to see all shortcuts. Use / for search, G+D for dashboard, G+T for tasks, and N to jump to the task board. Navigate like a pro!",
    icon: Keyboard,
    targetSelector: "#main-content",
    position: "bottom",
    accentColor: "#7E9E78",
  },
];

export function useGuidedTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has completed or dismissed the tour
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => setShowTour(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    setShowTour(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setShowTour(true);
  }, []);

  return { showTour, completeTour, restartTour };
}

interface GuidedTourProps {
  open: boolean;
  onComplete: () => void;
  viewMode?: "leadership" | "team" | "chef";
}

export function GuidedTour({ open, onComplete, viewMode = "leadership" }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Filter steps based on viewMode — chefs don't see KPI cards
  const filteredSteps = viewMode === "chef"
    ? tourSteps.filter((s) => s.id !== "timeline")
    : tourSteps;

  const step = filteredSteps[currentStep];
  const isLastStep = currentStep === filteredSteps.length - 1;
  const isFirstStep = currentStep === 0;
  const StepIcon = step.icon;

  // Find and measure target element
  useEffect(() => {
    if (!open || !step) return;

    const findTarget = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        // Fallback: center of screen
        setTargetRect(
          new DOMRect(
            window.innerWidth / 2 - 150,
            window.innerHeight / 2 - 100,
            300,
            200
          )
        );
      }
    };

    findTarget();
    // Re-measure on resize
    window.addEventListener("resize", findTarget);
    return () => window.removeEventListener("resize", findTarget);
  }, [open, currentStep, step?.targetSelector]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open || !step) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
      else if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, currentStep, isLastStep]);

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const padding = 16;
    const tooltipWidth = 380;
    const tooltipHeight = 260;

    let top: number;
    let left: number;

    switch (step.position) {
      case "bottom":
        top = Math.min(targetRect.bottom + padding, window.innerHeight - tooltipHeight - padding);
        left = Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding));
        break;
      case "top":
        top = Math.max(padding, targetRect.top - tooltipHeight - padding);
        left = Math.max(padding, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - padding));
        break;
      case "right":
        top = Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2);
        left = Math.min(targetRect.right + padding, window.innerWidth - tooltipWidth - padding);
        break;
      case "left":
        top = Math.max(padding, targetRect.top + targetRect.height / 2 - tooltipHeight / 2);
        left = Math.max(padding, targetRect.left - tooltipWidth - padding);
        break;
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    return { position: "fixed", top, left, width: tooltipWidth, zIndex: 10002 };
  };

  // Spotlight clip path
  const getSpotlightClipPath = (): string => {
    if (!targetRect) return "none";
    const inset = 8;
    const x = targetRect.left - inset;
    const y = targetRect.top - inset;
    const w = targetRect.width + inset * 2;
    const h = targetRect.height + inset * 2;
    const r = 16;

    // Create a rectangle with rounded corners cut out of the overlay
    return `polygon(
      0% 0%, 0% 100%, 
      ${x}px 100%, ${x}px ${y + r}px, 
      ${x + r}px ${y}px, ${x + w - r}px ${y}px, 
      ${x + w}px ${y + r}px, ${x + w}px ${y + h - r}px,
      ${x + w - r}px ${y + h}px, ${x + r}px ${y + h}px,
      ${x}px ${y + h - r}px, ${x}px 100%, 
      100% 100%, 100% 0%
    )`;
  };

  return (
    <AnimatePresence>
      {open && targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[10000]"
          role="dialog"
          aria-modal="true"
          aria-label="Guided tour"
        >
          {/* Dark overlay with spotlight cutout */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(20,23,22,0.65)",
              clipPath: getSpotlightClipPath(),
              transition: "clip-path 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
            onClick={handleSkip}
          />

          {/* Full overlay for click outside (below spotlight) */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(20,23,22,0.65)", zIndex: -1 }}
            onClick={handleSkip}
          />

          {/* Spotlight ring/glow around target */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
              borderRadius: 20,
              border: `2px solid ${step.accentColor}`,
              boxShadow: `0 0 0 4px rgba(0,0,0,0.5), 0 0 30px ${step.accentColor}40, inset 0 0 20px ${step.accentColor}15`,
              transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
              zIndex: 10001,
            }}
          />

          {/* Tooltip card */}
          <motion.div
            ref={tooltipRef}
            key={currentStep}
            initial={{ opacity: 0, y: step.position === "top" ? 10 : -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: step.position === "top" ? 10 : -10, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={getTooltipStyle()}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl shadow-2xl overflow-hidden"
              style={{
                backgroundColor: "rgba(36,40,38,0.97)",
                border: `1px solid ${step.accentColor}30`,
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Header */}
              <div
                className="px-5 pt-4 pb-3 flex items-start justify-between"
                style={{
                  background: `linear-gradient(135deg, ${step.accentColor}15 0%, transparent 100%)`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${step.accentColor}20` }}
                  >
                    <StepIcon className="w-5 h-5" style={{ color: step.accentColor }} />
                  </div>
                  <div>
                    <h3
                      className="text-[1rem] leading-tight"
                      style={{ ...headingFont, color: "#E8E4DC" }}
                    >
                      {step.title}
                    </h3>
                    <span
                      className="text-[0.625rem] uppercase tracking-wider"
                      style={{ ...bodyFont, color: `${step.accentColor}90` }}
                    >
                      Step {currentStep + 1} of {filteredSteps.length}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Skip tour"
                >
                  <X className="w-3.5 h-3.5" style={{ color: "#9A9584" }} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-3">
                <p
                  className="text-[0.8125rem] leading-relaxed"
                  style={{ ...bodyFont, color: "#C0BAA8" }}
                >
                  {step.description}
                </p>
              </div>

              {/* Progress dots + buttons */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: "1px solid rgba(232,228,220,0.08)" }}
              >
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {filteredSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: idx === currentStep ? 20 : 6,
                        height: 6,
                        backgroundColor:
                          idx === currentStep
                            ? step.accentColor
                            : idx < currentStep
                            ? `${step.accentColor}60`
                            : "rgba(232,228,220,0.15)",
                        borderRadius: 3,
                      }}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePrev}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                      style={{
                        ...bodyFont,
                        color: "#9A9584",
                        backgroundColor: "rgba(232,228,220,0.08)",
                      }}
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Back
                    </motion.button>
                  )}
                  {isFirstStep && (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSkip}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                      style={{
                        ...bodyFont,
                        color: "#9A9584",
                        backgroundColor: "rgba(232,228,220,0.08)",
                      }}
                    >
                      Skip Tour
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                    style={{
                      ...bodyFont,
                      fontWeight: 600,
                      color: "#1A1D1C",
                      backgroundColor: step.accentColor,
                    }}
                  >
                    {isLastStep ? (
                      <>
                        <Sparkles className="w-3 h-3" />
                        Let's Go!
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-3 h-3" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}