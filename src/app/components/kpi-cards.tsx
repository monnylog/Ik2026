import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, UserCheck, AlertTriangle, Calendar, UtensilsCrossed, Plane, CheckCircle2, Clock, ClipboardCheck } from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { apiFetch } from "../lib/supabase";
import { useNotion } from "../lib/notion-context";
import { KpiCardsSkeleton } from "./ui/skeleton-loaders";
import { useNotionDatabase } from "../lib/notion-sync";
import { transformWarRoomItem } from "../lib/notion-transforms";
import { bodyFont, headingFont } from "../lib/fonts";

const eventDate = new Date("2026-05-22");

function getLiveDaysUntil() {
  return Math.max(0, Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
}

const leadershipStats = [
  {
    value: "7",
    label: "Confirmed Chefs",
    icon: UserCheck,
    indicator: "green" as const,
    indicatorLabel: "Confirmed",
    iconColor: "text-success",
    iconBg: { backgroundColor: "rgba(138,173,132,0.08)" },
    borderStyle: { border: "1px solid rgba(138,173,132,0.12)" },
  },
  {
    value: "200+",
    label: "Expected Guests",
    icon: Users,
    indicator: "gold" as const,
    indicatorLabel: "Target",
    iconColor: "text-gold",
    iconBg: { backgroundColor: "rgba(212,184,150,0.08)" },
    borderStyle: { border: "1px solid rgba(212,184,150,0.12)" },
  },
  {
    value: "0/5",
    label: "Travel Booked",
    icon: Plane,
    indicator: "red" as const,
    indicatorLabel: "Not Started",
    iconColor: "text-destructive",
    iconBg: { backgroundColor: "rgba(208,137,122,0.06)" },
    borderStyle: { border: "1px solid rgba(208,137,122,0.12)" },
  },
  {
    value: "4",
    label: "Critical Gaps",
    icon: AlertTriangle,
    indicator: "red" as const,
    indicatorLabel: "Needs Attention",
    iconColor: "text-destructive",
    iconBg: { backgroundColor: "rgba(208,137,122,0.06)" },
    borderStyle: { border: "1px solid rgba(208,137,122,0.12)" },
  },
];

const chefStats = [
  {
    value: `${getLiveDaysUntil()}`,
    label: "Days Until Event",
    icon: Calendar,
    indicator: "gold" as const,
    indicatorLabel: "Countdown",
    iconColor: "text-gold",
    iconBg: { backgroundColor: "rgba(212,184,150,0.08)" },
    borderStyle: { border: "1px solid rgba(212,184,150,0.12)" },
  },
  {
    value: "7",
    label: "Courses to Create",
    icon: UtensilsCrossed,
    indicator: "green" as const,
    indicatorLabel: "Menu Dev",
    iconColor: "text-success",
    iconBg: { backgroundColor: "rgba(138,173,132,0.08)" },
    borderStyle: { border: "1px solid rgba(138,173,132,0.12)" },
  },
  {
    value: "7",
    label: "Fellow Chefs",
    icon: UserCheck,
    indicator: "green" as const,
    indicatorLabel: "Confirmed",
    iconColor: "text-success",
    iconBg: { backgroundColor: "rgba(138,173,132,0.08)" },
    borderStyle: { border: "1px solid rgba(138,173,132,0.12)" },
  },
  {
    value: "2",
    label: "Items Due",
    icon: Clock,
    indicator: "gold" as const,
    indicatorLabel: "Action Needed",
    iconColor: "text-gold",
    iconBg: { backgroundColor: "rgba(212,184,150,0.08)" },
    borderStyle: { border: "1px solid rgba(212,184,150,0.12)" },
  },
];

interface KpiCardsProps {
  role: UserRole;
}

export function KpiCards({ role }: KpiCardsProps) {
  const { stats: notionStats, isLive: notionLive } = useNotion();
  const { items: warRoomItems } = useNotionDatabase("warroom");
  const [submissionStats, setSubmissionStats] = useState<{
    totalChefs: number;
    completionRate: number;
    conceptCount: number;
    ingredientCount: number;
    kitchenCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(role === "leadership" || role === "team");

  useEffect(() => {
    if (role !== "leadership" && role !== "team") return;
    setIsLoading(true);
    apiFetch("/submission-stats")
      .then((res) => setSubmissionStats(res))
      .catch((e) => console.error("Failed to load submission stats:", e))
      .finally(() => setIsLoading(false));
  }, [role]);

  const baseStats = role === "leadership" || role === "team" ? leadershipStats : chefStats;

  // For leadership/team, dynamically replace cards with live data
  const stats = (role === "leadership" || role === "team")
    ? (() => {
        let result = [...baseStats];

        // Replace submission card if data is available
        if (submissionStats) {
          result[0] = {
            value: `${submissionStats.completionRate}%`,
            label: "Submissions Done",
            icon: ClipboardCheck,
            indicator: submissionStats.completionRate >= 75 ? "green" as const : submissionStats.completionRate > 0 ? "gold" as const : "red" as const,
            indicatorLabel: submissionStats.completionRate >= 75 ? "On Track" : submissionStats.completionRate > 0 ? "In Progress" : "Not Started",
            iconColor: submissionStats.completionRate >= 75 ? "text-success" : "text-gold",
            iconBg: submissionStats.completionRate >= 75 ? { backgroundColor: "rgba(126,158,120,0.1)" } : { backgroundColor: "rgba(205,168,138,0.1)" },
            borderStyle: submissionStats.completionRate >= 75 ? { border: "1px solid rgba(126,158,120,0.2)" } : { border: "1px solid rgba(205,168,138,0.2)" },
          };
        }

        // Replace Critical Gaps card with live Notion data + war room critical alerts
        {
          // Count war room critical items
          const warRoomCriticalCount = warRoomItems
            .map(item => transformWarRoomItem(item))
            .filter(w => w.severity === "critical" && !w.status?.toLowerCase().includes("resolved")).length;

          const milestoneCriticalCount = notionLive ? (notionStats.critical + notionStats.overdue) : 0;
          const criticalCount = notionLive
            ? milestoneCriticalCount + warRoomCriticalCount
            : warRoomCriticalCount > 0
              ? warRoomCriticalCount
              : 4; // fallback hardcoded value

          const critIdx = result.findIndex((s) => s.label === "Critical Gaps");
          if (critIdx !== -1 && (notionLive || warRoomCriticalCount > 0)) {
            result[critIdx] = {
              ...result[critIdx],
              value: `${criticalCount}`,
              indicator: criticalCount > 0 ? "red" as const : "green" as const,
              indicatorLabel: criticalCount > 0 ? "Needs Attention" : "All Clear",
              iconColor: criticalCount > 0 ? "text-destructive" : "text-success",
              iconBg: criticalCount > 0 ? { backgroundColor: "rgba(43,68,100,0.08)" } : { backgroundColor: "rgba(126,158,120,0.1)" },
              borderStyle: criticalCount > 0 ? { border: "1px solid rgba(43,68,100,0.2)" } : { border: "1px solid rgba(126,158,120,0.2)" },
            };
          }
        }

        return result;
      })()
    : baseStats;

  if (isLoading) return <KpiCardsSkeleton />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ 
              y: -4, 
              boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(205,168,138,0.15)",
              transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
            }}
            whileTap={{ scale: 0.98 }}
            className="bg-card rounded-xl p-3 sm:p-4 cursor-default"
            style={stat.borderStyle}
          >
            <div className="flex items-start justify-between mb-2 sm:mb-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={stat.iconBg}
              >
                <Icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
              {stat.indicator === "green" && (
                <div className="flex items-center gap-1">
                  <div className="relative">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-success animate-ping opacity-40" />
                  </div>
                  <span className="text-success text-[0.5625rem] uppercase tracking-wider hidden sm:inline">
                    {stat.indicatorLabel}
                  </span>
                </div>
              )}
              {stat.indicator === "red" && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-destructive text-[0.5625rem] uppercase tracking-wider hidden sm:inline">
                    {stat.indicatorLabel}
                  </span>
                </div>
              )}
              {stat.indicator === "gold" && (
                <span className="text-gold text-[0.5625rem] uppercase tracking-wider hidden sm:inline">
                  {stat.indicatorLabel}
                </span>
              )}
            </div>
            <div
              className="text-[1.375rem] sm:text-[1.75rem] text-foreground leading-none mb-0.5"
              style={headingFont}
            >
              {stat.value}
            </div>
            <span
              className="text-muted-foreground text-[0.75rem]"
              style={bodyFont}
            >
              {stat.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}