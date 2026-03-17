import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Loader2,
  MessageCircle,
  Move,
  Plane,
  Plus,
  Tag,
  Trash2,
  UtensilsCrossed,
  User,
  Users,
  CalendarDays,
  Radio,
  FileText,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { printToPDF } from "../lib/print-pdf";
import { bodyFont, headingFont } from "../lib/fonts";

type ActionType =
  | "task_move"
  | "task_create"
  | "task_complete"
  | "checklist_toggle"
  | "menu_update"
  | "chef_confirmed"
  | "travel_update"
  | "chat_message"
  | "team_update"
  | "milestone_update";

interface ActivityEntry {
  id: string;
  timestamp: Date;
  actionType: ActionType;
  avatar: string;
  actorName: string;
  description: string;
  detail?: string;
  navigateTo?: string;
}

const actionTypeConfig: Record<ActionType, { label: string; color: string; bg: string; icon: typeof Activity }> = {
  task_move: { label: "Task Moved", color: "#4A7FB5", bg: "rgba(74,127,181,0.08)", icon: Move },
  task_create: { label: "Task Created", color: "#D4A843", bg: "rgba(212,168,67,0.08)", icon: Plus },
  task_complete: { label: "Task Completed", color: "#7E9E78", bg: "rgba(126,158,120,0.08)", icon: CheckCircle2 },
  checklist_toggle: { label: "Checklist", color: "#1A5C38", bg: "rgba(26,92,56,0.08)", icon: CheckCircle2 },
  menu_update: { label: "Menu Update", color: "#C49370", bg: "rgba(196,147,112,0.08)", icon: UtensilsCrossed },
  chef_confirmed: { label: "Chef Confirmed", color: "#5DA06B", bg: "rgba(93,160,107,0.08)", icon: Users },
  travel_update: { label: "Travel", color: "#6B7F8E", bg: "rgba(107,127,142,0.08)", icon: Plane },
  chat_message: { label: "Chat", color: "#4A7FB5", bg: "rgba(74,127,181,0.08)", icon: MessageCircle },
  team_update: { label: "Team", color: "#C75B3F", bg: "rgba(199,91,63,0.08)", icon: User },
  milestone_update: { label: "Milestone", color: "#D4A843", bg: "rgba(212,168,67,0.08)", icon: CalendarDays },
};

// Generate rich mock activity entries
function generateActivities(): ActivityEntry[] {
  const now = new Date();
  const entries: ActivityEntry[] = [
    { id: "a1", timestamp: new Date(now.getTime() - 12 * 60000), actionType: "task_move", avatar: "🏺", actorName: "Maria Santos", description: "Moved \"Finalize venue floor plan\" from To Do → In Progress", navigateTo: "Task Board" },
    { id: "a2", timestamp: new Date(now.getTime() - 28 * 60000), actionType: "chef_confirmed", avatar: "🍃", actorName: "Jerjon Castillo", description: "Confirmed attendance for Course 4", detail: "Travel details and hotel block submitted.", navigateTo: "Chef Roster" },
    { id: "a3", timestamp: new Date(now.getTime() - 45 * 60000), actionType: "checklist_toggle", avatar: "📖", actorName: "Sofia Delgado", description: "Marked \"Send invitations\" as complete in Pre-Event Checklist", navigateTo: "Pre-Event Checklist" },
    { id: "a4", timestamp: new Date(now.getTime() - 1.2 * 3600000), actionType: "menu_update", avatar: "🫕", actorName: "Dio Buan", description: "Updated dish concept for Course 5 with revised plating notes", detail: "Added ingredient substitutions for dietary restrictions.", navigateTo: "Menu & Courses" },
    { id: "a5", timestamp: new Date(now.getTime() - 1.8 * 3600000), actionType: "task_create", avatar: "🌾", actorName: "Ana Cruz", description: "Created task \"Source calamansi (10 lbs)\" with High priority", navigateTo: "Task Board" },
    { id: "a6", timestamp: new Date(now.getTime() - 2.5 * 3600000), actionType: "chat_message", avatar: "✦", actorName: "Kara Reyes", description: "Posted in #creative: \"Social media templates v2 ready for review\"", navigateTo: "Comms" },
    { id: "a7", timestamp: new Date(now.getTime() - 3.2 * 3600000), actionType: "travel_update", avatar: "🌾", actorName: "Ana Cruz", description: "Updated Chef Rachel's flight — LAX → LAS on May 20, 2:15 PM arrival", navigateTo: "Travel & Lodging" },
    { id: "a8", timestamp: new Date(now.getTime() - 4 * 3600000), actionType: "task_complete", avatar: "🔥", actorName: "James Reyes", description: "Completed \"Arrange portable kamado grill\" — moved to Done", navigateTo: "Task Board" },
    { id: "a9", timestamp: new Date(now.getTime() - 5.5 * 3600000), actionType: "milestone_update", avatar: "🏺", actorName: "Maria Santos", description: "Updated milestone \"Secure hotel group block\" status to Complete", navigateTo: "Event Timeline" },
    { id: "a10", timestamp: new Date(now.getTime() - 8 * 3600000), actionType: "team_update", avatar: "📖", actorName: "Sofia Delgado", description: "Added Denise Reyes to Team Deploy — assigned to FOH coordination", navigateTo: "Team Deploy" },
    { id: "a11", timestamp: new Date(now.getTime() - 24 * 3600000), actionType: "checklist_toggle", avatar: "🫕", actorName: "Dio Buan", description: "Marked \"Finalize menu\" as in progress in Pre-Event Checklist", navigateTo: "Pre-Event Checklist" },
    { id: "a12", timestamp: new Date(now.getTime() - 26 * 3600000), actionType: "task_move", avatar: "✦", actorName: "Kara Reyes", description: "Moved \"Design social media templates\" from In Progress → Done", navigateTo: "Task Board" },
    { id: "a13", timestamp: new Date(now.getTime() - 30 * 3600000), actionType: "chef_confirmed", avatar: "🏺", actorName: "System", description: "Chef Maria Santos confirmed attendance — Course 3 locked in", navigateTo: "Chef Roster" },
    { id: "a14", timestamp: new Date(now.getTime() - 48 * 3600000), actionType: "menu_update", avatar: "🍃", actorName: "Jerjon Castillo", description: "Submitted wine pairing recommendations for Courses 2-4", navigateTo: "Menu & Courses" },
    { id: "a15", timestamp: new Date(now.getTime() - 52 * 3600000), actionType: "travel_update", avatar: "🏺", actorName: "Maria Santos", description: "Booked airport pickup for 3 arriving chefs — May 20 shuttle confirmed", navigateTo: "Travel & Lodging" },
    { id: "a16", timestamp: new Date(now.getTime() - 72 * 3600000), actionType: "task_create", avatar: "📖", actorName: "Sofia Delgado", description: "Created task \"Print event programs\" — Medium priority, due Jun 10", navigateTo: "Task Board" },
    { id: "a17", timestamp: new Date(now.getTime() - 96 * 3600000), actionType: "checklist_toggle", avatar: "🌾", actorName: "Ana Cruz", description: "Marked \"Transport logistics confirmed\" as in progress", navigateTo: "Pre-Event Checklist" },
    { id: "a18", timestamp: new Date(now.getTime() - 120 * 3600000), actionType: "milestone_update", avatar: "🏺", actorName: "Maria Santos", description: "Updated 4 milestones in Event Timeline — Week 10 batch update", navigateTo: "Event Timeline" },
    { id: "a19", timestamp: new Date(now.getTime() - 144 * 3600000), actionType: "team_update", avatar: "🔥", actorName: "James Reyes", description: "Completed Setup division onboarding — 3 volunteers confirmed", navigateTo: "Team Deploy" },
    { id: "a20", timestamp: new Date(now.getTime() - 168 * 3600000), actionType: "chat_message", avatar: "🫕", actorName: "Dio Buan", description: "Posted in #kitchen: \"Pre-event chef dinner confirmed for May 20\"", navigateTo: "Comms" },
  ];
  return entries;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDateGroup(date: Date): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  if (date >= todayStart) return "Today";
  if (date >= yesterdayStart) return "Yesterday";
  if (date >= weekStart) return "This Week";
  return "Older";
}

type DateFilter = "all" | "today" | "week" | "month";

interface ActivityLogProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function ActivityLog({ role, onNavigate }: ActivityLogProps) {
  const [filterAction, setFilterAction] = useState<ActionType | "all">("all");
  const [filterDate, setFilterDate] = useState<DateFilter>("all");
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const activities = useMemo(() => generateActivities(), []);

  // ── Real-time live feed ──
  const [liveEntries, setLiveEntries] = useState<ActivityEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const liveCounterRef = useRef(0);

  // Pool of random live activities to simulate
  const liveTemplates: Omit<ActivityEntry, "id" | "timestamp">[] = useMemo(() => [
    { actionType: "chat_message", avatar: "🍃", actorName: "Jerjon Castillo", description: "Posted in #kitchen: \"Just confirmed wine delivery schedule for May 21\"", navigateTo: "Comms" },
    { actionType: "task_move", avatar: "🌾", actorName: "Ana Cruz", description: "Moved \"Coordinate shuttle service\" from To Do → In Progress", navigateTo: "Task Board" },
    { actionType: "checklist_toggle", avatar: "🏺", actorName: "Maria Santos", description: "Marked \"Venue walkthrough\" as in progress", navigateTo: "Pre-Event Checklist" },
    { actionType: "menu_update", avatar: "🔥", actorName: "James Reyes", description: "Updated plating notes for Course 7 — added charcoal garnish", navigateTo: "Menu & Courses" },
    { actionType: "task_create", avatar: "📖", actorName: "Sofia Delgado", description: "Created task \"Order custom napkin rings\" — Low priority", navigateTo: "Task Board" },
    { actionType: "team_update", avatar: "✦", actorName: "Kara Reyes", description: "Updated social media calendar with 5 new posts", navigateTo: "Comms" },
    { actionType: "travel_update", avatar: "🫕", actorName: "Dio Buan", description: "Confirmed Chef Aaron's arrival — SEA → LAS on May 20", navigateTo: "Travel & Lodging" },
    { actionType: "task_complete", avatar: "🌾", actorName: "Ana Cruz", description: "Completed \"Book rehearsal dinner venue\" — moved to Done", navigateTo: "Task Board" },
    { actionType: "milestone_update", avatar: "🏺", actorName: "Maria Santos", description: "Updated milestone \"All chefs confirmed\" — 90% complete", navigateTo: "Event Timeline" },
    { actionType: "chef_confirmed", avatar: "🐚", actorName: "Denise Reyes", description: "Volunteered for FOH coordination — Day-of schedule updated", navigateTo: "Team Deploy" },
  ], []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const template = liveTemplates[liveCounterRef.current % liveTemplates.length];
      liveCounterRef.current += 1;
      const newEntry: ActivityEntry = {
        ...template,
        id: `live-${Date.now()}-${liveCounterRef.current}`,
        timestamp: new Date(),
      };
      setLiveEntries((prev) => [newEntry, ...prev].slice(0, 30)); // Keep max 30 live entries
    }, 30000);
    return () => clearInterval(interval);
  }, [isLive, liveTemplates]);

  // Combine live + static activities, sorted by timestamp
  const allActivities = useMemo(() => {
    return [...liveEntries, ...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [liveEntries, activities]);

  const filtered = useMemo(() => {
    return allActivities.filter((a) => {
      if (filterAction !== "all" && a.actionType !== filterAction) return false;
      if (filterDate !== "all") {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (filterDate === "today" && a.timestamp < todayStart) return false;
        if (filterDate === "week" && a.timestamp < new Date(todayStart.getTime() - 6 * 86400000)) return false;
        if (filterDate === "month" && a.timestamp < new Date(todayStart.getTime() - 29 * 86400000)) return false;
      }
      return true;
    });
  }, [allActivities, filterAction, filterDate]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityEntry[]>();
    for (const entry of filtered) {
      const group = getDateGroup(entry.timestamp);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(entry);
    }
    return groups;
  }, [filtered]);

  // Export CSV
  const exportCSV = () => {
    const headers = ["Timestamp", "Actor", "Action Type", "Description", "Detail"];
    const rows = filtered.map((a) => [
      a.timestamp.toISOString(),
      a.actorName,
      actionTypeConfig[a.actionType].label,
      `"${a.description.replace(/"/g, '""')}"`,
      a.detail ? `"${a.detail.replace(/"/g, '""')}"` : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export PDF
  const exportPDF = () => {
    printToPDF({
      title: "Activity Log",
      subtitle: `${filtered.length} events — Isang Kusina 2026`,
      columns: [
        { header: "Time", key: "time" },
        { header: "Actor", key: "actor" },
        { header: "Type", key: "type" },
        { header: "Description", key: "description" },
        { header: "Detail", key: "detail" },
      ],
      rows: filtered.map((a) => ({
        time: formatRelativeTime(a.timestamp),
        actor: a.actorName,
        type: actionTypeConfig[a.actionType].label,
        description: a.description,
        detail: a.detail || "",
      })),
    });
  };

  const actionTypes: ActionType[] = [
    "task_move", "task_create", "task_complete", "checklist_toggle",
    "menu_update", "chef_confirmed", "travel_update", "chat_message",
    "team_update", "milestone_update",
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Activity Log
            </h2>
            <span
              className="text-[0.6875rem] px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(212,168,67,0.1)", color: "#D4A843", ...bodyFont }}
            >
              {filtered.length} events
            </span>
            {/* Live indicator */}
            <button
              onClick={() => setIsLive(!isLive)}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
              style={{
                backgroundColor: isLive ? "rgba(93,160,107,0.1)" : "rgba(107,127,142,0.08)",
                border: `1px solid ${isLive ? "rgba(93,160,107,0.2)" : "rgba(107,127,142,0.15)"}`,
              }}
              title={isLive ? "Live updates active — click to pause" : "Updates paused — click to resume"}
            >
              {isLive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "#5DA06B" }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: "#5DA06B" }} />
                </span>
              )}
              <span
                className="text-[0.625rem] uppercase tracking-wider"
                style={{ color: isLive ? "#5DA06B" : "#6B7F8E", ...bodyFont, fontWeight: 600 }}
              >
                {isLive ? "Live" : "Paused"}
              </span>
              {liveEntries.length > 0 && (
                <span className="text-[0.5625rem]" style={{ color: isLive ? "#5DA06B" : "#6B7F8E", ...bodyFont }}>
                  +{liveEntries.length}
                </span>
              )}
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.8125rem] cursor-pointer"
            style={{
              backgroundColor: "rgba(212,168,67,0.08)",
              color: "#D4A843",
              border: "1px solid rgba(212,168,67,0.2)",
              ...bodyFont,
            }}
          >
            <Tag className="w-3.5 h-3.5" />
            Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[0.8125rem] cursor-pointer"
            style={{
              backgroundColor: "rgba(212,168,67,0.08)",
              color: "#D4A843",
              border: "1px solid rgba(212,168,67,0.2)",
              ...bodyFont,
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </motion.button>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          Chronological feed of all actions across the hub.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="space-y-2.5"
      >
        {/* Date range filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
          {([
            { value: "all" as DateFilter, label: "All Time" },
            { value: "today" as DateFilter, label: "Today" },
            { value: "week" as DateFilter, label: "This Week" },
            { value: "month" as DateFilter, label: "This Month" },
          ]).map((df) => (
            <button
              key={df.value}
              onClick={() => setFilterDate(df.value)}
              className={`px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors cursor-pointer ${
                filterDate === df.value
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={bodyFont}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* Action type filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/40" />
          <button
            onClick={() => setFilterAction("all")}
            className={`px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors cursor-pointer ${
              filterAction === "all"
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
            }`}
            style={bodyFont}
          >
            All
          </button>
          {actionTypes.map((at) => {
            const cfg = actionTypeConfig[at];
            const isActive = filterAction === at;
            return (
              <button
                key={at}
                onClick={() => setFilterAction(isActive ? "all" : at)}
                className={`px-2 py-1 rounded-lg text-[0.6875rem] transition-colors cursor-pointer ${
                  isActive ? "border" : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
                }`}
                style={
                  isActive
                    ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}30`, color: cfg.color, ...bodyFont }
                    : bodyFont
                }
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Activity feed */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-4"
      >
        {Array.from(grouped.entries()).map(([groupLabel, entries]) => (
          <div key={groupLabel}>
            {/* Group header */}
            <div className="flex items-center gap-2 mb-2.5">
              <span
                className="text-[0.6875rem] uppercase tracking-[0.12em] text-muted-foreground/60"
                style={{ ...bodyFont, fontWeight: 600 }}
              >
                {groupLabel}
              </span>
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-[0.625rem] text-muted-foreground/40" style={bodyFont}>
                {entries.length} {entries.length === 1 ? "event" : "events"}
              </span>
            </div>

            {/* Entries */}
            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, idx) => {
                  const cfg = actionTypeConfig[entry.actionType];
                  const Icon = cfg.icon;
                  const isExpanded = expandedEntry === entry.id;

                  return (
                    <motion.div
                      key={entry.id}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.25 }}
                    >
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 rounded-xl bg-card cursor-pointer hover:bg-secondary/30 text-left"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: cfg.bg }}
                          >
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span
                              className="w-5 h-5 rounded-md flex items-center justify-center text-[0.625rem] shrink-0"
                              style={{ backgroundColor: "rgba(196,147,112,0.08)", border: "1px solid rgba(196,147,112,0.12)" }}
                            >
                              {entry.avatar}
                            </span>
                            <span className="text-[0.8125rem] text-foreground" style={{ ...bodyFont, fontWeight: 500 }}>
                              {entry.actorName}
                            </span>
                            <span
                              className="text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: cfg.bg, color: cfg.color, ...bodyFont }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-[0.8125rem] text-foreground/80 leading-relaxed" style={bodyFont}>
                            {entry.description}
                          </p>

                          <AnimatePresence>
                            {isExpanded && entry.detail && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-[0.75rem] text-muted-foreground/60 mt-1 leading-relaxed"
                                style={bodyFont}
                              >
                                {entry.detail}
                              </motion.p>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[0.625rem] text-muted-foreground/40" style={bodyFont}>
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                            {entry.navigateTo && onNavigate && (
                              <span
                                className="text-[0.625rem] flex items-center gap-0.5 transition-colors hover:opacity-80"
                                style={{ color: cfg.color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(entry.navigateTo!);
                                }}
                              >
                                Go to {entry.navigateTo}
                                <ArrowRight className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expand indicator */}
                        {entry.detail && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-1 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(196,147,112,0.06))",
                border: "1px dashed rgba(212,168,67,0.2)",
              }}
            >
              <Activity className="w-6 h-6" style={{ color: "#D4A843", opacity: 0.5 }} />
            </div>
            <h4 className="text-foreground text-[1rem] mb-1" style={headingFont}>
              No activity found
            </h4>
            <p className="text-muted-foreground text-[0.8125rem] max-w-[260px] leading-relaxed" style={bodyFont}>
              No events match your current filters. Try broadening your search.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}