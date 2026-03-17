import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Copy,
  Check,
  X,
  CalendarDays,
  Users,
  ChefHat,
  BarChart3,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { confirmedChefs } from "../onboarding/chef-directory";
import { apiFetch } from "../../lib/supabase";
import { useNotion } from "../../lib/notion-context";
import { toast } from "sonner";

import { bodyFont, headingFont } from "../../lib/fonts";

interface WeeklyDigestProps {
  onClose: () => void;
}

export function WeeklyDigest({ onClose }: WeeklyDigestProps) {
  const { milestones, stats, isLive } = useNotion();
  const [copied, setCopied] = useState(false);
  const [engagementStats, setEngagementStats] = useState<any>(null);
  const [submissionStats, setSubmissionStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [engRes, subRes] = await Promise.allSettled([
          apiFetch("/engagement-stats"),
          apiFetch("/submission-stats"),
        ]);
        if (engRes.status === "fulfilled") setEngagementStats(engRes.value);
        if (subRes.status === "fulfilled") setSubmissionStats(subRes.value);
      } catch {}
    })();
  }, []);

  const today = new Date("2026-03-11");
  const eventDate = new Date("2026-05-22");
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const criticalItems = milestones.filter((m) =>
    m.status?.includes("CRITICAL") || m.status?.includes("Overdue")
  );
  const inProgressItems = milestones.filter((m) => m.status?.includes("In Progress"));
  const thisWeekItems = milestones.filter((m) => m.week?.includes("Week 1"));

  const generateDigestText = useCallback(() => {
    const lines: string[] = [];
    const divider = "─".repeat(50);

    lines.push("ISANG KUSINA 2026 — WEEKLY DIGEST");
    lines.push(`Week of March 11, 2026 | ${daysUntil} days to event`);
    lines.push(divider);
    lines.push("");

    // Overview
    lines.push("OVERVIEW");
    lines.push(`  Event Date: May 22, 2026 — Las Vegas, NV`);
    lines.push(`  Days Remaining: ${daysUntil}`);
    if (isLive) {
      lines.push(`  Milestone Progress: ${stats.completionPct}% (${stats.done}/${stats.total} complete)`);
    }
    lines.push("");

    // Critical Items
    if (criticalItems.length > 0) {
      lines.push(`CRITICAL ITEMS (${criticalItems.length})`);
      criticalItems.forEach((m) => {
        lines.push(`  [!] ${m.milestone}`);
        if (m.owner) lines.push(`      Owner: ${m.owner}`);
        if (m.blocksAndDeps) lines.push(`      Blocker: ${m.blocksAndDeps}`);
      });
      lines.push("");
    }

    // This Week's Focus
    if (thisWeekItems.length > 0) {
      lines.push(`THIS WEEK'S FOCUS (${thisWeekItems.length} items)`);
      thisWeekItems.slice(0, 8).forEach((m) => {
        const statusIcon = m.status?.includes("Done") ? "[x]" : m.status?.includes("In Progress") ? "[~]" : "[ ]";
        lines.push(`  ${statusIcon} ${m.milestone}${m.owner ? ` (${m.owner})` : ""}`);
      });
      lines.push("");
    }

    // Milestone Summary
    if (isLive) {
      lines.push("MILESTONE PROGRESS");
      lines.push(`  Completed: ${stats.done}`);
      lines.push(`  In Progress: ${stats.inProgress}`);
      lines.push(`  Critical/Overdue: ${stats.critical + stats.overdue}`);
      lines.push(`  Upcoming: ${stats.upcoming || stats.future}`);
      lines.push("");
    }

    // Chef Submissions
    if (submissionStats) {
      lines.push("CHEF SUBMISSIONS");
      lines.push(`  Completion Rate: ${submissionStats.completionRate ?? 0}%`);
      lines.push(`  Concepts Submitted: ${submissionStats.conceptCount ?? 0}/${submissionStats.totalChefs ?? 7}`);
      lines.push(`  Ingredients Filed: ${submissionStats.ingredientCount ?? 0}/${submissionStats.totalChefs ?? 7}`);
      lines.push("");
    }

    // Engagement
    if (engagementStats) {
      lines.push("ENGAGEMENT HIGHLIGHTS");
      lines.push(`  Chat Messages: ${engagementStats.chatMessages}`);
      lines.push(`  Prompt Responses: ${engagementStats.promptResponses}`);
      lines.push(`  Memory Wall Posts: ${engagementStats.memoryWallPosts}`);
      lines.push(`  Flavor Fusion Ideas: ${engagementStats.flavorFusionIdeas}`);
      lines.push("");
    }

    // Upcoming Deadlines
    const upcoming = milestones
      .filter((m) => m.dueDate && m.dueDate > "2026-03-11" && m.dueDate <= "2026-03-18")
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    if (upcoming.length > 0) {
      lines.push(`UPCOMING DEADLINES (next 7 days)`);
      upcoming.forEach((m) => {
        lines.push(`  ${m.dueDate} — ${m.milestone}${m.owner ? ` (${m.owner})` : ""}`);
      });
      lines.push("");
    }

    lines.push(divider);
    lines.push("Isang Kusina 2026 — isangkusina.com");
    lines.push("7 chefs | 7 cities | 7 courses | 1 kitchen");

    return lines.join("\n");
  }, [milestones, stats, isLive, criticalItems, thisWeekItems, daysUntil, engagementStats, submissionStats]);

  const handleCopy = useCallback(() => {
    const text = generateDigestText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Weekly digest copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    });
  }, [generateDigestText]);

  const digestPreview = generateDigestText();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-card rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold" />
              <h2 className="text-foreground text-[1rem]" style={headingFont}>
                Weekly Digest
              </h2>
              <span
                className="text-[0.625rem] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", ...bodyFont }}
              >
                Week of Mar 11
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] text-white cursor-pointer"
                style={{ backgroundColor: copied ? "#7E9E78" : "#7E9E78", ...bodyFont }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy to Clipboard"}
              </motion.button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                aria-label="Close digest"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="px-5 pt-4 pb-2 flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(205,168,138,0.08)", border: "1px solid rgba(205,168,138,0.15)" }}>
              <CalendarDays className="w-3.5 h-3.5" style={{ color: "#CDA88A" }} />
              <span className="text-[0.75rem]" style={{ color: "#CDA88A", ...bodyFont }}>{daysUntil} days left</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(126,158,120,0.08)", border: "1px solid rgba(126,158,120,0.15)" }}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
                <span className="text-[0.75rem]" style={{ color: "#7E9E78", ...bodyFont }}>{stats.completionPct}% complete</span>
              </div>
            )}
            {criticalItems.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(199,91,63,0.08)", border: "1px solid rgba(199,91,63,0.15)" }}>
                <AlertCircle className="w-3.5 h-3.5" style={{ color: "#C75B3F" }} />
                <span className="text-[0.75rem]" style={{ color: "#C75B3F", ...bodyFont }}>{criticalItems.length} critical</span>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto px-5 pb-5">
            <div className="mt-2 p-4 rounded-xl font-mono text-[0.75rem] leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: "rgba(126,158,120,0.04)",
                border: "1px solid rgba(126,158,120,0.1)",
                color: "var(--foreground)",
              }}
            >
              {digestPreview}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <p className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
              Paste into email, Slack, or any communication channel.
            </p>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" style={{ color: "#C9A96E", opacity: 0.5 }} />
              <span className="text-[0.625rem]" style={{ color: "#C9A96E", ...bodyFont }}>Auto-generated from live data</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}