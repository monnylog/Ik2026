import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ListChecks,
  CalendarDays,
  Target,
  MapPin,
  UtensilsCrossed,
  Truck,
  Megaphone,
} from "lucide-react";
import { useUserData } from "../../lib/use-user-data";
import { EmptyState } from "../ui/empty-state";

import { bodyFont, headingFont } from "../../lib/fonts";

interface Task {
  id: string;
  title: string;
  category: string;
  deadline: string;
  priority: "critical" | "high" | "medium" | "low";
  completed: boolean;
}

const sampleTasks: Task[] = [];

const priorityConfig = {
  critical: { color: "#D0897A", bg: "rgba(208,137,122,0.06)", label: "Critical" },
  high: { color: "#D4B896", bg: "rgba(212,184,150,0.06)", label: "High" },
  medium: { color: "#8AAD84", bg: "rgba(138,173,132,0.06)", label: "Medium" },
  low: { color: "#8899A6", bg: "rgba(136,153,166,0.06)", label: "Low" },
};

const categoryConfig: Record<string, { color: string; bg: string; icon: typeof MapPin }> = {
  Venue: { color: "#6B9EC2", bg: "rgba(107,158,194,0.06)", icon: MapPin },
  Menu: { color: "#8AAD84", bg: "rgba(138,173,132,0.06)", icon: UtensilsCrossed },
  Logistics: { color: "#D4B896", bg: "rgba(212,184,150,0.06)", icon: Truck },
  Marketing: { color: "#CEB47A", bg: "rgba(206,180,122,0.06)", icon: Megaphone },
};

const allCategories = ["All", "Venue", "Menu", "Logistics", "Marketing"];

interface MyTasksProps {
  onNavigate: (page: string) => void;
}

export function MyTasks({ onNavigate }: MyTasksProps) {
  const [completedIds, setCompletedIds] = useUserData<string[]>("team-task-completed", []);
  const [showCompleted, setShowCompleted] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const tasks = sampleTasks.map((t) => ({
    ...t,
    completed: completedIds.includes(t.id),
  }));

  const toggleTask = (id: string) => {
    setCompletedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const filtered = tasks.filter((t) => {
    if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
    if (!showCompleted && t.completed) return false;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="bg-card rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#6B9EC2" }} />
            <ListChecks className="w-4 h-4" style={{ color: "#6B9EC2" }} />
            <h3 className="text-foreground" style={headingFont}>
              My Tasks
            </h3>
          </div>
          <p className="text-muted-foreground text-[0.75rem] pl-7" style={bodyFont}>
            Your assigned tasks and deadlines.
          </p>
        </div>
        <div className="p-5">
          <EmptyState
            icon={ListChecks}
            title="No tasks assigned yet"
            description="Tasks will appear here once they're assigned by leadership. Check back soon or visit the Task Board for team-wide items."
          />
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => onNavigate("Task Board")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[0.8125rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(107,158,194,0.06)",
                border: "1px solid rgba(107,158,194,0.12)",
                color: "#6B9EC2",
                ...bodyFont,
              }}
            >
              <Target className="w-3.5 h-3.5" />
              View Task Board
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#6B9EC2" }} />
          <ListChecks className="w-4 h-4" style={{ color: "#6B9EC2" }} />
          <h3 className="text-foreground" style={headingFont}>
            My Tasks
          </h3>
          <span
            className="text-[0.625rem] px-2 py-0.5 rounded-full ml-auto"
            style={{
              backgroundColor: pendingCount > 0 ? "rgba(208,137,122,0.08)" : "rgba(138,173,132,0.08)",
              color: pendingCount > 0 ? "#D0897A" : "#8AAD84",
              ...bodyFont,
            }}
          >
            {pendingCount} pending
          </span>
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="text-[0.6875rem] px-2.5 py-1 rounded-full cursor-pointer transition-colors"
              style={{
                backgroundColor: categoryFilter === cat ? "rgba(107,158,194,0.10)" : "rgba(0,0,0,0.02)",
                color: categoryFilter === cat ? "#6B9EC2" : "var(--muted-foreground)",
                border: `1px solid ${categoryFilter === cat ? "rgba(107,158,194,0.15)" : "rgba(0,0,0,0.04)"}`,
                ...bodyFont,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="p-3 space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((task) => {
            const pConf = priorityConfig[task.priority];
            const cConf = categoryConfig[task.category];
            const CatIcon = cConf?.icon || CalendarDays;

            return (
              <motion.div
                key={task.id}
                layout="position"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl group"
                style={{
                  backgroundColor: task.completed ? "rgba(0,0,0,0.01)" : "rgba(0,0,0,0)",
                }}
                onMouseEnter={(e) => {
                  if (!task.completed) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = task.completed ? "rgba(0,0,0,0.01)" : "rgba(0,0,0,0)";
                }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 cursor-pointer shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#8AAD84" }} />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[0.8125rem] block ${task.completed ? "line-through text-muted-foreground/50" : "text-foreground"}`}
                    style={bodyFont}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.625rem] flex items-center gap-1" style={{ color: cConf?.color || "#8899A6", ...bodyFont }}>
                      <CatIcon className="w-2.5 h-2.5" />
                      {task.category}
                    </span>
                    <span className="text-muted-foreground/30 text-[0.5rem]">·</span>
                    <span className="text-muted-foreground/50 text-[0.625rem]" style={bodyFont}>
                      <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                      {task.deadline}
                    </span>
                  </div>
                </div>
                <span
                  className="text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: pConf.bg, color: pConf.color, ...bodyFont }}
                >
                  {pConf.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        {completedCount > 0 && (
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors"
            style={bodyFont}
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showCompleted ? "rotate-180" : ""}`} />
            {showCompleted ? "Hide" : "Show"} {completedCount} completed
          </button>
        )}
        <button
          onClick={() => onNavigate("Task Board")}
          className="text-[0.6875rem] hover:underline cursor-pointer ml-auto"
          style={{ color: "#6B9EC2", ...bodyFont }}
        >
          Task Board →
        </button>
      </div>
    </motion.div>
  );
}