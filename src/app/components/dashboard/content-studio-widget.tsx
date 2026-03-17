import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  PenTool,
  Database,
  Zap,
  Users,
  Receipt,
  Inbox,
  BarChart3,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "../../lib/supabase";
import { bodyFont, headingFont } from "../../lib/fonts";

interface StudioStats {
  profiles: number;
  expenses: number;
  inquiries: number;
  analytics: number;
  notionTypes: number;
  totalKvEntries: number;
}

const STAT_ITEMS = [
  { key: "profiles", label: "Profiles", icon: Users, color: "#8B7EC8" },
  { key: "expenses", label: "Expenses", icon: Receipt, color: "#D4AA7C" },
  { key: "inquiries", label: "Inquiries", icon: Inbox, color: "#5EAAA8" },
  { key: "analytics", label: "Analytics", icon: BarChart3, color: "#4A7FB5" },
] as const;

interface ContentStudioWidgetProps {
  onNavigate: (page: string) => void;
}

export function ContentStudioWidget({ onNavigate }: ContentStudioWidgetProps) {
  const [stats, setStats] = useState<StudioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/content-studio/stats")
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setError(false);
        }
      })
      .catch((err) => {
        console.error("Content Studio widget stats error:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(159,176,212,0.15), rgba(201,169,110,0.08))",
              border: "1px solid rgba(159,176,212,0.2)",
            }}
          >
            <PenTool className="w-3.5 h-3.5" style={{ color: "#9FB0D4" }} />
          </div>
          <h3 className="text-foreground text-[0.8125rem] font-semibold" style={headingFont}>
            Content Studio
          </h3>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate("Content Studio")}
          className="flex items-center gap-1 text-[0.6875rem] cursor-pointer"
          style={{ color: "#9FB0D4", ...bodyFont }}
        >
          Open <ArrowRight className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4 gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>Loading stats...</span>
          </div>
        ) : error || !stats ? (
          <div className="flex items-center justify-center py-4 gap-2">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#D4AA7C" }} />
            <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>Could not load stats</span>
          </div>
        ) : (
          <>
            {/* Quick counts grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {STAT_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2"
                  style={{ backgroundColor: `${item.color}08`, border: `1px solid ${item.color}15` }}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[1rem] font-bold text-foreground leading-none tabular-nums" style={headingFont}>
                      {(stats as any)[item.key]}
                    </p>
                    <p className="text-[0.5625rem] text-muted-foreground mt-0.5" style={bodyFont}>
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary row */}
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <div className="flex items-center gap-2">
                <Database className="w-3 h-3 text-muted-foreground" />
                <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                  {stats.totalKvEntries.toLocaleString()} total KV records
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {stats.notionTypes > 0 ? (
                  <CheckCircle2 className="w-3 h-3" style={{ color: "#7E9E78" }} />
                ) : (
                  <AlertTriangle className="w-3 h-3" style={{ color: "#D4AA7C" }} />
                )}
                <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>
                  <Zap className="w-2.5 h-2.5 inline-block mr-0.5" style={{ color: "#C27B6B" }} />
                  {stats.notionTypes}/11 Notion
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
