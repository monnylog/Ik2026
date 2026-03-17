import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  ListChecks,
  Tag,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";

import { bodyFont, headingFont } from "../../lib/fonts";

const EVENT_DATE = new Date("2026-06-14T18:00:00");

interface PlanningHubProps {
  onNavigate: (page: string) => void;
}

export function PlanningHub({ onNavigate }: PlanningHubProps) {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const calc = () => {
      const diff = EVENT_DATE.getTime() - Date.now();
      setDaysLeft(Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))));
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, []);

  // Read checklist completion from localStorage
  const getChecklistStats = useCallback(() => {
    try {
      const data = JSON.parse(localStorage.getItem("ik26-checklist-checked") || "{}");
      const total = 12;
      const done = Object.values(data).filter(Boolean).length;
      return { done, total };
    } catch {
      return { done: 0, total: 12 };
    }
  }, []);

  const checklistStats = getChecklistStats();

  const links = [
    {
      icon: ListChecks,
      label: "Pre-Event Checklist",
      page: "Pre-Event Checklist",
      color: "#C9A96E",
      bg: "rgba(201,169,110,0.06)",
      border: "rgba(201,169,110,0.15)",
      stat: `${checklistStats.done}/${checklistStats.total} done`,
      statColor: checklistStats.done === checklistStats.total ? "#7E9E78" : "#C9A96E",
    },
    {
      icon: Tag,
      label: "Task Board",
      page: "Task Board",
      color: "#4A7FB5",
      bg: "rgba(74,127,181,0.06)",
      border: "rgba(74,127,181,0.15)",
      stat: "4 in progress",
      statColor: "#4A7FB5",
    },
    {
      icon: CalendarClock,
      label: "Event Schedule",
      page: "Event Schedule",
      color: "#6B7F8E",
      bg: "rgba(107,127,142,0.06)",
      border: "rgba(107,127,142,0.15)",
      stat: `${daysLeft} days to event`,
      statColor: daysLeft <= 30 ? "#C75B3F" : "#6B7F8E",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-card rounded-xl p-4 sm:p-5"
      style={{ border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
          </div>
          <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
            Planning Hub
          </h3>
        </div>
        <span
          className="text-[0.625rem] px-2 py-0.5 rounded-full uppercase tracking-wider"
          style={{
            backgroundColor: daysLeft <= 30 ? "rgba(199,91,63,0.08)" : "rgba(201,169,110,0.08)",
            color: daysLeft <= 30 ? "#C75B3F" : "#C9A96E",
            ...bodyFont,
          }}
        >
          {daysLeft}d left
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {links.map((link, idx) => {
          const Icon = link.icon;
          return (
            <motion.button
              key={link.page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.05, duration: 0.35 }}
              whileHover={{
                y: -3,
                boxShadow: `0 6px 20px rgba(0,0,0,0.05), 0 0 0 1px ${link.border}`,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(link.page)}
              className="flex flex-col items-start gap-2.5 p-3.5 rounded-xl transition-colors cursor-pointer text-left"
              style={{
                backgroundColor: link.bg,
                border: `1px solid ${link.border}`,
              }}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${link.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: link.color }} />
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-30" style={{ color: link.color }} />
              </div>
              <div>
                <p className="text-[0.8125rem] text-foreground leading-tight" style={{ ...bodyFont, fontWeight: 500 }}>
                  {link.label}
                </p>
                <p className="text-[0.625rem] mt-0.5" style={{ color: link.statColor, ...bodyFont }}>
                  {link.stat}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}