import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { TrendingUp, CheckCircle2, Clock, Users, BarChart3 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const EVENT_DATE = new Date("2026-05-22T18:00:00");

// Mock activity data for sparkline (last 14 days)
const activityData = [
  { day: 1, count: 3 },
  { day: 2, count: 5 },
  { day: 3, count: 4 },
  { day: 4, count: 6 },
  { day: 5, count: 5 },
  { day: 6, count: 7 },
  { day: 7, count: 6 },
  { day: 8, count: 8 },
  { day: 9, count: 7 },
  { day: 10, count: 9 },
  { day: 11, count: 8 },
  { day: 12, count: 10 },
  { day: 13, count: 9 },
  { day: 14, count: 11 },
];

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1200, enabled: boolean = true) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return count;
}

// Progress ring component
function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
  color,
  bgColor,
  children,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedOffset(circumference - (percentage / 100) * circumference);
    }, 200);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

interface PerformanceWidgetProps {
  onNavigate?: (page: string) => void;
}

export function PerformanceWidget({ onNavigate }: PerformanceWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load task/checklist data from localStorage
  const getTaskStats = useCallback(() => {
    try {
      const saved = localStorage.getItem("ik26-task-board-tasks");
      if (saved) {
        const tasks = JSON.parse(saved);
        const completed = tasks.filter((t: { status: string }) => t.status === "done").length;
        return { completed, total: tasks.length };
      }
    } catch {}
    // Default fallback if no saved data
    return { completed: 4, total: 12 };
  }, []);

  const getChecklistStats = useCallback(() => {
    try {
      const saved = localStorage.getItem("ik26-checklist-checked");
      if (saved) {
        const checked = JSON.parse(saved);
        const completedCount = Object.values(checked).filter(Boolean).length;
        return { completed: completedCount, total: 12 };
      }
    } catch {}
    return { completed: 2, total: 12 };
  }, []);

  const taskStats = getTaskStats();
  const checklistStats = getChecklistStats();

  // Calculate days until event
  const now = new Date();
  const diff = EVENT_DATE.getTime() - now.getTime();
  const daysUntil = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));

  const taskPercentage = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;
  const checklistPercentage = checklistStats.total > 0 ? Math.round((checklistStats.completed / checklistStats.total) * 100) : 0;

  // Intersection observer for mount animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const animatedTaskCount = useAnimatedCounter(taskStats.completed, 1000, isVisible);
  const animatedChecklistCount = useAnimatedCounter(checklistStats.completed, 1000, isVisible);
  const animatedDays = useAnimatedCounter(daysUntil, 1400, isVisible);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, rgba(138,173,132,0.04) 0%, rgba(206,180,122,0.03) 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(138,173,132,0.06)" }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: "#8AAD84" }} />
          </div>
          <div>
            <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
              Performance Overview
            </h3>
            <p className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
              Real-time event preparation metrics
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[0.625rem]"
          style={{
            backgroundColor: "rgba(138,173,132,0.06)",
            color: "#8AAD84",
            ...bodyFont,
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#8AAD84" }} />
          Live
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Progress Ring */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-2.5 p-3 rounded-xl cursor-pointer"
          style={{ backgroundColor: "rgba(138,173,132,0.02)", border: "1px solid rgba(138,173,132,0.06)" }}
          onClick={() => onNavigate?.("Task Board")}
        >
          <ProgressRing
            percentage={taskPercentage}
            size={72}
            strokeWidth={5}
            color="#8AAD84"
            bgColor="rgba(138,173,132,0.08)"
          >
            <div className="flex flex-col items-center">
              <span className="text-foreground text-[1.125rem] font-semibold leading-none" style={bodyFont}>
                {animatedTaskCount}
              </span>
              <span className="text-muted-foreground text-[0.5rem]" style={bodyFont}>
                /{taskStats.total}
              </span>
            </div>
          </ProgressRing>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <CheckCircle2 className="w-3 h-3" style={{ color: "#8AAD84" }} />
              <span className="text-foreground text-[0.75rem] font-medium" style={bodyFont}>
                Tasks Done
              </span>
            </div>
            <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
              {taskPercentage}% complete
            </span>
          </div>
        </motion.div>

        {/* Days Until Event */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-2.5 p-3 rounded-xl cursor-pointer"
          style={{ backgroundColor: "rgba(206,180,122,0.02)", border: "1px solid rgba(206,180,122,0.06)" }}
          onClick={() => onNavigate?.("Event Timeline")}
        >
          <div className="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center"
            style={{ backgroundColor: "rgba(206,180,122,0.06)", border: "2px solid rgba(206,180,122,0.12)" }}
          >
            <span className="text-[1.5rem] font-bold leading-none" style={{ ...headingFont, color: "#CEB47A" }}>
              {animatedDays}
            </span>
            <span className="text-[0.5rem] uppercase tracking-wider" style={{ ...bodyFont, color: "#CEB47A" }}>
              days
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Clock className="w-3 h-3" style={{ color: "#CEB47A" }} />
              <span className="text-foreground text-[0.75rem] font-medium" style={bodyFont}>
                Countdown
              </span>
            </div>
            <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
              May 22, 2026
            </span>
          </div>
        </motion.div>

        {/* Team Activity Sparkline */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-2.5 p-3 rounded-xl cursor-pointer"
          style={{ backgroundColor: "rgba(107,158,194,0.02)", border: "1px solid rgba(107,158,194,0.06)" }}
          onClick={() => onNavigate?.("Activity Log")}
        >
          <div className="w-full h-[72px] flex items-end">
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={activityData}>
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6B9EC2"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Users className="w-3 h-3" style={{ color: "#6B9EC2" }} />
              <span className="text-foreground text-[0.75rem] font-medium" style={bodyFont}>
                Team Activity
              </span>
            </div>
            <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
              Last 14 days
            </span>
          </div>
        </motion.div>

        {/* Checklist Completion */}
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center gap-2.5 p-3 rounded-xl cursor-pointer"
          style={{ backgroundColor: "rgba(212,184,150,0.02)", border: "1px solid rgba(212,184,150,0.06)" }}
          onClick={() => onNavigate?.("Pre-Event Checklist")}
        >
          <ProgressRing
            percentage={checklistPercentage}
            size={72}
            strokeWidth={5}
            color="#D4B896"
            bgColor="rgba(212,184,150,0.08)"
          >
            <div className="flex flex-col items-center">
              <span className="text-foreground text-[1.125rem] font-semibold leading-none" style={bodyFont}>
                {animatedChecklistCount}
              </span>
              <span className="text-muted-foreground text-[0.5rem]" style={bodyFont}>
                /{checklistStats.total}
              </span>
            </div>
          </ProgressRing>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <BarChart3 className="w-3 h-3" style={{ color: "#D4B896" }} />
              <span className="text-foreground text-[0.75rem] font-medium" style={bodyFont}>
                Checklist
              </span>
            </div>
            <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
              {checklistPercentage}% complete
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}