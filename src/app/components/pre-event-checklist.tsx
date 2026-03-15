import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  CheckCircle2,
  Circle,
  CalendarDays,
  Truck,
  UtensilsCrossed,
  MessageCircle,
  Wrench,
  Sparkles,
  PartyPopper,
  AlertTriangle,
  Filter,
  Download,
  FileText,
  Database,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { useAnnouncement } from "../lib/use-announcement";
import { printToPDF } from "../lib/print-pdf";
import { toast } from "sonner";
import { ChecklistSkeleton } from "./ui/skeleton-loaders";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const EVENT_DATE = new Date("2026-06-14T18:00:00");

type ChecklistCategory = "Logistics" | "Menu" | "Comms" | "Setup";
type TaskProgress = "not-started" | "in-progress" | "complete";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: ChecklistCategory;
  dueDate: string;
  critical?: boolean;
  assignee: string;
  assigneeEmoji: string;
  taskStatus: TaskProgress;
  lastUpdated: string;
}

const progressConfig: Record<TaskProgress, { label: string; color: string; bg: string }> = {
  "not-started": { label: "Not Started", color: "#6B7F8E", bg: "rgba(107,127,142,0.08)" },
  "in-progress": { label: "In Progress", color: "#D4A843", bg: "rgba(212,168,67,0.08)" },
  "complete": { label: "Complete", color: "#7E9E78", bg: "rgba(126,158,120,0.1)" },
};

const categoryConfig: Record<ChecklistCategory, { icon: typeof Clock; color: string; bg: string }> = {
  Logistics: { icon: Truck, color: "#4A7FB5", bg: "rgba(74,127,181,0.1)" },
  Menu: { icon: UtensilsCrossed, color: "#7E9E78", bg: "rgba(126,158,120,0.1)" },
  Comms: { icon: MessageCircle, color: "#1A5C38", bg: "rgba(26,92,56,0.1)" },
  Setup: { icon: Wrench, color: "#C49370", bg: "rgba(196,147,112,0.1)" },
};

const checklistItems: ChecklistItem[] = [
  { id: "cl1", label: "Confirm guest list", description: "Finalize the 200+ guest RSVP list and dietary restrictions.", category: "Logistics", dueDate: "May 15, 2026", critical: true, assignee: "Maria Santos", assigneeEmoji: "🏺", taskStatus: "in-progress", lastUpdated: "Mar 8, 2026" },
  { id: "cl2", label: "Finalize menu", description: "Lock in all 7 courses with chef approvals and ingredient procurement list.", category: "Menu", dueDate: "May 10, 2026", critical: true, assignee: "Dio Buan", assigneeEmoji: "🫕", taskStatus: "in-progress", lastUpdated: "Mar 9, 2026" },
  { id: "cl3", label: "Send invitations", description: "Dispatch digital invitations and physical save-the-dates to VIP guests.", category: "Comms", dueDate: "Apr 30, 2026", assignee: "Sofia Delgado", assigneeEmoji: "📖", taskStatus: "complete", lastUpdated: "Mar 5, 2026" },
  { id: "cl4", label: "Venue walkthrough", description: "Complete final walkthrough of KMA Event Center — kitchen stations, dining layout, AV setup.", category: "Logistics", dueDate: "Jun 7, 2026", assignee: "Maria Santos", assigneeEmoji: "🏺", taskStatus: "not-started", lastUpdated: "Mar 1, 2026" },
  { id: "cl5", label: "Equipment check", description: "Verify all kitchen equipment, portable kamado grills, chafing dishes, and service ware.", category: "Setup", dueDate: "Jun 10, 2026", critical: true, assignee: "James Reyes", assigneeEmoji: "🔥", taskStatus: "not-started", lastUpdated: "Feb 28, 2026" },
  { id: "cl6", label: "Chef briefing", description: "All-hands chef briefing on course timing, plating standards, and service flow.", category: "Menu", dueDate: "Jun 12, 2026", assignee: "Dio Buan", assigneeEmoji: "🫕", taskStatus: "not-started", lastUpdated: "Mar 2, 2026" },
  { id: "cl7", label: "Table assignments", description: "Finalize seating chart with host table, VIP section, and general seating.", category: "Setup", dueDate: "Jun 11, 2026", assignee: "Ana Cruz", assigneeEmoji: "🌾", taskStatus: "not-started", lastUpdated: "Mar 3, 2026" },
  { id: "cl8", label: "Print materials ready", description: "Menus, name cards, signage, and program booklets printed and delivered.", category: "Comms", dueDate: "Jun 10, 2026", assignee: "Sofia Delgado", assigneeEmoji: "📖", taskStatus: "not-started", lastUpdated: "Feb 25, 2026" },
  { id: "cl9", label: "Beverage program finalized", description: "Confirm cocktail menu, wine pairings, and non-alcoholic options with bartender.", category: "Menu", dueDate: "Jun 1, 2026", assignee: "Jerjon Castillo", assigneeEmoji: "🍃", taskStatus: "in-progress", lastUpdated: "Mar 10, 2026" },
  { id: "cl10", label: "Photography & media brief", description: "Brief Luisa Mabini and videographer on shot list, key moments, and social media plan.", category: "Comms", dueDate: "Jun 8, 2026", assignee: "Kara Reyes", assigneeEmoji: "✦", taskStatus: "not-started", lastUpdated: "Mar 4, 2026" },
  { id: "cl11", label: "FOH staff rehearsal", description: "Run full front-of-house service rehearsal with 20+ servers.", category: "Setup", dueDate: "Jun 13, 2026", critical: true, assignee: "Ana Cruz", assigneeEmoji: "🌾", taskStatus: "not-started", lastUpdated: "Mar 1, 2026" },
  { id: "cl12", label: "Transport logistics confirmed", description: "Airport pickups, hotel shuttles, and venue transfers all confirmed.", category: "Logistics", dueDate: "Jun 5, 2026", assignee: "Maria Santos", assigneeEmoji: "🏺", taskStatus: "in-progress", lastUpdated: "Mar 7, 2026" },
];

const STORAGE_KEY = "ik26-checklist-checked";

function loadChecked(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

interface PreEventChecklistProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function PreEventChecklist({ role, onNavigate }: PreEventChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);
  const [filterCategory, setFilterCategory] = useState<ChecklistCategory | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterProgress, setFilterProgress] = useState<TaskProgress | "all">("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Notion integration — pull milestones data when configured
  const { items: notionItems, isLoading: notionMilestonesLoading } = useNotionDatabase("milestones");

  // Transform Notion milestones into checklist items if available
  const notionChecklistItems: ChecklistItem[] = notionItems.length > 0
    ? notionItems
        .filter((item: any) => item.Milestone || item.Name || item.Task || item.Title)
        .map((item: any, idx: number) => {
          const statusStr = (item.Status || "").toLowerCase();
          const taskStatus: TaskProgress = statusStr.includes("done") || statusStr.includes("complete") ? "complete"
            : statusStr.includes("progress") ? "in-progress"
            : "not-started";
          const catStr = (item.Division || item.Category || "").toLowerCase();
          const category: ChecklistCategory = catStr.includes("menu") || catStr.includes("food") || catStr.includes("bev") ? "Menu"
            : catStr.includes("comms") || catStr.includes("market") ? "Comms"
            : catStr.includes("setup") || catStr.includes("venue") ? "Setup"
            : "Logistics";
          return {
            id: item._notionId || `notion-cl-${idx}`,
            label: item.Milestone || item.Name || item.Task || item.Title || "Untitled",
            description: item.Description || item["Blocks / Dependencies"] || "",
            category,
            dueDate: item["Due Date"] ? new Date(item["Due Date"]).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD",
            critical: statusStr.includes("critical") || statusStr.includes("overdue"),
            assignee: item.Owner || item.Assignee || "Unassigned",
            assigneeEmoji: "📋",
            taskStatus,
            lastUpdated: item._lastEdited ? new Date(item._lastEdited).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
          };
        })
    : [];

  const activeChecklistItems = notionChecklistItems.length > 0 ? notionChecklistItems : checklistItems;
  const isFromNotion = notionChecklistItems.length > 0;

  // Simulate hydration delay to show skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  // Screen reader announcements
  const { message: srMessage, announce } = useAnnouncement();

  // Countdown state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const calcTimeLeft = useCallback(() => {
    const now = new Date();
    const diff = EVENT_DATE.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }, []);

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [calcTimeLeft]);

  // Persist checked state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked]);

  const toggleItem = (id: string) => {
    const item = activeChecklistItems.find((i) => i.id === id);
    const willBeChecked = !checked[id];
    setChecked((prev) => ({ ...prev, [id]: willBeChecked }));
    if (item) {
      announce(`${item.label} marked as ${willBeChecked ? "complete" : "incomplete"}`);
      toast.success(`"${item.label}" marked ${willBeChecked ? "complete" : "incomplete"}`);
    }
  };

  const completedCount = activeChecklistItems.filter((item) => checked[item.id]).length;
  const totalCount = activeChecklistItems.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const filteredItems = activeChecklistItems.filter((item) => {
    if (filterCategory !== "all" && item.category !== filterCategory) return false;
    if (filterAssignee !== "all" && item.assignee !== filterAssignee) return false;
    if (filterProgress !== "all" && item.taskStatus !== filterProgress) return false;
    if (!showCompleted && checked[item.id]) return false;
    return true;
  });

  const criticalIncomplete = activeChecklistItems.filter((item) => item.critical && !checked[item.id]);

  // Export checklist as CSV
  const exportChecklist = () => {
    const headers = ["Item", "Category", "Status", "Checked", "Critical", "Assignee", "Due Date", "Last Updated"];
    const rows = activeChecklistItems.map((item) => [
      `"${item.label}"`,
      item.category,
      progressConfig[item.taskStatus].label,
      checked[item.id] ? "Yes" : "No",
      item.critical ? "Yes" : "No",
      item.assignee,
      item.dueDate,
      item.lastUpdated,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pre-event-checklist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${totalCount} checklist items as CSV`);
  };

  // Export checklist as PDF
  const exportChecklistPDF = () => {
    printToPDF({
      title: "Pre-Event Checklist",
      subtitle: `${completedCount}/${totalCount} complete — Isang Kusina 2026`,
      columns: [
        { header: "Item", key: "label" },
        { header: "Category", key: "category" },
        { header: "Status", key: "status" },
        { header: "Checked", key: "checked" },
        { header: "Assignee", key: "assignee" },
        { header: "Due Date", key: "dueDate" },
      ],
      rows: activeChecklistItems.map((item) => ({
        label: item.label,
        category: item.category,
        status: progressConfig[item.taskStatus].label,
        checked: checked[item.id] ? "Yes" : "No",
        assignee: item.assignee,
        dueDate: item.dueDate,
      })),
    });
    toast.success("Generating PDF for print...");
  };

  if (isLoading) return <ChecklistSkeleton />;

  return (
    <div className="space-y-6">
      {/* Screen reader live region for checklist announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {srMessage}
      </div>

      {/* Countdown Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(43,68,64,0.95), rgba(92,114,86,0.85))",
          border: "1px solid rgba(192,209,177,0.15)",
        }}
      >
        {/* Notion sync badge — floating top-right */}
        {isFromNotion && (
          <div className="absolute top-3 right-3 z-10">
            <NotionSyncBadge isLive={isFromNotion} compact />
          </div>
        )}

        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #C0D1B1 1px, transparent 1px), radial-gradient(circle at 80% 20%, #D4A843 1px, transparent 1px)",
            backgroundSize: "60px 60px, 80px 80px",
          }}
        />

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center gap-2 mb-1">
            <PartyPopper className="w-5 h-5" style={{ color: "#D4A843" }} />
            <span className="text-[0.75rem] uppercase tracking-[0.15em]" style={{ color: "rgba(192,209,177,0.7)", ...bodyFont }}>
              Countdown to
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2.25rem] leading-tight mb-6"
            style={{ ...headingFont, color: "#F5F0E8" }}
          >
            Isang Kusina 2026
          </h2>

          {/* Timer blocks */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md">
            {([
              { value: timeLeft.days, label: "Days" },
              { value: timeLeft.hours, label: "Hours" },
              { value: timeLeft.minutes, label: "Mins" },
              { value: timeLeft.seconds, label: "Secs" },
            ] as const).map((unit, idx) => (
              <motion.div
                key={unit.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.06, duration: 0.4 }}
                className="text-center rounded-xl py-3 sm:py-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="text-[1.5rem] sm:text-[2rem] leading-none"
                  style={{ ...headingFont, color: "#D4A843" }}
                >
                  {String(unit.value).padStart(2, "0")}
                </div>
                <div className="text-[0.625rem] sm:text-[0.6875rem] uppercase tracking-wider mt-1.5" style={{ color: "rgba(192,209,177,0.6)", ...bodyFont }}>
                  {unit.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Event date */}
          <div className="flex items-center gap-2 mt-5 text-[0.75rem]" style={{ color: "rgba(192,209,177,0.5)", ...bodyFont }}>
            <CalendarDays className="w-3.5 h-3.5" />
            <span>June 14, 2026 &middot; 6:00 PM &middot; KMA Event Center, Las Vegas</span>
          </div>
        </div>
      </motion.div>

      {/* Progress section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-card rounded-xl p-5 sm:p-6"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#D4A843" }} />
            <h3 style={headingFont} className="text-foreground">Preparation Progress</h3>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportChecklist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(212,168,67,0.08)",
                color: "#D4A843",
                border: "1px solid rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
              aria-label="Export checklist as CSV"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportChecklistPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(212,168,67,0.08)",
                color: "#D4A843",
                border: "1px solid rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
              aria-label="Export checklist as PDF"
            >
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline">PDF</span>
            </motion.button>
            <span
              className="text-[0.8125rem] px-3 py-1 rounded-full"
              style={{
                backgroundColor: progressPct === 100 ? "rgba(126,158,120,0.12)" : "rgba(212,168,67,0.12)",
                color: progressPct === 100 ? "#7E9E78" : "#D4A843",
                ...bodyFont,
              }}
            >
              {completedCount}/{totalCount} tasks
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: "rgba(196,147,112,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: progressPct === 100
                ? "linear-gradient(90deg, #7E9E78, #5DA06B)"
                : "linear-gradient(90deg, #D4A843, #C49370)",
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[0.6875rem] text-muted-foreground" style={bodyFont}>
          <span>{progressPct}% complete</span>
          {progressPct === 100 ? (
            <span style={{ color: "#7E9E78" }} className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All set!
            </span>
          ) : (
            <span>{totalCount - completedCount} remaining</span>
          )}
        </div>

        {/* Critical items warning */}
        {criticalIncomplete.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-3 rounded-lg flex items-start gap-2.5"
            style={{ backgroundColor: "rgba(199,91,63,0.06)", border: "1px solid rgba(199,91,63,0.12)" }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#C75B3F" }} />
            <div>
              <p className="text-[0.75rem]" style={{ color: "#C75B3F", ...bodyFont }}>
                <strong>{criticalIncomplete.length} critical {criticalIncomplete.length === 1 ? "task" : "tasks"}</strong> still pending
              </p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5" style={bodyFont}>
                {criticalIncomplete.map((i) => i.label).join(", ")}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex flex-wrap items-center gap-2"
      >
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors cursor-pointer ${
            filterCategory === "all"
              ? "bg-gold/15 text-gold border border-gold/30"
              : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
          }`}
          style={bodyFont}
        >
          All ({totalCount})
        </button>
        {(Object.keys(categoryConfig) as ChecklistCategory[]).map((cat) => {
          const cfg = categoryConfig[cat];
          const count = checklistItems.filter((i) => i.category === cat).length;
          const isActive = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? "all" : cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors cursor-pointer ${
                isActive ? "border" : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={
                isActive
                  ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}30`, color: cfg.color, ...bodyFont }
                  : bodyFont
              }
            >
              {cat} ({count})
            </button>
          );
        })}

        <div className="w-px h-6 bg-border mx-1" />
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors cursor-pointer ${
            !showCompleted
              ? "bg-gold/10 text-gold border border-gold/20"
              : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
          }`}
          style={bodyFont}
        >
          <CheckCircle2 className="w-3 h-3" />
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </motion.div>

      {/* Secondary filters: Assignee + Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17, duration: 0.4 }}
        className="flex flex-wrap items-center gap-2 -mt-3"
      >
        <Filter className="w-3 h-3 text-muted-foreground/30" />
        {/* Assignee dropdown */}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] bg-secondary/60 text-muted-foreground cursor-pointer outline-none transition-colors hover:border-border"
          style={{ border: "1px solid transparent", ...bodyFont }}
        >
          <option value="all">All Assignees</option>
          {Array.from(new Set(checklistItems.map((i) => i.assignee))).map((name) => {
            const item = checklistItems.find((i) => i.assignee === name);
            return (
              <option key={name} value={name}>
                {item?.assigneeEmoji} {name}
              </option>
            );
          })}
        </select>
        {/* Status filter pills */}
        {(["not-started", "in-progress", "complete"] as TaskProgress[]).map((s) => {
          const isActive = filterProgress === s;
          const cfg = progressConfig[s];
          const count = checklistItems.filter((i) => i.taskStatus === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterProgress(isActive ? "all" : s)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors cursor-pointer ${
                isActive ? "border" : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={
                isActive
                  ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}30`, color: cfg.color, ...bodyFont }
                  : bodyFont
              }
            >
              {s === "complete" ? (
                <CheckCircle2 className="w-2.5 h-2.5" />
              ) : s === "in-progress" ? (
                <Clock className="w-2.5 h-2.5" />
              ) : (
                <Circle className="w-2.5 h-2.5" />
              )}
              {cfg.label} ({count})
            </button>
          );
        })}
        {(filterAssignee !== "all" || filterProgress !== "all") && (
          <button
            onClick={() => { setFilterAssignee("all"); setFilterProgress("all"); }}
            className="px-2 py-1 rounded-lg text-[0.6875rem] text-muted-foreground/50 cursor-pointer hover:text-foreground transition-colors"
            style={bodyFont}
          >
            Clear filters
          </button>
        )}
      </motion.div>

      {/* Checklist items */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border/40"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item, idx) => {
            const isChecked = checked[item.id] || false;
            const cfg = categoryConfig[item.category];
            const CatIcon = cfg.icon;

            return (
              <motion.div
                key={item.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: 0.02 * idx, duration: 0.3 }}
                className="group"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-start gap-3.5 px-5 py-4 text-left cursor-pointer hover:bg-secondary/30"
                  style={isChecked ? { backgroundColor: "rgba(126,158,120,0.03)" } : undefined}
                >
                  {/* Checkbox */}
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: "rgba(126,158,120,0.15)", border: "1px solid rgba(126,158,120,0.3)" }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
                      </motion.div>
                    ) : (
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center group-hover:border-gold/40 transition-colors"
                        style={{ border: "1.5px solid rgba(196,147,112,0.25)", backgroundColor: "rgba(196,147,112,0.03)" }}
                      >
                        <Circle className="w-3 h-3 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span
                        className={`text-[0.875rem] ${isChecked ? "line-through text-muted-foreground/50" : "text-foreground"}`}
                        style={bodyFont}
                      >
                        {item.label}
                      </span>
                      {item.critical && !isChecked && (
                        <span
                          className="text-[0.5625rem] px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ backgroundColor: "rgba(199,91,63,0.1)", color: "#C75B3F", ...bodyFont }}
                        >
                          Critical
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[0.75rem] leading-relaxed ${isChecked ? "text-muted-foreground/30" : "text-muted-foreground/70"}`}
                      style={bodyFont}
                    >
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      {/* Assignee avatar */}
                      <span className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground/60" style={bodyFont}>
                        <span
                          className="w-4 h-4 rounded-sm flex items-center justify-center text-[0.5rem]"
                          style={{ backgroundColor: "rgba(196,147,112,0.08)", border: "1px solid rgba(196,147,112,0.12)" }}
                        >
                          {item.assigneeEmoji}
                        </span>
                        {item.assignee.split(" ")[0]}
                      </span>
                      {/* Task status badge */}
                      <span
                        className="inline-flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: progressConfig[item.taskStatus].bg, color: progressConfig[item.taskStatus].color, ...bodyFont }}
                      >
                        {item.taskStatus === "complete" ? (
                          <CheckCircle2 className="w-2 h-2" />
                        ) : item.taskStatus === "in-progress" ? (
                          <Clock className="w-2 h-2" />
                        ) : (
                          <Circle className="w-2 h-2" />
                        )}
                        {progressConfig[item.taskStatus].label}
                      </span>
                      {/* Category tag */}
                      <span
                        className="inline-flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: cfg.bg, color: cfg.color, ...bodyFont }}
                      >
                        <CatIcon className="w-2 h-2" />
                        {item.category}
                      </span>
                      {/* Due date */}
                      <span className="flex items-center gap-1 text-[0.5625rem] text-muted-foreground/40" style={bodyFont}>
                        <CalendarDays className="w-2 h-2" />
                        {item.dueDate}
                      </span>
                      {/* Last updated */}
                      <span className="flex items-center gap-1 text-[0.5625rem] text-muted-foreground/30" style={bodyFont}>
                        Updated {item.lastUpdated}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="px-5 py-14 flex flex-col items-center text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(126,158,120,0.08), rgba(212,168,67,0.06))",
                border: "1px dashed rgba(126,158,120,0.2)",
              }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: "#7E9E78", opacity: 0.5 }} />
            </div>
            <h4 className="text-foreground text-[1rem] mb-1" style={headingFont}>
              {!showCompleted ? "All caught up!" : "No matches"}
            </h4>
            <p className="text-muted-foreground text-[0.8125rem] max-w-[260px] leading-relaxed mb-4" style={bodyFont}>
              {!showCompleted
                ? "Every item in this category is completed. Great teamwork — the event is coming together."
                : "No checklist items match your current filters. Try adjusting your selection."}
            </p>
            {!showCompleted && (
              <button
                onClick={() => setShowCompleted(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
                style={{
                  backgroundColor: "rgba(126,158,120,0.08)",
                  color: "#7E9E78",
                  border: "1px solid rgba(126,158,120,0.15)",
                  ...bodyFont,
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Show completed items
              </button>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Footer nav */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Task Board")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(74,127,181,0.06)", border: "1px solid rgba(74,127,181,0.12)", ...bodyFont }}
          >
            <Wrench className="w-4 h-4" style={{ color: "#4A7FB5" }} />
            <span className="text-[0.8125rem]" style={{ color: "#4A7FB5" }}>Open Task Board</span>
          </button>
          <button
            onClick={() => onNavigate("Event Schedule")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(107,127,142,0.06)", border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
          >
            <CalendarDays className="w-4 h-4" style={{ color: "#6B7F8E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#6B7F8E" }}>View Event Day Schedule</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}