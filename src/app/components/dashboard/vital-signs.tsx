// ─── Vital Signs Widget ──────────────────────────────────────────
// Dashboard overview of key financial and social metrics.
// Pulls from Notion budget data when available, falls back to hardcoded.

import { motion } from "motion/react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  Eye,
  Ticket,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformBudgetLine } from "../../lib/notion-transforms";
import { NotionSyncBadge } from "../ui/notion-sync-badge";

import { bodyFont, headingFont } from "../../lib/fonts";

interface VitalSignMetric {
  label: string;
  value: string;
  subtext: string;
  icon: typeof DollarSign;
  color: string;
  bg: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}

// Fallback vital signs when Notion isn't connected
const FALLBACK_VITALS: VitalSignMetric[] = [
  {
    label: "Cash on Hand",
    value: "$4,200",
    subtext: "From Y2 carryover + early ticket sales",
    icon: DollarSign,
    color: "#7E9E78",
    bg: "rgba(126,158,120,0.06)",
    trend: "neutral",
    trendLabel: "Stable",
  },
  {
    label: "Revenue Target",
    value: "$45,000",
    subtext: "200 guests × $225 avg ticket",
    icon: TrendingUp,
    color: "#C9A96E",
    bg: "rgba(201,169,110,0.06)",
    trend: "up",
    trendLabel: "On track",
  },
  {
    label: "Sponsorship Pipeline",
    value: "$8,500",
    subtext: "3 confirmed, 5 pending outreach",
    icon: Ticket,
    color: "#4A7FB5",
    bg: "rgba(74,127,181,0.06)",
    trend: "up",
    trendLabel: "+$2.5K this week",
  },
  {
    label: "Social Reach",
    value: "12.4K",
    subtext: "Combined IG + newsletter subs",
    icon: Heart,
    color: "#D4727E",
    bg: "rgba(212,114,126,0.06)",
    trend: "up",
    trendLabel: "+840 this month",
  },
  {
    label: "Landing Page Views",
    value: "3,200",
    subtext: "Last 30 days — 6.8% conversion",
    icon: Eye,
    color: "#9B8EC4",
    bg: "rgba(155,142,196,0.06)",
    trend: "up",
    trendLabel: "+18% MoM",
  },
  {
    label: "Team Active",
    value: "18/20",
    subtext: "Checked in within last 7 days",
    icon: Users,
    color: "#7E9E78",
    bg: "rgba(126,158,120,0.06)",
    trend: "up",
    trendLabel: "90% active",
  },
];

interface VitalSignsProps {
  onNavigate?: (page: string) => void;
}

export function VitalSigns({ onNavigate }: VitalSignsProps) {
  const { items: budgetItems } = useNotionDatabase("budget");
  const isLive = budgetItems.length > 0;

  // If we have Notion budget data, compute financial vitals from it
  let vitals = FALLBACK_VITALS;
  if (isLive) {
    const lines = budgetItems.map(transformBudgetLine);
    const totalAllocated = lines.reduce((s, l) => s + l.allocated, 0);
    const totalSpent = lines.reduce((s, l) => s + l.spent, 0);
    const remaining = totalAllocated - totalSpent;
    const spendRatio = totalAllocated > 0 ? totalSpent / totalAllocated : 0;

    vitals = [
      {
        label: "Budget Allocated",
        value: `$${totalAllocated.toLocaleString()}`,
        subtext: `Across ${lines.length} categories`,
        icon: DollarSign,
        color: "#C9A96E",
        bg: "rgba(201,169,110,0.06)",
        trend: "neutral",
        trendLabel: "Set",
      },
      {
        label: "Spent to Date",
        value: `$${totalSpent.toLocaleString()}`,
        subtext: `${Math.round(spendRatio * 100)}% of budget used`,
        icon: spendRatio > 0.85 ? TrendingDown : TrendingUp,
        color: spendRatio > 0.85 ? "#C85050" : "#7E9E78",
        bg: spendRatio > 0.85 ? "rgba(200,80,80,0.06)" : "rgba(126,158,120,0.06)",
        trend: spendRatio > 0.85 ? "down" : "up",
        trendLabel: spendRatio > 0.85 ? "Over 85%" : "On track",
      },
      {
        label: "Remaining",
        value: `$${remaining.toLocaleString()}`,
        subtext: remaining < 0 ? "Over budget" : "Available",
        icon: DollarSign,
        color: remaining < 0 ? "#C85050" : "#7E9E78",
        bg: remaining < 0 ? "rgba(200,80,80,0.06)" : "rgba(126,158,120,0.06)",
        trend: remaining < 0 ? "down" : "neutral",
        trendLabel: remaining < 0 ? "Over budget" : "In reserve",
      },
      ...FALLBACK_VITALS.slice(3), // Keep social metrics as-is until we have a Notion source
    ];
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(126,158,120,0.08)" }}
          >
            <Activity className="w-4 h-4" style={{ color: "#7E9E78" }} />
          </div>
          <div>
            <h3 className="text-[0.9375rem] font-semibold" style={{ ...headingFont, color: "#3D524D" }}>
              Vital Signs
            </h3>
            <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "#A09A94" }}>
              Key financial & engagement metrics
            </p>
          </div>
          <NotionSyncBadge isLive={isLive} compact />
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate("Budget & COGS")}
            className="flex items-center gap-1 text-[0.6875rem] px-2.5 py-1 rounded-lg cursor-pointer"
            style={{ ...bodyFont, color: "#C9A96E", backgroundColor: "rgba(201,169,110,0.06)" }}
          >
            Details
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px" style={{ backgroundColor: "rgba(0,0,0,0.04)" }}>
        {vitals.map((metric, idx) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : ArrowUpRight;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx, duration: 0.3 }}
              className="px-4 py-3.5"
              style={{ backgroundColor: "#FFFFFF" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: metric.bg }}
                >
                  <Icon className="w-3 h-3" style={{ color: metric.color }} />
                </div>
                <span className="text-[0.625rem] uppercase tracking-wider" style={{ ...bodyFont, color: "#A09A94" }}>
                  {metric.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[1.25rem] font-bold" style={{ ...headingFont, color: "#3D524D" }}>
                  {metric.value}
                </span>
                {metric.trendLabel && (
                  <span
                    className="flex items-center gap-0.5 text-[0.5625rem]"
                    style={{
                      color: metric.trend === "up" ? "#7E9E78" : metric.trend === "down" ? "#C85050" : "#A09A94",
                    }}
                  >
                    <TrendIcon className="w-2.5 h-2.5" />
                    {metric.trendLabel}
                  </span>
                )}
              </div>
              <p className="text-[0.625rem] mt-0.5" style={{ ...bodyFont, color: "#A09A94" }}>
                {metric.subtext}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}