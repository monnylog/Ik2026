// ─── Open Decisions / Blockers Widget ────────────────────────────
// Shows unresolved decisions from the IK26 Notion Risk Register & Decision Log.
// Falls back to hardcoded blocker data when Notion isn't connected.

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  User,
  Clock,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformDecision, type TransformedDecision } from "../../lib/notion-transforms";
import { NotionSyncBadge } from "../ui/notion-sync-badge";
import { bodyFont, headingFont } from "../../lib/fonts";

// Fallback: the 5 known IK26 blockers from the Notion Open Decisions table
const FALLBACK_DECISIONS: TransformedDecision[] = [
  {
    id: "fb-1",
    title: "F&B Lead / Events Director",
    description: "Mariana suggested as lead — was TBD (Melvin held this in Y1+Y2). Single biggest operational gap. Must confirm by Mar 12.",
    severity: "critical",
    category: "Staffing",
    status: "Open",
    owner: "Walbert",
    dueDate: "2026-03-12",
    proposed: "Mariana",
    confirmed: "",
    _notionId: "",
    _url: "",
  },
  {
    id: "fb-2",
    title: "Beverage Director",
    description: "Cy was Y2 mixologist (with Aria, Gary). Suggested lead for Y3 beverage program. Needs confirmation and pairing menu draft.",
    severity: "critical",
    category: "F&B",
    status: "Open",
    owner: "Walbert",
    dueDate: "2026-03-15",
    proposed: "Cy",
    confirmed: "",
    _notionId: "",
    _url: "",
  },
  {
    id: "fb-3",
    title: "KMA Venue — Final Quote",
    description: "Waiting on Gina's final venue quote. Building budget this week — her number is the anchor for all financial planning.",
    severity: "critical",
    category: "Venue",
    status: "Waiting",
    owner: "Walbert",
    dueDate: "2026-03-14",
    proposed: "KMA Event Center",
    confirmed: "",
    _notionId: "",
    _url: "",
  },
  {
    id: "fb-4",
    title: "Kasama Chef — Keynote or Cooking",
    description: "Timothy Flores (Kasama Chicago) — dual option: keynote speaker or cooking slot. Intro routing through Max's Chicago connection.",
    severity: "warning",
    category: "Chefs",
    status: "In Progress",
    owner: "Walbert",
    dueDate: "2026-03-25",
    proposed: "Timothy Flores",
    confirmed: "",
    _notionId: "",
    _url: "",
  },
  {
    id: "fb-5",
    title: "Day-of Coordinator Staffing",
    description: "JJ Mayang confirmed for narrative/documentary coordination, but need 2–3x Y2 staffing for 200+ guests. FOH volunteer pool, server, bartender, expo needed.",
    severity: "warning",
    category: "Staffing",
    status: "In Progress",
    owner: "Christine",
    dueDate: "2026-04-15",
    proposed: "Griselle (FOH) + JJ (Coord)",
    confirmed: "",
    _notionId: "",
    _url: "",
  },
];

const severityConfig = {
  critical: { color: "#C85050", bg: "rgba(200,80,80,0.06)", border: "rgba(200,80,80,0.12)", icon: Flame, label: "Critical" },
  warning: { color: "#C9A96E", bg: "rgba(201,169,110,0.06)", border: "rgba(201,169,110,0.12)", icon: AlertTriangle, label: "Warning" },
  info: { color: "#4A7FB5", bg: "rgba(74,127,181,0.06)", border: "rgba(74,127,181,0.12)", icon: CheckCircle2, label: "Info" },
};

interface OpenDecisionsProps {
  onNavigate?: (page: string) => void;
}

export function OpenDecisions({ onNavigate }: OpenDecisionsProps) {
  const { items: rawItems, refresh } = useNotionDatabase("decisions");
  const [expanded, setExpanded] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Transform Notion data or use fallback
  const notionDecisions = rawItems.length > 0
    ? rawItems.map(transformDecision)
    : [];

  const decisions = notionDecisions.length > 0 ? notionDecisions : FALLBACK_DECISIONS;
  const isLive = notionDecisions.length > 0;

  // Only show open/unresolved decisions
  const openDecisions = decisions.filter(
    (d) => !d.status.toLowerCase().includes("resolved") && !d.status.toLowerCase().includes("done") && !d.confirmed
  );

  const criticalCount = openDecisions.filter((d) => d.severity === "critical").length;
  const warningCount = openDecisions.filter((d) => d.severity === "warning").length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid rgba(0,0,0,0.04)" : "none" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: criticalCount > 0 ? "rgba(200,80,80,0.08)" : "rgba(201,169,110,0.08)" }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: criticalCount > 0 ? "#C85050" : "#C9A96E" }} />
          </div>
          <div className="text-left">
            <h3 className="text-[0.9375rem] font-semibold" style={{ ...headingFont, color: "#3D524D" }}>
              Open Decisions
            </h3>
            <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "#A09A94" }}>
              {criticalCount} critical · {warningCount} warning · {openDecisions.length} total
            </p>
          </div>
          <NotionSyncBadge isLive={isLive} itemCount={isLive ? decisions.length : undefined} compact />
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform"
          style={{ color: "#A09A94", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-3 space-y-2">
              {openDecisions.map((decision) => {
                const cfg = severityConfig[decision.severity];
                const SevIcon = cfg.icon;
                const isOpen = expandedId === decision.id;
                const isOverdue = decision.dueDate && new Date(decision.dueDate) < new Date();

                return (
                  <div
                    key={decision.id}
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <button
                      onClick={() => setExpandedId(isOpen ? null : decision.id)}
                      className="w-full flex items-center gap-3 p-3 cursor-pointer text-left"
                    >
                      <SevIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[0.8125rem] font-medium truncate block" style={{ ...bodyFont, color: "#3D524D" }}>
                          {decision.title}
                        </span>
                        {decision.proposed && (
                          <span className="text-[0.625rem]" style={{ ...bodyFont, color: "#A09A94" }}>
                            Proposed: {decision.proposed}
                          </span>
                        )}
                      </div>
                      {decision.dueDate && (
                        <span
                          className="text-[0.5625rem] px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            ...bodyFont,
                            backgroundColor: isOverdue ? "rgba(200,80,80,0.1)" : "rgba(0,0,0,0.04)",
                            color: isOverdue ? "#C85050" : "#8A857F",
                          }}
                        >
                          {isOverdue ? "Overdue" : decision.dueDate}
                        </span>
                      )}
                      {isOpen
                        ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: "#A09A94" }} />
                        : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "#A09A94" }} />}
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${cfg.border}` }}>
                            <p className="text-[0.75rem] pt-2" style={{ ...bodyFont, color: "#5A554F" }}>
                              {decision.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              {decision.owner && (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" style={{ color: "#A09A94" }} />
                                  <span className="text-[0.625rem]" style={{ ...bodyFont, color: "#8A857F" }}>
                                    {decision.owner}
                                  </span>
                                </div>
                              )}
                              {decision.category && (
                                <span className="text-[0.5625rem] px-2 py-0.5 rounded" style={{ ...bodyFont, backgroundColor: "rgba(0,0,0,0.04)", color: "#8A857F" }}>
                                  {decision.category}
                                </span>
                              )}
                              <span className="text-[0.5625rem] px-2 py-0.5 rounded" style={{ ...bodyFont, backgroundColor: `${cfg.color}15`, color: cfg.color }}>
                                {decision.status}
                              </span>
                              {decision._url && (
                                <a
                                  href={decision._url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[0.5625rem]"
                                  style={{ color: "#C9A96E" }}
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  Notion
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {openDecisions.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2" style={{ color: "#7E9E78" }} />
                  <p className="text-[0.8125rem]" style={{ ...bodyFont, color: "#7E9E78" }}>
                    All decisions resolved
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}