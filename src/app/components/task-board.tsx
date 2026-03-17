import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  X,
  Clock,
  User,
  Tag,
  ChevronDown,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Circle,
  Filter,
  GripVertical,
  Download,
  FileText,
  LayoutGrid,
  Calendar,
  RefreshCw,
  Cloud,
  CloudOff,
  Settings2,
  ArrowUpDown,
  Database,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { useAnnouncement } from "../lib/use-announcement";
import { useFocusTrap } from "../lib/use-focus-trap";
import { printToPDF } from "../lib/print-pdf";
import { toast } from "sonner";
import { TaskBoardSkeleton } from "./ui/skeleton-loaders";
import { TaskCalendarView } from "./task-calendar-view";
import { apiFetch } from "../lib/supabase";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { transformMilestone } from "../lib/notion-transforms";
import { Target } from "lucide-react";
import { bodyFont, headingFont } from "../lib/fonts";

type Priority = "high" | "medium" | "low";
type TaskStatus = "todo" | "in-progress" | "done";
type TaskCategory = "Logistics" | "Menu" | "Comms" | "Setup" | "Creative";
type ViewMode = "kanban" | "calendar";

interface TaskCard {
  id: string;
  title: string;
  assignee: string;
  assigneeEmoji: string;
  dueDate: string;
  priority: Priority;
  category: TaskCategory;
  status: TaskStatus;
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  high: { label: "High", color: "#C75B3F", bg: "rgba(199,91,63,0.1)", dot: "#C75B3F" },
  medium: { label: "Medium", color: "#D4A843", bg: "rgba(212,168,67,0.1)", dot: "#D4A843" },
  low: { label: "Low", color: "#7E9E78", bg: "rgba(126,158,120,0.1)", dot: "#7E9E78" },
};

const categoryColors: Record<TaskCategory, { color: string; bg: string }> = {
  Logistics: { color: "#4A7FB5", bg: "rgba(74,127,181,0.08)" },
  Menu: { color: "#7E9E78", bg: "rgba(126,158,120,0.08)" },
  Comms: { color: "#1A5C38", bg: "rgba(26,92,56,0.08)" },
  Setup: { color: "#C49370", bg: "rgba(196,147,112,0.08)" },
  Creative: { color: "#D4A843", bg: "rgba(212,168,67,0.08)" },
};

const columnConfig: Record<TaskStatus, { label: string; icon: typeof Circle; color: string; bg: string; headerBg: string }> = {
  todo: { label: "To Do", icon: Circle, color: "#6B7F8E", bg: "rgba(107,127,142,0.04)", headerBg: "rgba(107,127,142,0.08)" },
  "in-progress": { label: "In Progress", icon: Loader2, color: "#D4A843", bg: "rgba(212,168,67,0.03)", headerBg: "rgba(212,168,67,0.08)" },
  done: { label: "Done", icon: CheckCircle2, color: "#7E9E78", bg: "rgba(126,158,120,0.03)", headerBg: "rgba(126,158,120,0.08)" },
};

const initialTasks: TaskCard[] = [
  { id: "t1", title: "Finalize venue floor plan", assignee: "Maria Santos", assigneeEmoji: "🏺", dueDate: "May 30", priority: "high", category: "Logistics", status: "todo" },
  { id: "t2", title: "Source calamansi (10 lbs)", assignee: "Ana Cruz", assigneeEmoji: "🌾", dueDate: "Jun 1", priority: "high", category: "Menu", status: "todo" },
  { id: "t3", title: "Print event programs", assignee: "Sofia Delgado", assigneeEmoji: "📖", dueDate: "Jun 10", priority: "medium", category: "Comms", status: "todo" },
  { id: "t4", title: "Arrange portable kamado grill", assignee: "James Reyes", assigneeEmoji: "🔥", dueDate: "Jun 8", priority: "high", category: "Setup", status: "todo" },
  { id: "t5", title: "Design social media templates", assignee: "Kara Reyes", assigneeEmoji: "✦", dueDate: "May 20", priority: "medium", category: "Creative", status: "in-progress" },
  { id: "t6", title: "Confirm wine pairings", assignee: "Jerjon Castillo", assigneeEmoji: "🍃", dueDate: "Jun 1", priority: "medium", category: "Menu", status: "in-progress" },
  { id: "t7", title: "Coordinate chef airport pickups", assignee: "Ana Cruz", assigneeEmoji: "🌾", dueDate: "Jun 12", priority: "high", category: "Logistics", status: "in-progress" },
  { id: "t8", title: "Brief photographer on shot list", assignee: "Sofia Delgado", assigneeEmoji: "📖", dueDate: "Jun 8", priority: "low", category: "Creative", status: "in-progress" },
  { id: "t9", title: "Book kitchen rehearsal space", assignee: "Dio Buan", assigneeEmoji: "🫕", dueDate: "May 15", priority: "high", category: "Setup", status: "done" },
  { id: "t10", title: "Send save-the-date emails", assignee: "Sofia Delgado", assigneeEmoji: "📖", dueDate: "Apr 30", priority: "medium", category: "Comms", status: "done" },
  { id: "t11", title: "Secure hotel group block", assignee: "Maria Santos", assigneeEmoji: "🏺", dueDate: "May 10", priority: "high", category: "Logistics", status: "done" },
  { id: "t12", title: "Chef Rachel flight booked", assignee: "Ana Cruz", assigneeEmoji: "🌾", dueDate: "May 5", priority: "medium", category: "Logistics", status: "done" },
];

const teamMembers = [
  { name: "Maria Santos", emoji: "🏺" },
  { name: "Ana Cruz", emoji: "🌾" },
  { name: "Sofia Delgado", emoji: "📖" },
  { name: "James Reyes", emoji: "🔥" },
  { name: "Jerjon Castillo", emoji: "🍃" },
  { name: "Kara Reyes", emoji: "✦" },
  { name: "Dio Buan", emoji: "🫕" },
  { name: "Denise Reyes", emoji: "🐚" },
];

const TASK_STORAGE_KEY = "ik26-task-board-tasks";

function loadSavedTasks(): TaskCard[] {
  try {
    const saved = localStorage.getItem(TASK_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialTasks;
}

interface TaskBoardProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function TaskBoard({ role, onNavigate }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskCard[]>(loadSavedTasks);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate hydration delay to show skeleton
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  // Persist tasks to localStorage on every change
  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [dragTask, setDragTask] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"above" | "below" | null>(null);
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [filterCategory, setFilterCategory] = useState<TaskCategory | "all">("all");
  const [mobileActiveCol, setMobileActiveCol] = useState<TaskStatus>("todo");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Screen reader announcements
  const { message: srMessage, announce } = useAnnouncement();

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState(teamMembers[0].name);
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newCategory, setNewCategory] = useState<TaskCategory>("Logistics");
  const [titleError, setTitleError] = useState("");

  // Focus trap for add modal
  const addModalTrapRef = useFocusTrap<HTMLDivElement>(showAddModal);

  // ─── Notion Content System Integration ──────────────────────────
  // Pull from the unified content system's schedule database for supplemental tasks
  const { items: notionScheduleItems, isLoading: notionContentLoading, refresh: refreshNotionContent } = useNotionDatabase("schedule");
  const isNotionContentLive = notionScheduleItems.length > 0;

  // ─── Notion Milestones (open items grouped by owner) ──────────
  const { items: notionMilestoneItems } = useNotionDatabase("milestones");
  const openMilestones = notionMilestoneItems
    .map(transformMilestone)
    .filter(m => m.status !== "done" && m.title)
    .sort((a, b) => (a.sortDate || "9999").localeCompare(b.sortDate || "9999"));
  const milestonesByOwner = new Map<string, typeof openMilestones>();
  for (const m of openMilestones) {
    const owner = m.owner || "Unassigned";
    if (!milestonesByOwner.has(owner)) milestonesByOwner.set(owner, []);
    milestonesByOwner.get(owner)!.push(m);
  }
  const milestoneOwners = Array.from(milestonesByOwner.entries()).sort((a, b) => b[1].length - a[1].length);

  // ─── Notion Sync State (legacy task-specific sync) ────────────
  const [notionSyncing, setNotionSyncing] = useState(false);
  const [notionConfigured, setNotionConfigured] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showNotionConfig, setShowNotionConfig] = useState(false);
  const [notionDbId, setNotionDbId] = useState("");
  const notionConfigRef = useFocusTrap<HTMLDivElement>(showNotionConfig);

  // Check Notion sync status on mount
  useEffect(() => {
    apiFetch("/notion/tasks/sync-status")
      .then((res) => {
        setNotionConfigured(res.configured);
        if (res.syncMeta?.lastSyncUp) setLastSyncTime(res.syncMeta.lastSyncUp);
        else if (res.syncMeta?.lastSyncDown) setLastSyncTime(res.syncMeta.lastSyncDown);
      })
      .catch(() => {});
  }, []);

  // Configure Notion DB
  const configureNotionDb = useCallback(async () => {
    if (!notionDbId.trim()) return;
    try {
      await apiFetch("/notion/tasks/configure", {
        method: "POST",
        body: JSON.stringify({ databaseId: notionDbId.trim() }),
      });
      setNotionConfigured(true);
      setShowNotionConfig(false);
      toast.success("Notion tasks database configured!");
    } catch (err) {
      console.error("Notion config error:", err);
      toast.error("Failed to configure Notion database");
    }
  }, [notionDbId]);

  // Sync tasks to Notion (push)
  const syncToNotion = useCallback(async () => {
    setNotionSyncing(true);
    try {
      const res = await apiFetch("/notion/tasks/sync-up", {
        method: "POST",
        body: JSON.stringify({ tasks }),
      });
      setLastSyncTime(res.lastSyncUp);
      const parts: string[] = [];
      if (res.created > 0) parts.push(`${res.created} created`);
      if (res.updated > 0) parts.push(`${res.updated} updated`);
      if (res.errors?.length > 0) parts.push(`${res.errors.length} errors`);
      toast.success(`Synced to Notion: ${parts.join(", ") || "up to date"}`);
      if (res.errors?.length > 0) {
        console.warn("Notion sync errors:", res.errors);
      }
    } catch (err) {
      console.error("Notion sync error:", err);
      toast.error("Failed to sync tasks to Notion");
    } finally {
      setNotionSyncing(false);
    }
  }, [tasks]);

  // Pull tasks from Notion (download)
  const pullFromNotion = useCallback(async () => {
    setNotionSyncing(true);
    try {
      const res = await apiFetch("/notion/tasks/sync-down");
      if (res.tasks && Array.isArray(res.tasks) && res.tasks.length > 0) {
        setTasks(res.tasks);
        setLastSyncTime(res.lastSyncDown);
        toast.success(`Pulled ${res.tasks.length} tasks from Notion`);
      } else {
        toast.info("No tasks found in Notion database");
      }
    } catch (err) {
      console.error("Notion pull error:", err);
      toast.error("Failed to pull tasks from Notion");
    } finally {
      setNotionSyncing(false);
    }
  }, []);

  const columns: TaskStatus[] = ["todo", "in-progress", "done"];

  const addTask = useCallback(() => {
    if (!newTitle.trim()) {
      setTitleError("Task title is required");
      return;
    }
    if (newTitle.trim().length < 3) {
      setTitleError("Title must be at least 3 characters");
      return;
    }
    setTitleError("");
    const member = teamMembers.find((m) => m.name === newAssignee) || teamMembers[0];
    const task: TaskCard = {
      id: `t-${Date.now()}`,
      title: newTitle.trim(),
      assignee: member.name,
      assigneeEmoji: member.emoji,
      dueDate: newDueDate || "TBD",
      priority: newPriority,
      category: newCategory,
      status: "todo",
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    setNewDueDate("");
    setShowAddModal(false);
    toast.success(`Task "${task.title}" added to To Do`);
  }, [newTitle, newAssignee, newDueDate, newPriority, newCategory]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus, insertBeforeId?: string | null, insertPosition?: "above" | "below" | null) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;
      const updated = { ...task, status: newStatus };
      const without = prev.filter((t) => t.id !== taskId);

      if (insertBeforeId) {
        const targetIdx = without.findIndex((t) => t.id === insertBeforeId);
        if (targetIdx !== -1) {
          const insertIdx = insertPosition === "below" ? targetIdx + 1 : targetIdx;
          return [...without.slice(0, insertIdx), updated, ...without.slice(insertIdx)];
        }
      }
      // If no target, append to end of column
      const colTasks = without.filter((t) => t.status === newStatus);
      const lastColIdx = colTasks.length > 0
        ? without.indexOf(colTasks[colTasks.length - 1]) + 1
        : without.length;
      return [...without.slice(0, lastColIdx), updated, ...without.slice(lastColIdx)];
    });
  }, []);

  // Keyboard navigation: move task up/down within column, or left/right between columns
  const handleTaskKeyDown = useCallback((e: React.KeyboardEvent, task: TaskCard) => {
    const colTasks = tasks.filter((t) => t.status === task.status);
    const idx = colTasks.findIndex((t) => t.id === task.id);

    if (e.altKey && e.key === "ArrowUp" && idx > 0) {
      e.preventDefault();
      moveTask(task.id, task.status, colTasks[idx - 1].id, "above");
      announce(`Task "${task.title}" moved up in ${columnConfig[task.status].label}`);
    } else if (e.altKey && e.key === "ArrowDown" && idx < colTasks.length - 1) {
      e.preventDefault();
      moveTask(task.id, task.status, colTasks[idx + 1].id, "below");
      announce(`Task "${task.title}" moved down in ${columnConfig[task.status].label}`);
    } else if (e.altKey && e.key === "ArrowLeft") {
      e.preventDefault();
      const colIdx = columns.indexOf(task.status);
      if (colIdx > 0) {
        moveTask(task.id, columns[colIdx - 1]);
        announce(`Task "${task.title}" moved to ${columnConfig[columns[colIdx - 1]].label}`);
        toast.success(`"${task.title}" moved to ${columnConfig[columns[colIdx - 1]].label}`);
      }
    } else if (e.altKey && e.key === "ArrowRight") {
      e.preventDefault();
      const colIdx = columns.indexOf(task.status);
      if (colIdx < columns.length - 1) {
        moveTask(task.id, columns[colIdx + 1]);
        announce(`Task "${task.title}" moved to ${columnConfig[columns[colIdx + 1]].label}`);
        toast.success(`"${task.title}" moved to ${columnConfig[columns[colIdx + 1]].label}`);
      }
    }
  }, [tasks, moveTask, columns, announce]);

  // Filter
  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    return true;
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ["Title", "Status", "Priority", "Category", "Assignee", "Due Date"];
    const rows = tasks.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      columnConfig[t.status].label,
      priorityConfig[t.priority].label,
      t.category,
      t.assignee,
      t.dueDate,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-board-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${tasks.length} tasks as CSV`);
  };

  // Export PDF
  const exportPDF = () => {
    printToPDF({
      title: "Task Board",
      subtitle: `${tasks.length} tasks — Exported from Isang Kusina 2026`,
      columns: [
        { header: "Title", key: "title" },
        { header: "Status", key: "status" },
        { header: "Priority", key: "priority" },
        { header: "Category", key: "category" },
        { header: "Assignee", key: "assignee" },
        { header: "Due Date", key: "dueDate" },
      ],
      rows: tasks.map((t) => ({
        title: t.title,
        status: columnConfig[t.status].label,
        priority: priorityConfig[t.priority].label,
        category: t.category,
        assignee: t.assignee,
        dueDate: t.dueDate,
      })),
    });
    toast.success("Generating PDF for print...");
  };

  if (isLoading) return <TaskBoardSkeleton />;

  return (
    <div className="space-y-5">
      {/* Screen reader live region for task move announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {srMessage}
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Task Board
            </h2>
            <span
              className="text-[0.6875rem] px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(212,168,67,0.1)", color: "#D4A843", ...bodyFont }}
            >
              {tasks.length} tasks
            </span>
            <NotionSyncBadge isLive={isNotionContentLive || notionConfigured} itemCount={isNotionContentLive ? notionScheduleItems.length : undefined} />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(212,168,67,0.08)",
                color: "#D4A843",
                border: "1px solid rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
              aria-label="Export tasks as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.75rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(212,168,67,0.08)",
                color: "#D4A843",
                border: "1px solid rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
              aria-label="Export tasks as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #D4A843, #C49370)",
                color: "#FFFDF5",
                boxShadow: "0 2px 8px rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </motion.button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          Drag cards between columns to update status.
        </p>
        <p className="text-muted-foreground/40 text-[0.6875rem] mt-1 hidden sm:block" style={bodyFont}>
          <kbd className="px-1 py-0.5 rounded text-[0.5625rem] bg-secondary border border-border mr-0.5">Alt</kbd>+<kbd className="px-1 py-0.5 rounded text-[0.5625rem] bg-secondary border border-border mx-0.5">↑↓</kbd> reorder within column · <kbd className="px-1 py-0.5 rounded text-[0.5625rem] bg-secondary border border-border mx-0.5">Alt</kbd>+<kbd className="px-1 py-0.5 rounded text-[0.5625rem] bg-secondary border border-border mx-0.5">←→</kbd> move between columns
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex flex-wrap items-center gap-2"
      >
        <Filter className="w-3.5 h-3.5 text-muted-foreground/40" />
        {/* Priority filter */}
        {(["all", "high", "medium", "low"] as const).map((p) => {
          const isActive = filterPriority === p;
          const cfg = p !== "all" ? priorityConfig[p] : null;
          return (
            <button
              key={p}
              onClick={() => setFilterPriority(isActive ? "all" : p)}
              className={`px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors cursor-pointer ${
                isActive ? "border" : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={
                isActive && cfg
                  ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}30`, color: cfg.color, ...bodyFont }
                  : isActive
                  ? { backgroundColor: "rgba(212,168,67,0.12)", borderColor: "rgba(212,168,67,0.3)", color: "#D4A843", ...bodyFont }
                  : bodyFont
              }
            >
              {p === "all" ? "All Priority" : cfg?.label}
            </button>
          );
        })}
        <div className="w-px h-5 bg-border mx-0.5" />
        {/* Category filter */}
        {(["all", ...Object.keys(categoryColors)] as (TaskCategory | "all")[]).map((cat) => {
          const isActive = filterCategory === cat;
          const cfg = cat !== "all" ? categoryColors[cat as TaskCategory] : null;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? "all" : cat as TaskCategory)}
              className={`px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors cursor-pointer ${
                isActive ? "border" : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={
                isActive && cfg
                  ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}30`, color: cfg.color, ...bodyFont }
                  : isActive
                  ? { backgroundColor: "rgba(212,168,67,0.12)", borderColor: "rgba(212,168,67,0.3)", color: "#D4A843", ...bodyFont }
                  : bodyFont
              }
            >
              {cat === "all" ? "All" : cat}
            </button>
          );
        })}
      </motion.div>

      {/* ─── View Toggle + Notion Sync Bar ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07, duration: 0.4 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        {/* View toggle */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          {([
            { key: "kanban" as ViewMode, label: "Board", icon: LayoutGrid },
            { key: "calendar" as ViewMode, label: "Calendar", icon: Calendar },
          ]).map(({ key, label, icon: Icon }) => {
            const isActive = viewMode === key;
            return (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-[0.75rem] cursor-pointer"
                style={{
                  backgroundColor: isActive ? "rgba(212,168,67,0.1)" : "rgba(0,0,0,0)",
                  color: isActive ? "#D4A843" : "var(--muted-foreground)",
                  fontWeight: isActive ? 600 : 400,
                  ...bodyFont,
                }}
                aria-label={`Switch to ${label} view`}
                aria-pressed={isActive}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Notion Sync Controls */}
        <div className="flex items-center gap-2">
          {/* Sync status indicator */}
          {lastSyncTime && (
            <span className="text-[0.625rem] text-muted-foreground/50 hidden sm:flex items-center gap-1" style={bodyFont}>
              <Cloud className="w-3 h-3" />
              Last sync: {new Date(lastSyncTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          {notionConfigured ? (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={syncToNotion}
                disabled={notionSyncing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(139,150,196,0.08)",
                  color: "#8B96C4",
                  border: "1px solid rgba(139,150,196,0.2)",
                  ...bodyFont,
                }}
                aria-label="Sync tasks to Notion"
              >
                <RefreshCw className={`w-3 h-3 ${notionSyncing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Push to Notion</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={pullFromNotion}
                disabled={notionSyncing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: "rgba(139,150,196,0.08)",
                  color: "#8B96C4",
                  border: "1px solid rgba(139,150,196,0.2)",
                  ...bodyFont,
                }}
                aria-label="Pull tasks from Notion"
              >
                <ArrowUpDown className={`w-3 h-3 ${notionSyncing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Pull from Notion</span>
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowNotionConfig(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(139,150,196,0.06)",
                color: "#8B96C4",
                border: "1px dashed rgba(139,150,196,0.3)",
                ...bodyFont,
              }}
              aria-label="Connect Notion database"
            >
              <Settings2 className="w-3 h-3" />
              <span className="hidden sm:inline">Connect Notion</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ─── View Content (Kanban or Calendar) ────────────────────── */}
      {viewMode === "calendar" ? (
        <TaskCalendarView tasks={filteredTasks} />
      ) : (
        <>
          {/* Mobile column tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="flex md:hidden rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {columns.map((colStatus) => {
              const col = columnConfig[colStatus];
              const ColIcon = col.icon;
              const colCount = filteredTasks.filter((t) => t.status === colStatus).length;
              const isActive = mobileActiveCol === colStatus;
              return (
                <button
                  key={colStatus}
                  onClick={() => setMobileActiveCol(colStatus)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[0.75rem] transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isActive ? col.headerBg : "transparent",
                    color: isActive ? col.color : "var(--muted-foreground)",
                    fontWeight: isActive ? 600 : 400,
                    ...bodyFont,
                  }}
                >
                  <ColIcon
                    className={`w-3.5 h-3.5 ${colStatus === "in-progress" && isActive ? "animate-spin" : ""}`}
                    style={{ animationDuration: "3s" }}
                  />
                  {col.label}
                  <span
                    className="text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: isActive ? `${col.color}15` : "var(--secondary)", color: isActive ? col.color : "var(--muted-foreground)" }}
                  >
                    {colCount}
                  </span>
                </button>
              );
            })}
          </motion.div>

          {/* Kanban Columns */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {columns.map((colStatus) => {
              const col = columnConfig[colStatus];
              const ColIcon = col.icon;
              const colTasks = filteredTasks.filter((t) => t.status === colStatus);
              const isDragTarget = dragOverCol === colStatus;
              // On mobile, only show the active column
              const isMobileHidden = colStatus !== mobileActiveCol;

              return (
                <div
                  key={colStatus}
                  className={`rounded-xl overflow-hidden transition-all duration-200 ${isMobileHidden ? "hidden md:block" : ""}`}
                  style={{
                    backgroundColor: isDragTarget ? `${col.color}08` : col.bg,
                    border: isDragTarget
                      ? `2px dashed ${col.color}40`
                      : "1px solid var(--border)",
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDragOverCol(colStatus);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragTask) {
                      const task = tasks.find((t) => t.id === dragTask);
                      if (task) {
                        const fromLabel = columnConfig[task.status].label;
                        const toLabel = columnConfig[colStatus].label;
                        if (task.status !== colStatus) {
                          announce(`Task "${task.title}" moved from ${fromLabel} to ${toLabel}`);
                          toast.success(`"${task.title}" moved to ${toLabel}`);
                        }
                      }
                      moveTask(dragTask, colStatus);
                    }
                    setDragTask(null);
                    setDragOverCol(null);
                  }}
                >
                  {/* Column header */}
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: col.headerBg }}>
                    <div className="flex items-center gap-2">
                      <ColIcon
                        className={`w-4 h-4 ${colStatus === "in-progress" ? "animate-spin" : ""}`}
                        style={{ color: col.color, animationDuration: colStatus === "in-progress" ? "3s" : undefined }}
                      />
                      <span className="text-[0.8125rem] text-foreground" style={{ ...bodyFont, fontWeight: 600 }}>
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="text-[0.625rem] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${col.color}15`, color: col.color, ...bodyFont }}
                    >
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="p-2.5 space-y-2.5 min-h-[120px]">
                    <AnimatePresence mode="popLayout">
                      {colTasks.map((task, idx) => {
                        const pCfg = priorityConfig[task.priority];
                        const cCfg = categoryColors[task.category];
                        const isDropTarget = dragOverTaskId === task.id;

                        return (
                          <motion.div
                            key={task.id}
                            layout="position"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.02, duration: 0.25 }}
                            whileHover={{
                              y: -2,
                              boxShadow: "0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(196,147,112,0.1)",
                              transition: { duration: 0.2 },
                            }}
                            draggable
                            onDragStart={(e) => {
                              setDragTask(task.id);
                            }}
                            onDragEnd={() => {
                              setDragTask(null);
                              setDragOverCol(null);
                              setDragOverTaskId(null);
                              setDragOverPosition(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const el = e.currentTarget as HTMLElement;
                              const rect = el.getBoundingClientRect();
                              const midY = rect.top + rect.height / 2;
                              const clientY = (e as any).clientY ?? 0;
                              const pos = clientY < midY ? "above" : "below";
                              setDragOverTaskId(task.id);
                              setDragOverPosition(pos);
                              setDragOverCol(colStatus);
                            }}
                            onDragLeave={() => {
                              if (dragOverTaskId === task.id) {
                                setDragOverTaskId(null);
                                setDragOverPosition(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (dragTask && dragTask !== task.id) {
                                const draggedTask = tasks.find((t) => t.id === dragTask);
                                if (draggedTask && draggedTask.status !== colStatus) {
                                  toast.success(`"${draggedTask.title}" moved to ${columnConfig[colStatus].label}`);
                                }
                                moveTask(dragTask, colStatus, task.id, dragOverPosition);
                              }
                              setDragTask(null);
                              setDragOverCol(null);
                              setDragOverTaskId(null);
                              setDragOverPosition(null);
                            }}
                            className={`bg-card rounded-lg cursor-grab active:cursor-grabbing relative ${
                              dragTask === task.id ? "opacity-40" : ""
                            }`}
                            style={{ border: "1px solid var(--border)" }}
                            onKeyDown={(e) => handleTaskKeyDown(e, task)}
                            tabIndex={0}
                            role="listitem"
                            aria-label={`Task: ${task.title}. Priority: ${task.priority}. Assignee: ${task.assignee}. Press Alt+Arrow keys to reorder.`}
                          >
                            {/* Drop indicator line */}
                            {isDropTarget && dragOverPosition === "above" && dragTask !== task.id && (
                              <div className="absolute -top-1.5 left-2 right-2 h-0.5 rounded-full z-10" style={{ backgroundColor: "#D4A843" }}>
                                <div className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full" style={{ backgroundColor: "#D4A843" }} />
                              </div>
                            )}

                            <div className="flex">
                              {/* Grip handle */}
                              <div className="flex items-center justify-center w-7 shrink-0 rounded-l-lg opacity-30 hover:opacity-70 transition-opacity"
                                style={{ backgroundColor: "rgba(196,147,112,0.04)" }}
                              >
                                <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                              </div>

                              <div className="flex-1 p-3.5 min-w-0">
                                {/* Priority + Category row */}
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="inline-flex items-center gap-1 text-[0.5625rem] px-2 py-0.5 rounded-full uppercase tracking-wider"
                                    style={{ backgroundColor: pCfg.bg, color: pCfg.color, ...bodyFont }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pCfg.dot }} />
                                    {pCfg.label}
                                  </span>
                                  <span
                                    className="text-[0.5625rem] px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: cCfg.bg, color: cCfg.color, ...bodyFont }}
                                  >
                                    {task.category}
                                  </span>
                                </div>

                                {/* Title */}
                                <h4
                                  className={`text-[0.8125rem] leading-snug mb-2.5 ${
                                    colStatus === "done" ? "line-through text-muted-foreground/60" : "text-foreground"
                                  }`}
                                  style={bodyFont}
                                >
                                  {task.title}
                                </h4>

                                {/* Assignee + Due date */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-6 h-6 rounded-md flex items-center justify-center text-[0.6875rem]"
                                      style={{ backgroundColor: "rgba(196,147,112,0.08)", border: "1px solid rgba(196,147,112,0.12)" }}
                                    >
                                      {task.assigneeEmoji}
                                    </div>
                                    <span className="text-[0.6875rem] text-muted-foreground truncate max-w-[100px]" style={bodyFont}>
                                      {task.assignee.split(" ")[0]}
                                    </span>
                                  </div>
                                  <span
                                    className="flex items-center gap-1 text-[0.625rem] text-muted-foreground/60"
                                    style={bodyFont}
                                  >
                                    <Clock className="w-2.5 h-2.5" />
                                    {task.dueDate}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Drop indicator line (below) */}
                            {isDropTarget && dragOverPosition === "below" && dragTask !== task.id && (
                              <div className="absolute -bottom-1.5 left-2 right-2 h-0.5 rounded-full z-10" style={{ backgroundColor: "#D4A843" }}>
                                <div className="absolute -right-1 -top-[3px] w-2 h-2 rounded-full" style={{ backgroundColor: "#D4A843" }} />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {colTasks.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="flex flex-col items-center justify-center py-10 text-center px-4"
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${col.color}08`, border: `1px dashed ${col.color}25` }}
                        >
                          <ColIcon className="w-5 h-5" style={{ color: col.color, opacity: 0.4 }} />
                        </div>
                        <p className="text-foreground/60 text-[0.8125rem] mb-1" style={{ ...bodyFont, fontWeight: 500 }}>
                          {colStatus === "todo" ? "No tasks yet" : colStatus === "in-progress" ? "Nothing in progress" : "Nothing completed"}
                        </p>
                        <p className="text-muted-foreground/40 text-[0.6875rem] leading-relaxed max-w-[180px]" style={bodyFont}>
                          {colStatus === "todo"
                            ? "Add a task or drag one here to get started."
                            : colStatus === "in-progress"
                              ? "Drag a task here when you start working on it."
                              : "Completed tasks will appear here."}
                        </p>
                        {colStatus === "todo" && (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowAddModal(true)}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer"
                            style={{
                              backgroundColor: "rgba(212,168,67,0.08)",
                              color: "#D4A843",
                              border: "1px solid rgba(212,168,67,0.2)",
                              ...bodyFont,
                            }}
                            aria-label="Add a new task"
                          >
                            <Plus className="w-3 h-3" />
                            Add task
                          </motion.button>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </>
      )}

      {/* Floating add button (mobile) */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-5 lg:hidden w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer z-30"
        style={{
          background: "linear-gradient(135deg, #D4A843, #C49370)",
          boxShadow: "0 4px 16px rgba(212,168,67,0.3)",
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Add new task"
            ref={addModalTrapRef}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-gold" />
                  <h3 className="text-foreground" style={headingFont}>New Task</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[0.75rem] text-muted-foreground block mb-1.5" style={bodyFont}>Task Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => { setNewTitle(e.target.value); if (titleError) setTitleError(""); }}
                    placeholder="e.g. Confirm table linens"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 text-foreground text-[0.8125rem] outline-none transition-colors placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-gold/30"
                    style={{ border: titleError ? "1px solid #C75B3F" : "1px solid var(--border)", ...bodyFont }}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                  />
                  {titleError && <p className="text-[0.6875rem] mt-1" style={{ color: "#C75B3F", ...bodyFont }}>{titleError}</p>}
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-[0.75rem] text-muted-foreground block mb-1.5" style={bodyFont}>Assignee</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 text-foreground text-[0.8125rem] outline-none cursor-pointer"
                    style={{ border: "1px solid var(--border)", ...bodyFont }}
                  >
                    {teamMembers.map((m) => (
                      <option key={m.name} value={m.name}>{m.emoji} {m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due date + Priority row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.75rem] text-muted-foreground block mb-1.5" style={bodyFont}>Due Date</label>
                    <input
                      type="text"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      placeholder="e.g. Jun 10"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 text-foreground text-[0.8125rem] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-gold/30"
                      style={{ border: "1px solid var(--border)", ...bodyFont }}
                    />
                  </div>
                  <div>
                    <label className="text-[0.75rem] text-muted-foreground block mb-1.5" style={bodyFont}>Priority</label>
                    <div className="flex gap-1.5">
                      {(["high", "medium", "low"] as Priority[]).map((p) => {
                        const cfg = priorityConfig[p];
                        const isActive = newPriority === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setNewPriority(p)}
                            className={`flex-1 py-2 rounded-lg text-[0.6875rem] transition-colors cursor-pointer border ${
                              isActive ? "" : "bg-secondary/40 text-muted-foreground border-transparent hover:border-border"
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
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[0.75rem] text-muted-foreground block mb-1.5" style={bodyFont}>Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(categoryColors) as TaskCategory[]).map((cat) => {
                      const cfg = categoryColors[cat];
                      const isActive = newCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setNewCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-[0.6875rem] transition-colors cursor-pointer border ${
                            isActive ? "" : "bg-secondary/40 text-muted-foreground border-transparent hover:border-border"
                          }`}
                          style={
                            isActive
                              ? { backgroundColor: cfg.bg, borderColor: `${cfg.color}30`, color: cfg.color, ...bodyFont }
                              : bodyFont
                          }
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-secondary/20">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-[0.8125rem] text-muted-foreground cursor-pointer transition-colors hover:bg-secondary/60"
                  style={{ border: "1px solid var(--border)", ...bodyFont }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addTask}
                  disabled={!newTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: newTitle.trim() ? "linear-gradient(135deg, #D4A843, #C49370)" : "rgba(196,147,112,0.2)",
                    color: "#FFFDF5",
                    boxShadow: newTitle.trim() ? "0 2px 8px rgba(212,168,67,0.2)" : "none",
                    ...bodyFont,
                  }}
                >
                  Add Task
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notion Configuration Modal */}
      <AnimatePresence>
        {showNotionConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowNotionConfig(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Configure Notion integration"
            ref={notionConfigRef}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)", maxHeight: "90vh" }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" style={{ color: "#8B96C4" }} />
                  <h3 className="text-foreground" style={headingFont}>Connect Notion</h3>
                </div>
                <button
                  onClick={() => setShowNotionConfig(false)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                <p className="text-[0.8125rem] text-muted-foreground leading-relaxed" style={bodyFont}>
                  Connect a Notion database to sync your tasks for accurate reporting. The database should have these properties: <strong>Task</strong> (title), <strong>Status</strong> (select), <strong>Priority</strong> (select), <strong>Category</strong> (select), <strong>Assignee</strong> (rich text), <strong>Due Date</strong> (rich text).
                </p>

                <div>
                  <label className="text-[0.75rem] text-muted-foreground block mb-1.5" style={bodyFont}>
                    Notion Database ID
                  </label>
                  <input
                    type="text"
                    value={notionDbId}
                    onChange={(e) => setNotionDbId(e.target.value)}
                    placeholder="e.g. 8c2ba05f42f24bd0a10859e44f212e5c"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-secondary/50 text-foreground text-[0.8125rem] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-gold/30"
                    style={{ border: "1px solid var(--border)", ...bodyFont }}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && configureNotionDb()}
                  />
                  <p className="text-[0.625rem] text-muted-foreground/40 mt-1.5" style={bodyFont}>
                    Find this in the URL when you open your Notion database: notion.so/[database-id]?v=...
                  </p>
                </div>

                <div
                  className="rounded-lg p-3 text-[0.75rem] text-muted-foreground/60 leading-relaxed"
                  style={{ backgroundColor: "rgba(139,150,196,0.05)", border: "1px solid rgba(139,150,196,0.1)", ...bodyFont }}
                >
                  <strong style={{ color: "#8B96C4" }}>Tip:</strong> Make sure your Notion integration has access to the database. Share the database with the integration in Notion settings.
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-border bg-secondary/20">
                <button
                  onClick={() => setShowNotionConfig(false)}
                  className="flex-1 py-2.5 rounded-xl text-[0.8125rem] text-muted-foreground cursor-pointer transition-colors hover:bg-secondary/60"
                  style={{ border: "1px solid var(--border)", ...bodyFont }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={configureNotionDb}
                  disabled={!notionDbId.trim()}
                  className="flex-1 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: notionDbId.trim() ? "linear-gradient(135deg, #8B96C4, #6B7FB5)" : "rgba(139,150,196,0.2)",
                    color: "#FFFDF5",
                    boxShadow: notionDbId.trim() ? "0 2px 8px rgba(139,150,196,0.25)" : "none",
                    ...bodyFont,
                  }}
                >
                  Connect Database
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Open Milestones by Owner ──────────────────────────────── */}
      {milestoneOwners.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-[18px] h-[18px]" style={{ color: "#C9A96E" }} />
              <h3 className="text-foreground text-[1rem] font-medium" style={headingFont}>
                Open Milestones by Owner
              </h3>
              <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", ...bodyFont }}>
                {openMilestones.length}
              </span>
            </div>
            <NotionSyncBadge isLive={notionMilestoneItems.length > 0} itemCount={openMilestones.length} />
          </div>

          <div className="space-y-2">
            {milestoneOwners.map(([owner, milestones]) => (
              <div
                key={owner}
                className="bg-card rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(201,169,110,0.12)" }}
              >
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: "rgba(201,169,110,0.04)" }}>
                  <User className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-foreground text-[0.8125rem] font-medium flex-1" style={bodyFont}>{owner}</span>
                  <span className="text-[0.625rem] text-muted-foreground/60" style={bodyFont}>{milestones.length} open</span>
                </div>
                <div className="divide-y divide-border/20">
                  {milestones.map((m) => {
                    const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
                      "in-progress": { color: "#D4A843", bg: "rgba(212,168,67,0.1)", label: "In Progress" },
                      upcoming: { color: "#6B7F8E", bg: "rgba(107,127,142,0.1)", label: "Upcoming" },
                      critical: { color: "#C75B3F", bg: "rgba(199,91,63,0.1)", label: "Critical" },
                    };
                    const st = statusStyles[m.status] || statusStyles.upcoming;
                    return (
                      <div key={m.id} className="px-4 py-2 flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-foreground text-[0.8125rem] truncate block" style={bodyFont}>{m.title}</span>
                          {m.date && (
                            <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
                              Due: {m.date}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: st.bg, color: st.color, ...bodyFont }}
                        >
                          {st.label}
                        </span>
                        {m.notionUrl && (
                          <a href={m.notionUrl} target="_blank" rel="noopener noreferrer" className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/5 transition-colors shrink-0" title="Open in Notion">
                            <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer nav */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Pre-Event Checklist")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)", ...bodyFont }}
          >
            <CheckCircle2 className="w-4 h-4" style={{ color: "#D4A843" }} />
            <span className="text-[0.8125rem]" style={{ color: "#D4A843" }}>Pre-Event Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#D4A843", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Event Schedule")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(107,127,142,0.06)", border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
          >
            <CalendarDays className="w-4 h-4" style={{ color: "#6B7F8E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#6B7F8E" }}>Event Day Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#6B7F8E", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}