import type React from "react";
import { motion } from "motion/react";
import { ErrorBoundary } from "../ui/error-boundary";

// ── Stagger Orchestrator ─────────────────────────────────────────
// Instead of manually calculating delay values, pass an index and
// get a consistent, cascading entrance for dashboard widgets.

const BASE_DELAY = 0.06;
const STAGGER = 0.04;
const DURATION = 0.42;
const EASE = [0.22, 1, 0.36, 1] as const;

interface StaggeredWidgetProps {
  /** Render index for stagger calculation */
  index: number;
  /** Error boundary section label */
  section: string;
  /** Optional CSS class */
  className?: string;
  /** Whether to apply the card hover class */
  cardHover?: boolean;
  children: React.ReactNode;
}

export function StaggeredWidget({
  index,
  section,
  className = "",
  cardHover = false,
  children,
}: StaggeredWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: BASE_DELAY + index * STAGGER,
        duration: DURATION,
        ease: EASE as unknown as number[],
      }}
      className={`${cardHover ? "ik26-card-hover" : ""} ${className}`.trim()}
    >
      <ErrorBoundary section={section}>{children}</ErrorBoundary>
    </motion.div>
  );
}

// ── Dashboard Section Divider ────────────────────────────────────
// A warm, branded section break with optional label

interface SectionDividerProps {
  label?: string;
}

export function SectionDivider({ label }: SectionDividerProps) {
  if (label) {
    return (
      <div className="ik26-section-heading my-2">
        <span className="ik26-section-label">{label}</span>
      </div>
    );
  }
  return <div className="ik26-divider my-1" />;
}

// ── Dashboard Gold Accent Line ───────────────────────────────────
export function GoldAccentLine() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.3, duration: 0.8, ease: EASE as unknown as number[] }}
      className="ik26-gold-line my-6 mx-auto"
      style={{ maxWidth: "120px", transformOrigin: "center" }}
    />
  );
}
