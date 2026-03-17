import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  Users,
  ChefHat,
  MessageCircle,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Heart,
  Sparkles,
  Shuffle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Printer,
  Mail,
} from "lucide-react";
import { apiFetch } from "../../lib/supabase";
import { useNotion } from "../../lib/notion-context";
import { ExportSummary } from "./export-summary";
import { WeeklyDigest } from "./weekly-digest";

import { bodyFont, headingFont } from "../../lib/fonts";

interface ManagerAnalyticsProps {
  onNavigate: (page: string) => void;
}

// SVG progress ring component
function ProgressRing({
  value,
  max,
  size = 56,
  strokeWidth = 5,
  color,
  bgColor,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  bgColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? value / max : 0;
  const offset = circumference * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bgColor}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

export function ManagerAnalytics({ onNavigate }: ManagerAnalyticsProps) {
  const { stats: notionStats, isLive: notionLive } = useNotion();
  const [profileCount, setProfileCount] = useState(0);
  const [chefProfileCount, setChefProfileCount] = useState(0);
  const [submissionRate, setSubmissionRate] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [engagementData, setEngagementData] = useState<{
    promptResponses: number;
    chatMessages: number;
    memoryWallPosts: number;
    flavorFusionIdeas: number;
    recipeRouletteSpins: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, submissionRes, engagementRes] = await Promise.allSettled([
        apiFetch("/admin/profiles"),
        apiFetch("/submission-stats"),
        apiFetch("/engagement-stats"),
      ]);

      if (profileRes.status === "fulfilled") {
        const profiles = profileRes.value?.profiles || [];
        setProfileCount(profiles.length);
        setChefProfileCount(profiles.filter((p: any) => p.chefDirectoryId).length);
      }

      if (submissionRes.status === "fulfilled") {
        setSubmissionRate(submissionRes.value?.completionRate ?? 0);
        const conceptCount = submissionRes.value?.conceptCount ?? 0;
        const ingredientCount = submissionRes.value?.ingredientCount ?? 0;
        const kitchenCount = submissionRes.value?.kitchenCount ?? 0;
        setSubmissionCount(conceptCount + ingredientCount + kitchenCount);
      }

      if (engagementRes.status === "fulfilled" && !engagementRes.value?.error) {
        setEngagementData(engagementRes.value);
      }
    } catch (e) {
      console.error("Manager analytics fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = [
    {
      label: "Chef Submissions",
      value: submissionRate,
      max: 100,
      display: `${submissionRate}%`,
      subtitle: `${chefProfileCount}/7 chefs onboarded`,
      color: "#7E9E78",
      bgColor: "rgba(126,158,120,0.12)",
      icon: ChefHat,
      onClick: () => onNavigate("Menu & Courses"),
    },
    {
      label: "Team Onboarding",
      value: profileCount,
      max: 12,
      display: `${profileCount}`,
      subtitle: `${profileCount} profiles created`,
      color: "#4A7FB5",
      bgColor: "rgba(74,127,181,0.12)",
      icon: Users,
      onClick: () => onNavigate("Members"),
    },
    {
      label: "Milestones",
      value: notionLive ? notionStats.done : 0,
      max: notionLive ? notionStats.total : 1,
      display: notionLive ? `${notionStats.completionPct}%` : "--",
      subtitle: notionLive
        ? `${notionStats.done}/${notionStats.total} completed`
        : "Notion not connected",
      color: "#5DA06B",
      bgColor: "rgba(93,160,107,0.12)",
      icon: ClipboardCheck,
      onClick: () => {},
    },
    {
      label: "Critical Items",
      value: notionLive ? notionStats.critical + notionStats.overdue : 0,
      max: notionLive ? notionStats.total : 1,
      display: notionLive ? `${notionStats.critical + notionStats.overdue}` : "--",
      subtitle: notionLive
        ? notionStats.critical + notionStats.overdue > 0
          ? "Needs attention"
          : "All clear"
        : "Awaiting sync",
      color:
        notionLive && notionStats.critical + notionStats.overdue > 0
          ? "#CDA88A"
          : "#7E9E78",
      bgColor:
        notionLive && notionStats.critical + notionStats.overdue > 0
          ? "rgba(205,168,138,0.12)"
          : "rgba(126,158,120,0.12)",
      icon: TrendingUp,
      onClick: () => {},
    },
  ];

  const engagementMetrics = [
    {
      label: "Daily Prompts",
      value: engagementData ? `${engagementData.promptResponses}` : "—",
      trend: (engagementData?.promptResponses || 0) > 3 ? "up" as const : "flat" as const,
      color: "#C9A96E",
      bg: "rgba(201,169,110,0.06)",
      borderColor: "rgba(201,169,110,0.15)",
      icon: Flame,
    },
    {
      label: "Chat Messages",
      value: engagementData ? `${engagementData.chatMessages}` : "—",
      trend: (engagementData?.chatMessages || 0) > 5 ? "up" as const : "flat" as const,
      color: "#1A5C38",
      bg: "rgba(26,92,56,0.06)",
      borderColor: "rgba(26,92,56,0.15)",
      icon: MessageCircle,
    },
    {
      label: "Memory Wall",
      value: engagementData ? `${engagementData.memoryWallPosts}` : "—",
      trend: (engagementData?.memoryWallPosts || 0) > 3 ? "up" as const : "flat" as const,
      color: "#CDA88A",
      bg: "rgba(205,168,138,0.06)",
      borderColor: "rgba(205,168,138,0.15)",
      icon: Heart,
    },
    {
      label: "Flavor Fusion",
      value: engagementData ? `${engagementData.flavorFusionIdeas}` : "—",
      trend: (engagementData?.flavorFusionIdeas || 0) > 2 ? "up" as const : "flat" as const,
      color: "#7E9E78",
      bg: "rgba(126,158,120,0.06)",
      borderColor: "rgba(126,158,120,0.15)",
      icon: Sparkles,
    },
    {
      label: "Recipe Spins",
      value: engagementData ? `${engagementData.recipeRouletteSpins}` : "—",
      trend: (engagementData?.recipeRouletteSpins || 0) > 5 ? "up" as const : "flat" as const,
      color: "#4A7FB5",
      bg: "rgba(74,127,181,0.06)",
      borderColor: "rgba(74,127,181,0.15)",
      icon: Shuffle,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(221,161,94,0.2)" }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(221,161,94,0.05) 0%, rgba(126,158,120,0.03) 100%)",
          borderBottom: "1px solid rgba(221,161,94,0.1)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#DDA15E" }} />
            <BarChart3 className="w-4 h-4" style={{ color: "#DDA15E" }} />
            <h3 className="text-foreground" style={headingFont}>
              Analytics Overview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground/40" />}
            <span
              className="text-[0.625rem] px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(221,161,94,0.1)",
                color: "#DDA15E",
                ...bodyFont,
              }}
            >
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ backgroundColor: "rgba(96,108,56,0.06)" }}>
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.button
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              onClick={metric.onClick}
              className="bg-card p-3 sm:p-4 flex flex-col items-center text-center cursor-pointer hover:bg-secondary/20 transition-colors"
            >
              <div className="relative mb-2">
                <ProgressRing
                  value={metric.value}
                  max={metric.max}
                  size={52}
                  strokeWidth={4}
                  color={metric.color}
                  bgColor={metric.bgColor}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
              </div>
              <span
                className="text-foreground text-[1.25rem] leading-none mb-0.5"
                style={headingFont}
              >
                {metric.display}
              </span>
              <span
                className="text-foreground/80 text-[0.6875rem] leading-snug"
                style={bodyFont}
              >
                {metric.label}
              </span>
              <span
                className="text-muted-foreground text-[0.5625rem] mt-0.5"
                style={bodyFont}
              >
                {metric.subtitle}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Quick insight bar */}
      <div
        className="px-4 sm:px-5 py-3 flex items-center gap-3"
        style={{ borderTop: "1px solid rgba(221,161,94,0.08)" }}
      >
        <MessageCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#DDA15E" }} />
        <p className="text-muted-foreground text-[0.6875rem] leading-relaxed flex-1" style={bodyFont}>
          {submissionRate > 50
            ? "Great progress! Over half of chef submissions are in."
            : chefProfileCount > 3
              ? `${chefProfileCount} chefs onboarded. Follow up on remaining submissions.`
              : profileCount > 0
                ? `${profileCount} team members active. Continue sharing access codes to grow the team.`
                : "Share access codes with your team and chefs to get started."}
        </p>
      </div>

      {/* ── Engagement Metrics ── */}
      <div
        className="px-4 sm:px-5 py-3"
        style={{ borderTop: "1px solid rgba(221,161,94,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
          <span className="text-foreground text-[0.75rem] font-medium" style={bodyFont}>
            Engagement Pulse
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {engagementMetrics.map((em, idx) => {
            const EIcon = em.icon;
            const TrendIcon = em.trend === "up" ? ArrowUpRight : em.trend === "down" ? ArrowDownRight : Minus;
            const trendColor = em.trend === "up" ? "#5DA06B" : em.trend === "down" ? "#CDA88A" : "#6B6952";
            return (
              <motion.div
                key={em.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: em.bg, border: `1px solid ${em.borderColor}` }}
              >
                <EIcon className="w-3.5 h-3.5 shrink-0" style={{ color: em.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-foreground text-[0.875rem] leading-none" style={headingFont}>
                      {em.value}
                    </span>
                    <TrendIcon className="w-2.5 h-2.5" style={{ color: trendColor }} />
                  </div>
                  <span className="text-muted-foreground text-[0.5625rem] leading-tight block truncate" style={bodyFont}>
                    {em.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Export Summary ── */}
      <div
        className="px-4 sm:px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(221,161,94,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <Printer className="w-3.5 h-3.5" style={{ color: "#6B7F8E" }} />
          <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
            Generate a stakeholder report with all metrics
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
          style={{
            backgroundColor: "rgba(221,161,94,0.08)",
            color: "#DDA15E",
            border: "1px solid rgba(221,161,94,0.15)",
            ...bodyFont,
          }}
        >
          <Printer className="w-3 h-3" />
          Export
        </motion.button>
      </div>

      {/* ── Weekly Digest ── */}
      <div
        className="px-4 sm:px-5 py-3 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(221,161,94,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5" style={{ color: "#6B7F8E" }} />
          <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
            Send a weekly digest to stakeholders
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDigest(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
          style={{
            backgroundColor: "rgba(221,161,94,0.08)",
            color: "#DDA15E",
            border: "1px solid rgba(221,161,94,0.15)",
            ...bodyFont,
          }}
        >
          <Mail className="w-3 h-3" />
          Send
        </motion.button>
      </div>

      {/* Export Modal */}
      {showExport && <ExportSummary onClose={() => setShowExport(false)} />}
      {/* Digest Modal */}
      {showDigest && <WeeklyDigest onClose={() => setShowDigest(false)} />}
    </motion.div>
  );
}