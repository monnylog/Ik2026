import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Circle,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

type Priority = "high" | "medium" | "low";
type TaskStatus = "todo" | "in-progress" | "done";
type TaskCategory = "Logistics" | "Menu" | "Comms" | "Setup" | "Creative";

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

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Circle; color: string }> = {
  todo: { label: "To Do", icon: Circle, color: "#6B7F8E" },
  "in-progress": { label: "In Progress", icon: Loader2, color: "#D4A843" },
  done: { label: "Done", icon: CheckCircle2, color: "#7E9E78" },
};

const categoryColors: Record<TaskCategory, { color: string; bg: string }> = {
  Logistics: { color: "#4A7FB5", bg: "rgba(74,127,181,0.08)" },
  Menu: { color: "#7E9E78", bg: "rgba(126,158,120,0.08)" },
  Comms: { color: "#1A5C38", bg: "rgba(26,92,56,0.08)" },
  Setup: { color: "#C49370", bg: "rgba(196,147,112,0.08)" },
  Creative: { color: "#D4A843", bg: "rgba(212,168,67,0.08)" },
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Parse date strings like "May 30", "Jun 1", "Apr 30", "TBD" into Date objects
function parseTaskDate(dateStr: string, year = 2026): Date | null {
  if (!dateStr || dateStr === "TBD") return null;
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const monthStr = parts[0].toLowerCase().replace(/[.,]/g, "");
  const day = parseInt(parts[1], 10);
  const month = monthMap[monthStr];
  if (month === undefined || isNaN(day)) return null;
  return new Date(year, month, day);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];

  // Fill leading nulls
  for (let i = 0; i < firstDay; i++) {
    week.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Fill trailing nulls
  if (week.length > 0) {
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  return weeks;
}

interface TaskCalendarViewProps {
  tasks: TaskCard[];
  onTaskClick?: (task: TaskCard) => void;
}

export function TaskCalendarView({ tasks, onTaskClick }: TaskCalendarViewProps) {
  const today = new Date(2026, 2, 11); // March 11, 2026
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Parse all task dates
  const taskDateMap = useMemo(() => {
    const map = new Map<string, TaskCard[]>();
    for (const task of tasks) {
      const date = parseTaskDate(task.dueDate);
      if (date) {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    }
    return map;
  }, [tasks]);

  // Tasks without dates
  const undatedTasks = useMemo(() => {
    return tasks.filter((t) => !parseTaskDate(t.dueDate));
  }, [tasks]);

  const weeks = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(null);
  };

  const getTasksForDay = (date: Date): TaskCard[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return taskDateMap.get(key) || [];
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  // Event day highlight
  const eventDay = new Date(2026, 4, 22); // May 22, 2026
  const isEventDay = (d: Date) => isSameDay(d, eventDay);
  const isToday = (d: Date) => isSameDay(d, today);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <h3
            className="text-foreground text-lg"
            style={{ ...headingFont, fontWeight: 600 }}
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          {(viewYear !== today.getFullYear() || viewMonth !== today.getMonth()) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToToday}
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer"
              style={{
                backgroundColor: "rgba(212,168,67,0.08)",
                color: "#D4A843",
                border: "1px solid rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
            >
              Today
            </motion.button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "rgba(196,147,112,0.06)", border: "1px solid rgba(196,147,112,0.1)" }}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={goToNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "rgba(196,147,112,0.06)", border: "1px solid rgba(196,147,112,0.1)" }}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>
      </motion.div>

      {/* Calendar grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[0.6875rem] text-muted-foreground/60 uppercase tracking-wider"
              style={{ ...bodyFont, fontWeight: 600, backgroundColor: "rgba(196,147,112,0.04)" }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7" style={{ borderTop: "1px solid var(--border)" }}>
            {week.map((date, di) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${wi}-${di}`}
                    className="min-h-[80px] sm:min-h-[100px]"
                    style={{ backgroundColor: "rgba(0,0,0,0.01)" }}
                  />
                );
              }

              const dayTasks = getTasksForDay(date);
              const isSelected = selectedDay && isSameDay(date, selectedDay);
              const _isToday = isToday(date);
              const _isEventDay = isEventDay(date);
              const hasHighPriority = dayTasks.some((t) => t.priority === "high" && t.status !== "done");
              const allDone = dayTasks.length > 0 && dayTasks.every((t) => t.status === "done");

              return (
                <motion.div
                  key={date.toISOString()}
                  whileHover={{ backgroundColor: "rgba(196,147,112,0.04)" }}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={`min-h-[80px] sm:min-h-[100px] p-1.5 cursor-pointer relative ${
                    di < 6 ? "" : ""
                  }`}
                  style={{
                    borderLeft: di > 0 ? "1px solid var(--border)" : "none",
                    backgroundColor: isSelected
                      ? "rgba(212,168,67,0.06)"
                      : _isEventDay
                      ? "rgba(126,158,120,0.05)"
                      : "rgba(0,0,0,0)",
                  }}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[0.75rem] w-6 h-6 flex items-center justify-center rounded-full ${
                        _isToday ? "text-white" : "text-foreground/70"
                      }`}
                      style={{
                        backgroundColor: _isToday ? "#D4A843" : "rgba(0,0,0,0)",
                        fontWeight: _isToday ? 700 : 400,
                        ...bodyFont,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {_isEventDay && (
                      <span
                        className="text-[0.5rem] px-1.5 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline"
                        style={{ backgroundColor: "rgba(126,158,120,0.12)", color: "#7E9E78", ...bodyFont, fontWeight: 700 }}
                      >
                        Event
                      </span>
                    )}
                    {hasHighPriority && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C75B3F" }} />
                    )}
                    {allDone && !hasHighPriority && (
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#7E9E78" }} />
                    )}
                  </div>

                  {/* Task dots / mini cards */}
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => {
                      const pCfg = priorityConfig[task.priority];
                      const sCfg = statusConfig[task.status];
                      return (
                        <motion.div
                          key={task.id}
                          whileHover={{ scale: 1.02 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick?.(task);
                            setHoveredTask(hoveredTask === task.id ? null : task.id);
                          }}
                          className="rounded px-1 py-0.5 truncate text-[0.5625rem] leading-tight cursor-pointer"
                          style={{
                            backgroundColor: task.status === "done" ? "rgba(126,158,120,0.08)" : pCfg.bg,
                            color: task.status === "done" ? "#7E9E78" : pCfg.color,
                            borderLeft: `2px solid ${sCfg.color}`,
                            textDecoration: task.status === "done" ? "line-through" : "none",
                            ...bodyFont,
                          }}
                          title={`${task.title} — ${task.assignee}`}
                        >
                          <span className="hidden sm:inline">{task.title}</span>
                          <span className="sm:hidden">{task.assigneeEmoji}</span>
                        </motion.div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span
                        className="text-[0.5rem] text-muted-foreground/50 pl-1"
                        style={bodyFont}
                      >
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.div>

      {/* Selected day detail panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 12, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{
                backgroundColor: isEventDay(selectedDay) ? "rgba(126,158,120,0.08)" : "rgba(212,168,67,0.06)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: isEventDay(selectedDay) ? "#7E9E78" : "#D4A843" }} />
                <span className="text-[0.875rem] text-foreground" style={{ ...bodyFont, fontWeight: 600 }}>
                  {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </span>
                {isEventDay(selectedDay) && (
                  <span
                    className="text-[0.625rem] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(126,158,120,0.12)", color: "#7E9E78", ...bodyFont, fontWeight: 600 }}
                  >
                    🎉 Event Day!
                  </span>
                )}
                <span
                  className="text-[0.625rem] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(212,168,67,0.1)", color: "#D4A843", ...bodyFont }}
                >
                  {selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? "s" : ""}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDay(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            </div>

            <div className="p-3 space-y-2">
              {selectedDayTasks.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground/50 text-[0.8125rem]" style={bodyFont}>
                    No tasks due on this day.
                  </p>
                </div>
              ) : (
                selectedDayTasks.map((task) => {
                  const pCfg = priorityConfig[task.priority];
                  const sCfg = statusConfig[task.status];
                  const SIcon = sCfg.icon;
                  const cCfg = categoryColors[task.category];
                  return (
                    <motion.div
                      key={task.id}
                      layout="position"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-card"
                      style={{
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                      }}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${sCfg.color}12` }}
                      >
                        <SIcon
                          className={`w-4 h-4 ${task.status === "in-progress" ? "animate-spin" : ""}`}
                          style={{ color: sCfg.color, animationDuration: "3s" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`text-[0.8125rem] truncate ${task.status === "done" ? "line-through text-muted-foreground/60" : "text-foreground"}`}
                            style={{ ...bodyFont, fontWeight: 500 }}
                          >
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 text-[0.5625rem] px-2 py-0.5 rounded-full"
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
                          <span className="text-[0.5625rem] px-2 py-0.5 rounded-full bg-secondary/60 text-muted-foreground" style={bodyFont}>
                            {sCfg.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[0.6875rem]"
                          style={{ backgroundColor: "rgba(196,147,112,0.08)", border: "1px solid rgba(196,147,112,0.12)" }}
                        >
                          {task.assigneeEmoji}
                        </div>
                        <span className="text-[0.6875rem] text-muted-foreground hidden sm:inline" style={bodyFont}>
                          {task.assignee.split(" ")[0]}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undated tasks */}
      {undatedTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{ backgroundColor: "rgba(107,127,142,0.06)", borderBottom: "1px solid var(--border)" }}
          >
            <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="text-[0.75rem] text-muted-foreground" style={{ ...bodyFont, fontWeight: 600 }}>
              No Date Set
            </span>
            <span
              className="text-[0.625rem] px-1.5 py-0.5 rounded-full bg-secondary/60 text-muted-foreground/60"
              style={bodyFont}
            >
              {undatedTasks.length}
            </span>
          </div>
          <div className="p-2.5 flex flex-wrap gap-2">
            {undatedTasks.map((task) => {
              const pCfg = priorityConfig[task.priority];
              return (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => onTaskClick?.(task)}
                  className="px-3 py-2 rounded-lg cursor-pointer text-[0.75rem]"
                  style={{
                    backgroundColor: pCfg.bg,
                    color: pCfg.color,
                    border: `1px solid ${pCfg.color}20`,
                    ...bodyFont,
                  }}
                >
                  {task.assigneeEmoji} {task.title}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex flex-wrap items-center gap-4 text-[0.625rem] text-muted-foreground/50 px-1"
        style={bodyFont}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#D4A843" }} />
          Today
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C75B3F" }} />
          High Priority
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#D4A843" }} />
          Medium
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7E9E78" }} />
          Low / Done
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="px-1.5 py-0.5 rounded text-[0.5rem]"
            style={{ backgroundColor: "rgba(126,158,120,0.12)", color: "#7E9E78" }}
          >
            Event
          </span>
          May 22
        </div>
      </motion.div>
    </div>
  );
}
