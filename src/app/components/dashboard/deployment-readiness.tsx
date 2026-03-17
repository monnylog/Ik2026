import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ChevronDown,
  Shield,
  ChefHat,
  Users,
  MessageCircle,
  Database,
  Globe,
  AlertTriangle,
  Share2,
  Eye,
  RefreshCw,
  Send as SendIcon,
  Flame,
  FileText,
} from "lucide-react";
import { useNotion } from "../../lib/notion-context";
import { apiFetch } from "../../lib/supabase";
import { confirmedChefs } from "../onboarding/chef-directory";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformWarRoomItem } from "../../lib/notion-transforms";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  status: "ready" | "partial" | "not-ready";
  detail?: string;
  icon: typeof Rocket;
  color: string;
  navigateTo?: string;
}

interface DeploymentReadinessProps {
  onNavigate: (page: string) => void;
}

export function DeploymentReadiness({ onNavigate }: DeploymentReadinessProps) {
  const { isLive: notionLive, stats: notionStats } = useNotion();
  const { items: warRoomItems } = useNotionDatabase("warroom");
  const [expanded, setExpanded] = useState(true);
  const [shareExpanded, setShareExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [profileCount, setProfileCount] = useState<number | null>(null);
  const [chefProfileCount, setChefProfileCount] = useState<number | null>(null);
  const [submissionRate, setSubmissionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formUrlStatus, setFormUrlStatus] = useState<{ placeholderCount: number; allProduction: boolean } | null>(null);
  const [invitesSent, setInvitesSent] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("ik26-invites-sent");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const fetchStats = useCallback(async () => {
    try {
      const [profileData, submissionData, formUrlData] = await Promise.allSettled([
        apiFetch("/admin/profiles"),
        apiFetch("/submission-stats"),
        apiFetch("/form-urls"),
      ]);

      if (profileData.status === "fulfilled") {
        const profiles = profileData.value?.profiles || [];
        setProfileCount(profiles.length);
        setChefProfileCount(
          profiles.filter((p: any) => p.chefDirectoryId).length
        );
      }

      if (submissionData.status === "fulfilled") {
        setSubmissionRate(submissionData.value?.completionRate ?? 0);
      }

      if (formUrlData.status === "fulfilled") {
        setFormUrlStatus({
          placeholderCount: formUrlData.value?.placeholderCount ?? 6,
          allProduction: formUrlData.value?.allProduction ?? false,
        });
      }
    } catch (e) {
      console.error("Deployment readiness fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshing(true);
      fetchStats().finally(() => setRefreshing(false));
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Refresh when page becomes visible (tab switch / navigation back)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchStats]);

  // Persist invite tracking
  const toggleInviteSent = (chefId: string) => {
    setInvitesSent((prev) => {
      const next = { ...prev, [chefId]: !prev[chefId] };
      localStorage.setItem("ik26-invites-sent", JSON.stringify(next));
      return next;
    });
  };

  const invitesSentCount = confirmedChefs.filter((c) => invitesSent[c.id]).length;

  const totalProfiles = profileCount ?? 0;
  const totalChefProfiles = chefProfileCount ?? 0;

  // Mission Control critical alerts count
  const warRoomCriticalCount = warRoomItems
    .map(item => transformWarRoomItem(item))
    .filter(w => w.severity === "critical" && !w.status?.toLowerCase().includes("resolved")).length;
  const warRoomWarningCount = warRoomItems
    .map(item => transformWarRoomItem(item))
    .filter(w => w.severity === "warning" && !w.status?.toLowerCase().includes("resolved")).length;

  const items: ReadinessItem[] = [
    {
      id: "access",
      label: "Access Codes Active",
      description:
        "Password gate configured with leadership, team, and chef access codes",
      status: "ready",
      detail: "3 roles: leadership, team, chef. All codes ready to distribute.",
      icon: Shield,
      color: "#7E9E78",
    },
    {
      id: "warroom",
      label: `Mission Control (${warRoomCriticalCount} critical)`,
      description: warRoomCriticalCount > 0
        ? `${warRoomCriticalCount} critical, ${warRoomWarningCount} warning — escalations requiring attention`
        : warRoomItems.length > 0
          ? `${warRoomItems.length} items tracked — no active critical alerts`
          : "No Mission Control data — connect via Notion Admin",
      status: warRoomCriticalCount > 0 ? "not-ready"
        : warRoomWarningCount > 0 ? "partial"
        : warRoomItems.length > 0 ? "ready" : "partial",
      detail: warRoomCriticalCount > 0 ? "Review critical gaps in Mission Control" : undefined,
      icon: Flame,
      color: warRoomCriticalCount > 0 ? "#C75B3F" : warRoomWarningCount > 0 ? "#CDA88A" : "#7E9E78",
      navigateTo: "Mission Control",
    },
    {
      id: "profiles",
      label: `Team Profiles (${totalProfiles})`,
      description: loading
        ? "Checking profile registrations..."
        : `${totalProfiles} profile${totalProfiles !== 1 ? "s" : ""} created across all roles`,
      status: loading
        ? "partial"
        : totalProfiles >= 5
          ? "ready"
          : totalProfiles > 0
            ? "partial"
            : "not-ready",
      detail: loading ? undefined : totalProfiles === 0 ? "Share access codes with your team to get started" : undefined,
      icon: Users,
      color: totalProfiles >= 5 ? "#7E9E78" : "#CDA88A",
      navigateTo: "Members",
    },
    {
      id: "chefs",
      label: `Chef Profiles (${totalChefProfiles}/7)`,
      description: loading
        ? "Checking chef registrations..."
        : `${totalChefProfiles} of 7 confirmed chefs have created profiles`,
      status: loading
        ? "partial"
        : totalChefProfiles >= 7
          ? "ready"
          : totalChefProfiles > 0
            ? "partial"
            : "not-ready",
      detail:
        totalChefProfiles < 7 && !loading
          ? "Share the chef access code with remaining chefs"
          : undefined,
      icon: ChefHat,
      color: totalChefProfiles >= 7 ? "#7E9E78" : "#CDA88A",
      navigateTo: "Chef Roster",
    },
    {
      id: "notion",
      label: "Notion Ops Center",
      description: notionLive
        ? `Connected — ${notionStats.total} milestones synced`
        : "Not connected — using static action items",
      status: notionLive ? "ready" : "partial",
      detail: notionLive
        ? `${notionStats.done} completed, ${notionStats.critical + notionStats.overdue} need attention`
        : "Click the sync button (↻) in the top bar to connect",
      icon: Database,
      color: notionLive ? "#5DA06B" : "#6B7F8E",
      navigateTo: "Notion Admin",
    },
    {
      id: "comms",
      label: "Comms Hub",
      description:
        "Real-time messaging with 6 topic rooms",
      status: "ready",
      detail: "Channels: #general, #kitchen, #travel, #creative, #logistics, #urgent",
      icon: MessageCircle,
      color: "#1A5C38",
      navigateTo: "Comms",
    },
    {
      id: "submissions",
      label: `Chef Submissions (${submissionRate ?? 0}%)`,
      description: loading
        ? "Checking submission pipeline..."
        : submissionRate && submissionRate > 0
          ? `${submissionRate}% completion rate across all chefs`
          : "No submissions yet — chefs can submit via Menu & Courses",
      status: loading
        ? "partial"
        : submissionRate && submissionRate >= 50
          ? "ready"
          : submissionRate && submissionRate > 0
            ? "partial"
            : "not-ready",
      icon: Globe,
      color:
        submissionRate && submissionRate >= 50 ? "#7E9E78" : "#CDA88A",
      navigateTo: "Menu & Courses",
    },
    {
      id: "forms",
      label: "Forms & Agreements",
      description:
        formUrlStatus?.placeholderCount > 0
          ? `${formUrlStatus.placeholderCount} Google Form/Doc URLs still using placeholder IDs — swap before distributing access codes`
          : "All forms and agreements are using production URLs",
      status: formUrlStatus === null ? "partial" : formUrlStatus.placeholderCount > 0 ? "not-ready" : "ready",
      detail: formUrlStatus === null ? "Checking form URL status..." : formUrlStatus.placeholderCount > 0 ? "Update via Settings → PUT /form-urls or the admin panel" : undefined,
      icon: FileText,
      color: formUrlStatus?.placeholderCount > 0 ? "#CDA88A" : "#7E9E78",
      navigateTo: "Forms & Agreements",
    },
  ];

  const readyCount = items.filter((i) => i.status === "ready").length;
  const percentage = Math.round((readyCount / items.length) * 100);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const accessInfo = [
    {
      id: "url",
      label: "Hub URL",
      value: "isangkusina.com",
      copyValue: "https://isangkusina.com",
    },
    {
      id: "leadership-code",
      label: "Leadership Code",
      value: "northstar222",
      copyValue: "northstar222",
      badge: "Leadership",
      badgeColor: "#DDA15E",
    },
    {
      id: "team-code",
      label: "Team Code",
      value: "teamik26",
      copyValue: "teamik26",
      badge: "Team",
      badgeColor: "#4A7FB5",
    },
    {
      id: "chef-code",
      label: "Chef Code",
      value: "kusina2026",
      copyValue: "kusina2026",
      badge: "Chef",
      badgeColor: "#D4AA7C",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(126,158,120,0.2)" }}
    >
      {/* Header */}
      <div
        className="px-4 sm:px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(126,158,120,0.05) 0%, rgba(126,158,120,0.03) 100%)",
          borderBottom: "1px solid rgba(126,158,120,0.1)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#7E9E78" }} />
            <Rocket className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <h3 className="text-foreground" style={headingFont}>
              Deployment Readiness
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground/40" />
            )}
            <span
              className="text-[0.6875rem] px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  percentage >= 80
                    ? "rgba(126,158,120,0.12)"
                    : "rgba(205,168,138,0.12)",
                color: percentage >= 80 ? "#7E9E78" : "#CDA88A",
                ...bodyFont,
              }}
            >
              {percentage}% ready
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-200 ${
                  expanded ? "" : "-rotate-90"
                }`}
              />
            </button>
          </div>
        </div>
        <p
          className="text-muted-foreground text-[0.6875rem] sm:text-[0.75rem]"
          style={bodyFont}
        >
          System status for team and chef onboarding.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Progress bar */}
            <div className="px-5 pt-4 pb-1">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(126,158,120,0.08)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #7E9E78, #7E9E78)",
                  }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3 space-y-1">
              {items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.04 }}
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-xl group ${item.navigateTo ? "cursor-pointer" : ""}`}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.03)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
                    onClick={() => item.navigateTo && onNavigate(item.navigateTo)}
                  >
                    {/* Status icon */}
                    <div className="shrink-0 mt-0.5">
                      {item.status === "ready" ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#7E9E78" }} />
                      ) : item.status === "partial" ? (
                        <AlertTriangle className="w-4 h-4" style={{ color: "#CDA88A" }} />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[0.8125rem] ${
                            item.status === "ready"
                              ? "text-foreground"
                              : "text-foreground"
                          }`}
                          style={bodyFont}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p
                        className="text-muted-foreground text-[0.6875rem] leading-relaxed"
                        style={bodyFont}
                      >
                        {item.description}
                      </p>
                      {item.detail && (
                        <p
                          className="text-muted-foreground/50 text-[0.625rem] mt-0.5"
                          style={bodyFont}
                        >
                          {item.detail}
                        </p>
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}10` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Share Access Section */}
            <div className="px-4 pb-4">
              <button
                onClick={() => setShareExpanded(!shareExpanded)}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl cursor-pointer transition-colors hover:opacity-90"
                style={{
                  backgroundColor: "rgba(201,169,110,0.06)",
                  border: "1px solid rgba(201,169,110,0.15)",
                }}
              >
                <Share2 className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
                <span
                  className="text-[0.8125rem] flex-1 text-left"
                  style={{ color: "#C9A96E", ...bodyFont }}
                >
                  Share Access with Team & Chefs
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    shareExpanded ? "rotate-180" : ""
                  }`}
                  style={{ color: "#C9A96E", opacity: 0.5 }}
                />
              </button>

              <AnimatePresence>
                {shareExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2">
                      {accessInfo.map((info) => (
                        <div
                          key={info.id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{
                            backgroundColor: "rgba(126,158,120,0.02)",
                            border: "1px solid rgba(126,158,120,0.06)",
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-muted-foreground text-[0.625rem] uppercase tracking-wider"
                                style={bodyFont}
                              >
                                {info.label}
                              </span>
                              {info.badge && (
                                <span
                                  className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `${info.badgeColor}15`,
                                    color: info.badgeColor,
                                    ...bodyFont,
                                  }}
                                >
                                  {info.badge}
                                </span>
                              )}
                            </div>
                            <span
                              className="text-foreground text-[0.875rem] block"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "0.8125rem",
                              }}
                            >
                              {info.value}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleCopy(info.copyValue, info.id)
                            }
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer shrink-0"
                            title="Copy"
                          >
                            {copied === info.id ? (
                              <Check className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground/40" />
                            )}
                          </button>
                        </div>
                      ))}

                      {/* Quick share message */}
                      <button
                        onClick={() =>
                          handleCopy(
                            `Join the Isang Kusina 2026 Event Hub!\n\n🔗 https://isangkusina.com\n🔑 Access code: kusina2026\n\nCreate your profile and explore the dashboard — real-time comms, timeline, and everything you need for May 22.`,
                            "share-msg"
                          )
                        }
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "rgba(205,168,138,0.06)",
                          border: "1px solid rgba(205,168,138,0.12)",
                        }}
                      >
                        {copied === "share-msg" ? (
                          <>
                            <Check className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
                            <span
                              className="text-[0.75rem]"
                              style={{ color: "#7E9E78", ...bodyFont }}
                            >
                              Copied to clipboard!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" style={{ color: "#CDA88A" }} />
                            <span
                              className="text-[0.75rem]"
                              style={{ color: "#CDA88A", ...bodyFont }}
                            >
                              Copy chef invite message
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Invite Tracker — per-chef sent status */}
            <div className="px-4 pb-3">
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  backgroundColor: "rgba(126,158,120,0.02)",
                  border: "1px solid rgba(126,158,120,0.06)",
                }}
              >
                <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(126,158,120,0.04)" }}>
                  <div className="flex items-center gap-1.5">
                    <SendIcon className="w-3 h-3" style={{ color: "#CDA88A" }} />
                    <span className="text-[0.6875rem]" style={{ color: "#CDA88A", ...bodyFont, fontWeight: 600 }}>
                      Invite Tracker
                    </span>
                  </div>
                  <span className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: invitesSentCount === confirmedChefs.length ? "rgba(126,158,120,0.12)" : "rgba(205,168,138,0.12)", color: invitesSentCount === confirmedChefs.length ? "#7E9E78" : "#CDA88A", ...bodyFont }}>
                    {invitesSentCount}/{confirmedChefs.length} sent
                  </span>
                </div>
                <div className="px-2 py-1.5 space-y-0.5">
                  {confirmedChefs.map((chef) => (
                    <button
                      key={chef.id}
                      onClick={() => toggleInviteSent(chef.id)}
                      className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer text-left group"
                    >
                      <div className="shrink-0">
                        {invitesSent[chef.id] ? (
                          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-muted-foreground/40 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <span className={`text-[0.75rem] truncate ${invitesSent[chef.id] ? "text-foreground/50 line-through" : "text-foreground"}`} style={bodyFont}>
                          {chef.name}
                        </span>
                        <span className="text-[0.5625rem] text-muted-foreground/40 shrink-0" style={bodyFont}>
                          Course {chef.course}
                        </span>
                      </div>
                      <span className="text-[0.5rem] text-muted-foreground/30 shrink-0" style={bodyFont}>
                        {chef.state ? `${chef.city}, ${chef.state}` : chef.city}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer links */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => onNavigate("Members")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "rgba(74,127,181,0.06)",
                  border: "1px solid rgba(74,127,181,0.12)",
                  ...bodyFont,
                }}
              >
                <Users className="w-3 h-3" style={{ color: "#4A7FB5" }} />
                <span className="text-[0.6875rem]" style={{ color: "#4A7FB5" }}>
                  View Members
                </span>
              </button>
              <button
                onClick={() => onNavigate("Team Deploy")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "rgba(126,158,120,0.06)",
                  border: "1px solid rgba(126,158,120,0.12)",
                  ...bodyFont,
                }}
              >
                <Eye className="w-3 h-3" style={{ color: "#7E9E78" }} />
                <span className="text-[0.6875rem]" style={{ color: "#7E9E78" }}>
                  Team Deploy
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}