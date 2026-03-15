import { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock,
  CircleDot,
  CircleDashed,
  ArrowRight,
  User,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformCommsContact, type TransformedCommsContact } from "../../lib/notion-transforms";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface CommsHubProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

// Status → sort priority (lower = more urgent = first)
function statusSortOrder(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("not started") || s === "") return 0;
  if (s.includes("waiting") || s.includes("pending")) return 1;
  if (s.includes("in progress") || s.includes("needs follow")) return 2;
  return 3;
}

// Status → display config
function statusConfig(status: string): { label: string; bg: string; color: string; border: string } {
  const s = status.toLowerCase();
  if (s.includes("in progress") || s.includes("needs follow")) {
    return {
      label: "In Progress",
      bg: "rgba(201,169,110,0.08)",
      color: "#C9A96E",
      border: "1px solid rgba(201,169,110,0.18)",
    };
  }
  if (s.includes("waiting") || s.includes("pending")) {
    return {
      label: "Waiting on Reply",
      bg: "rgba(74,127,181,0.08)",
      color: "#4A7FB5",
      border: "1px solid rgba(74,127,181,0.18)",
    };
  }
  // Not Started / default
  return {
    label: "Not Started",
    bg: "rgba(107,127,142,0.08)",
    color: "#6B7F8E",
    border: "1px solid rgba(107,127,142,0.18)",
  };
}

function formatLastContact(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `Last contact: ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return "";
  }
}

export function CommsHub({ role, onNavigate }: CommsHubProps) {
  const { items: rawItems } = useNotionDatabase("comms");

  const contacts: TransformedCommsContact[] = useMemo(
    () => rawItems.map(transformCommsContact).filter((c) => c.name),
    [rawItems]
  );

  // Filter: nextAction NOT empty, status NOT "Confirmed"/"Done"
  const actionItems = useMemo(() => {
    return contacts
      .filter((c) => {
        const hasNextAction = !!c.nextAction && c.nextAction.trim() !== "";
        const statusLower = c.status.toLowerCase();
        const isDone =
          statusLower === "confirmed" ||
          statusLower === "done" ||
          statusLower === "completed" ||
          c.confirmed === true;
        return hasNextAction && !isDone;
      })
      .sort((a, b) => statusSortOrder(a.status) - statusSortOrder(b.status));
  }, [contacts]);

  const openCount = actionItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(93,160,107,0.08)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(93,160,107,0.04) 0%, rgba(240,196,192,0.03) 50%, rgba(232,101,43,0.02) 100%)",
          borderBottom: "1px solid rgba(93,160,107,0.06)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#5DA06B" }} />
            <h3 className="text-foreground" style={headingFont}>
              Your Action Items
            </h3>
            {openCount > 0 && (
              <span
                className="text-[0.625rem] px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: "rgba(200,80,80,0.08)",
                  color: "#C85050",
                  border: "1px solid rgba(200,80,80,0.15)",
                  ...bodyFont,
                }}
              >
                {openCount} open
              </span>
            )}
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("Comms")}
              className="flex items-center gap-1 text-[0.6875rem] cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color: "#5DA06B", ...bodyFont }}
            >
              View all in Comms
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Empty state */}
        {openCount === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 px-4 text-center"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "rgba(93,160,107,0.08)" }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: "#5DA06B" }} />
            </div>
            <p className="text-foreground text-[0.875rem] font-medium mb-1" style={bodyFont}>
              All caught up
            </p>
            <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              No open action items — nice work!
            </p>
            {onNavigate && (
              <button
                onClick={() => onNavigate("Comms")}
                className="mt-4 flex items-center gap-1.5 text-[0.75rem] cursor-pointer hover:opacity-80 transition-opacity px-3 py-1.5 rounded-lg"
                style={{
                  color: "#5DA06B",
                  backgroundColor: "rgba(93,160,107,0.06)",
                  border: "1px solid rgba(93,160,107,0.12)",
                  ...bodyFont,
                }}
              >
                Open Comms Tracker
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}

        {/* Action item cards */}
        {openCount > 0 && (
          <div className="space-y-2">
            <AnimatePresence>
              {actionItems.map((item, idx) => {
                const cfg = statusConfig(item.status);
                const lastContactStr = formatLastContact(item.lastContact);
                const StatusIcon =
                  cfg.label === "In Progress"
                    ? CircleDot
                    : cfg.label === "Waiting on Reply"
                      ? Clock
                      : CircleDashed;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="rounded-xl p-3 group"
                    style={{
                      border: "1px solid rgba(93,160,107,0.06)",
                      backgroundColor: "rgba(0,0,0,0)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0)";
                    }}
                  >
                    {/* Top row: Name + Status badge */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[0.625rem] font-bold shrink-0"
                          style={{
                            backgroundColor:
                              item.priority === "high"
                                ? "rgba(200,80,80,0.08)"
                                : "rgba(201,169,110,0.08)",
                            color: item.priority === "high" ? "#C85050" : "#C9A96E",
                          }}
                        >
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <span
                          className="text-foreground text-[0.8125rem] font-semibold truncate"
                          style={bodyFont}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className="text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1 whitespace-nowrap"
                        style={{
                          backgroundColor: cfg.bg,
                          color: cfg.color,
                          border: cfg.border,
                          ...bodyFont,
                        }}
                      >
                        <StatusIcon className="w-2.5 h-2.5" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Next Action — the most important field, prominent */}
                    <p
                      className="text-foreground text-[0.8125rem] leading-snug mb-2"
                      style={{ ...bodyFont, lineHeight: 1.45 }}
                    >
                      {item.nextAction}
                    </p>

                    {/* Bottom row: owner, last contact, CTA */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.owner && (
                          <span
                            className="flex items-center gap-1 text-[0.625rem] text-muted-foreground"
                            style={bodyFont}
                          >
                            <User className="w-2.5 h-2.5" />
                            {item.owner}
                          </span>
                        )}
                        {lastContactStr && (
                          <span
                            className="text-[0.625rem] text-muted-foreground/60"
                            style={bodyFont}
                          >
                            {lastContactStr}
                          </span>
                        )}
                      </div>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate("Comms")}
                          className="flex items-center gap-1 text-[0.625rem] cursor-pointer hover:opacity-80 transition-opacity shrink-0 opacity-0 group-hover:opacity-100"
                          style={{ color: "#5DA06B", ...bodyFont }}
                        >
                          Open in Comms
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}