// ─── Mission Control Page ───────────────────────────────────────────────
// Critical alerts, blockers, and escalations view.
// Pulls from both "warroom" and "decisions" Notion content types.

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  User,
  Clock,
  RefreshCw,
  Shield,
  Loader2,
  Info,
  Target,
  CalendarPlus,
  Mail,
  ArrowRight,
  Zap,
  Download,
} from "lucide-react";
import { useNotionDatabase } from "../lib/notion-sync";
import { transformWarRoomItem, transformDecision, type TransformedWarRoomItem } from "../lib/notion-transforms";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { bodyFont, headingFont } from "../lib/fonts";

// Fallback mission control items
const FALLBACK_ITEMS: TransformedWarRoomItem[] = [
  { id: "wr-1", title: "F&B Lead Vacancy", description: "No confirmed F&B Lead / Events Director. Mariana proposed but unconfirmed. Single biggest operational gap.", severity: "critical", category: "Staffing", status: "Open", owner: "Walbert", dueDate: "2026-03-12", _notionId: "", _url: "" },
  { id: "wr-2", title: "Beverage Program Unconfirmed", description: "Cy (Y2 mixologist) suggested for Y3 lead. No pairing menu draft. Bar setup, staffing, non-alcoholic options all pending.", severity: "critical", category: "F&B", status: "Open", owner: "Walbert", dueDate: "2026-03-15", _notionId: "", _url: "" },
  { id: "wr-3", title: "KMA Venue Quote Pending", description: "Waiting on Gina's final number. Budget is blocked until venue cost is anchored.", severity: "critical", category: "Venue", status: "Waiting", owner: "Walbert", dueDate: "2026-03-14", _notionId: "", _url: "" },
  { id: "wr-4", title: "Kasama Chef Decision", description: "Timothy Flores — keynote or cooking? Intro routing through Max. Decision needed for programming.", severity: "warning", category: "Chefs", status: "In Progress", owner: "Walbert", dueDate: "2026-03-25", _notionId: "", _url: "" },
  { id: "wr-5", title: "FOH Staffing Gap", description: "200+ guests requires 2–3x Y2 staffing. Server, bartender, expo pools not started. Griselle recruiting.", severity: "warning", category: "Staffing", status: "In Progress", owner: "Griselle", dueDate: "2026-04-15", _notionId: "", _url: "" },
  { id: "wr-6", title: "Research Pairings Deadline", description: "Andrew needs to assign 7 researcher-chef pairings by Mar 14-18. If unavailable, JJ absorbs all.", severity: "warning", category: "Research", status: "Pending", owner: "Andrew", dueDate: "2026-03-18", _notionId: "", _url: "" },
  { id: "wr-7", title: "Save-the-Date Graphic", description: "Denise needs to deliver STD graphic: 'May 22 / Las Vegas / Isang Kusina: Year Three'. Kara following up.", severity: "info", category: "Marketing", status: "Needs Follow-Up", owner: "Kara", dueDate: "2026-03-12", _notionId: "", _url: "" },
];

const sevConfig = {
  critical: { color: "#C85050", bg: "rgba(200,80,80,0.06)", border: "rgba(200,80,80,0.15)", label: "Critical", icon: Flame },
  warning: { color: "#C9A96E", bg: "rgba(201,169,110,0.06)", border: "rgba(201,169,110,0.15)", label: "Warning", icon: AlertTriangle },
  info: { color: "#4A7FB5", bg: "rgba(74,127,181,0.06)", border: "rgba(74,127,181,0.15)", label: "Info", icon: Info },
};

// Helper to format due dates nicely
function formatDueDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// Export CSV of all mission control items
function exportMissionControlCSV(items: TransformedWarRoomItem[]) {
  const headers = ["Title", "Severity", "Category", "Status", "Owner", "Due Date", "Description"];
  const rows = items.map((i) => [
    `"${i.title}"`,
    i.severity,
    `"${i.category}"`,
    `"${i.status}"`,
    `"${i.owner}"`,
    i.dueDate || "",
    `"${(i.description || "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mission-control-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MissionControl({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { items: warRoomRaw, isLoading: wrLoading, refresh: refreshWR } = useNotionDatabase("warroom");
  const { items: decisionsRaw, refresh: refreshDecisions } = useNotionDatabase("decisions");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "critical" | "warning" | "info">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Merge mission control items and open decisions
  const missionItems = useMemo(() => {
    const wr = warRoomRaw.length > 0 ? warRoomRaw.map(transformWarRoomItem) : [];
    const dec = decisionsRaw.length > 0
      ? decisionsRaw.map(transformDecision)
          .filter(d => !d.confirmed && !d.status.toLowerCase().includes("resolved"))
          .map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            severity: d.severity,
            category: d.category,
            status: d.status,
            owner: d.owner,
            dueDate: d.dueDate,
            _notionId: d._notionId,
            _url: d._url,
          } as TransformedWarRoomItem))
      : [];

    // Merge, deduplicate by title
    const all = [...wr];
    for (const d of dec) {
      if (!all.some(w => w.title.toLowerCase() === d.title.toLowerCase())) {
        all.push(d);
      }
    }
    return all.length > 0 ? all : FALLBACK_ITEMS;
  }, [warRoomRaw, decisionsRaw]);

  const isLive = warRoomRaw.length > 0 || decisionsRaw.length > 0;

  const filtered = useMemo(() => {
    if (filterSeverity === "all") return missionItems;
    return missionItems.filter(i => i.severity === filterSeverity);
  }, [missionItems, filterSeverity]);

  // Sort: critical first, then warning, then info
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    }),
    [filtered]
  );

  const criticalCount = missionItems.filter(i => i.severity === "critical").length;
  const warningCount = missionItems.filter(i => i.severity === "warning").length;
  const infoCount = missionItems.filter(i => i.severity === "info").length;
  const overdueCount = missionItems.filter(i => i.dueDate && new Date(i.dueDate) < new Date()).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshWR(), refreshDecisions()]);
    setRefreshing(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5" style={{ color: "#C85050" }} />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Mission Control
            </h2>
            <span className="text-[0.6875rem] px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(200,80,80,0.1)", color: "#C85050", ...bodyFont }}>
              {criticalCount} critical
            </span>
            <NotionSyncBadge isLive={isLive} itemCount={isLive ? missionItems.length : undefined} />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => exportMissionControlCSV(missionItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] cursor-pointer transition-colors"
              style={{ backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont }}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] cursor-pointer disabled:opacity-50"
              style={{ ...bodyFont, backgroundColor: "rgba(200,80,80,0.06)", color: "#C85050", border: "1px solid rgba(200,80,80,0.12)" }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          Critical alerts, blockers, and escalations for leadership.
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { severity: "critical" as const, count: criticalCount },
          { severity: "warning" as const, count: warningCount },
          { severity: "info" as const, count: infoCount },
        ]).map(({ severity, count }) => {
          const cfg = sevConfig[severity];
          const Icon = cfg.icon;
          return (
            <motion.button
              key={severity}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setFilterSeverity(filterSeverity === severity ? "all" : severity)}
              className="p-4 rounded-xl cursor-pointer text-left bg-card"
              style={{
                border: `1px solid ${filterSeverity === severity ? cfg.border : "rgba(0,0,0,0.06)"}`,
                ...(filterSeverity === severity ? { backgroundColor: cfg.bg } : {}),
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                <span className="text-[0.6875rem] font-medium uppercase tracking-wider" style={{ ...bodyFont, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              <span className="text-[1.5rem] font-bold text-foreground" style={headingFont}>
                {count}
              </span>
            </motion.button>
          );
        })}
        {/* Overdue card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-card"
          style={{ border: overdueCount > 0 ? "1px solid rgba(200,80,80,0.2)" : "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: overdueCount > 0 ? "#C85050" : "#6B7F8E" }} />
            <span className="text-[0.6875rem] font-medium uppercase tracking-wider" style={{ ...bodyFont, color: overdueCount > 0 ? "#C85050" : "#6B7F8E" }}>
              Overdue
            </span>
          </div>
          <span className="text-[1.5rem] font-bold text-foreground" style={headingFont}>
            {overdueCount}
          </span>
        </motion.div>
      </div>

      {/* Severity Progress Bar */}
      {missionItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-4"
          style={{ border: "1px solid rgba(200,80,80,0.08)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>Alert Distribution</span>
            <span className="text-[0.6875rem] text-muted-foreground/50" style={bodyFont}>
              {missionItems.length} total items
            </span>
          </div>
          <div className="flex gap-[2px] h-6 rounded-lg overflow-hidden">
            {criticalCount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(criticalCount / missionItems.length) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="h-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(200,80,80,0.15)", borderLeft: "2px solid #C85050" }}
              >
                <span className="text-[0.5rem] font-medium" style={{ color: "#C85050", ...bodyFont }}>{criticalCount}</span>
              </motion.div>
            )}
            {warningCount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(warningCount / missionItems.length) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="h-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(201,169,110,0.12)", borderLeft: "2px solid #C9A96E" }}
              >
                <span className="text-[0.5rem] font-medium" style={{ color: "#C9A96E", ...bodyFont }}>{warningCount}</span>
              </motion.div>
            )}
            {infoCount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(infoCount / missionItems.length) * 100}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                className="h-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(74,127,181,0.08)", borderLeft: "2px solid #4A7FB5" }}
              >
                <span className="text-[0.5rem] font-medium" style={{ color: "#4A7FB5", ...bodyFont }}>{infoCount}</span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Actions Command Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <button
          onClick={() => onNavigate?.("Event Timeline")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-all hover:scale-[1.02]"
          style={{ ...bodyFont, backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.15)" }}
        >
          <Target className="w-3.5 h-3.5" />
          View Timeline
        </button>
        <button
          onClick={() => onNavigate?.("Budget & COGS")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-all hover:scale-[1.02]"
          style={{ ...bodyFont, backgroundColor: "rgba(74,127,181,0.06)", color: "#4A7FB5", border: "1px solid rgba(74,127,181,0.12)" }}
        >
          <Zap className="w-3.5 h-3.5" />
          Budget Overview
        </button>
        <button
          onClick={() => onNavigate?.("Comms")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-all hover:scale-[1.02]"
          style={{ ...bodyFont, backgroundColor: "rgba(93,160,107,0.06)", color: "#5DA06B", border: "1px solid rgba(93,160,107,0.12)" }}
        >
          <Mail className="w-3.5 h-3.5" />
          Comms Tracker
        </button>
        <button
          onClick={() => onNavigate?.("Chef Roster")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-all hover:scale-[1.02]"
          style={{ ...bodyFont, backgroundColor: "rgba(200,80,80,0.06)", color: "#C85050", border: "1px solid rgba(200,80,80,0.12)" }}
        >
          <User className="w-3.5 h-3.5" />
          Chef Roster
        </button>
      </motion.div>

      {/* Items list */}
      <div className="space-y-2">
        {wrLoading && missionItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A96E" }} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ backgroundColor: "rgba(126,158,120,0.04)" }}>
            <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#7E9E78" }} />
            <p className="text-[0.875rem] font-medium" style={{ ...bodyFont, color: "#7E9E78" }}>
              No {filterSeverity !== "all" ? filterSeverity : ""} alerts
            </p>
          </div>
        ) : (
          sorted.map((item, idx) => {
            const cfg = sevConfig[item.severity];
            const Icon = cfg.icon;
            const isExpanded = expandedId === item.id;
            const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.3 }}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full flex items-center gap-3 p-4 cursor-pointer text-left"
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.875rem] font-semibold block truncate text-foreground" style={bodyFont}>
                      {item.title}
                    </span>
                    <span className="text-[0.6875rem] block truncate text-muted-foreground" style={bodyFont}>
                      {item.category} · {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.owner && (
                      <span className="text-[0.625rem] px-2 py-0.5 rounded text-muted-foreground" style={{ ...bodyFont, backgroundColor: "rgba(0,0,0,0.04)" }}>
                        {item.owner}
                      </span>
                    )}
                    {item.dueDate && (
                      <span
                        className={`text-[0.625rem] px-2 py-0.5 rounded-full ${isOverdue ? "" : "text-muted-foreground"}`}
                        style={{
                          ...bodyFont,
                          backgroundColor: isOverdue ? "rgba(200,80,80,0.12)" : "rgba(0,0,0,0.04)",
                          color: isOverdue ? "#C85050" : undefined,
                        }}
                      >
                        {isOverdue ? "OVERDUE · " : ""}{formatDueDate(item.dueDate)}
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid ${cfg.border}` }}>
                        <p className="text-[0.8125rem] mb-3 text-muted-foreground leading-relaxed" style={bodyFont}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {item._url && (
                            <a
                              href={item._url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[0.6875rem] px-3 py-1.5 rounded-lg"
                              style={{ ...bodyFont, backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E" }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              View in Notion
                            </a>
                          )}
                          {item.owner && (
                            <a
                              href={`mailto:${item.owner.toLowerCase().replace(/\s+/g, "")}@isangkusina.com?subject=Mission Control: ${encodeURIComponent(item.title)}`}
                              className="inline-flex items-center gap-1.5 text-[0.6875rem] px-3 py-1.5 rounded-lg"
                              style={{ ...bodyFont, backgroundColor: "rgba(74,127,181,0.06)", color: "#4A7FB5" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="w-3 h-3" />
                              Email {item.owner}
                            </a>
                          )}
                          {item.dueDate && (
                            <a
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("[Mission Control] " + item.title)}&dates=${item.dueDate.replace(/-/g, "")}/${item.dueDate.replace(/-/g, "")}&details=${encodeURIComponent(item.description)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[0.6875rem] px-3 py-1.5 rounded-lg"
                              style={{ ...bodyFont, backgroundColor: "rgba(93,160,107,0.06)", color: "#5DA06B" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CalendarPlus className="w-3 h-3" />
                              Add to Calendar
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Decision Log Summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="rounded-xl p-4 bg-card"
        style={{ border: "1px solid rgba(201,169,110,0.1)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: "#C9A96E" }} />
            <h3 className="text-[0.875rem] font-semibold text-foreground" style={headingFont}>
              Pending Decisions
            </h3>
          </div>
          <button
            onClick={() => onNavigate?.("Event Timeline")}
            className="flex items-center gap-1 text-[0.6875rem] cursor-pointer"
            style={{ ...bodyFont, color: "#C9A96E" }}
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2">
          {missionItems
            .filter(i => i.status.toLowerCase().includes("pending") || i.status.toLowerCase().includes("waiting"))
            .slice(0, 3)
            .map((item) => {
              const cfg = sevConfig[item.severity];
              return (
                <div
                  key={`decision-${item.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card"
                  style={{ border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="flex-1 text-[0.8125rem] truncate text-foreground" style={bodyFont}>
                    {item.title}
                  </span>
                  <span className="text-[0.625rem] text-muted-foreground shrink-0" style={bodyFont}>
                    {item.owner || "Unassigned"}
                  </span>
                </div>
              );
            })}
          {missionItems.filter(i => i.status.toLowerCase().includes("pending") || i.status.toLowerCase().includes("waiting")).length === 0 && (
            <p className="text-[0.8125rem] text-center py-3 text-muted-foreground" style={bodyFont}>
              No pending decisions
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}