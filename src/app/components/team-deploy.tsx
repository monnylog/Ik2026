import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UserCheck,
  Users,
  Clock,
  ChefHat,
  Megaphone,
  Camera,
  Truck,
  ShieldCheck,
  Utensils,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  BookOpen,
  DollarSign,
  ArrowRight,
  CircleCheck,
  Loader2,
  AlertTriangle,
  Database,
} from "lucide-react";
import type { ViewMode } from "./onboarding/use-auth";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge, FallbackDataBadge } from "./ui/notion-sync-badge";
import {
  IK26_TEAM_ROSTER,
  IK26_DEPARTMENTS,
  transformNotionTeamMember,
  type IK26TeamMember,
  type AssignmentStatus,
  type TaskStatus,
} from "../lib/ik26-team-roster";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

// Re-export local type alias for sub-components that reference TeamMember
type TeamMember = IK26TeamMember;

const departments = IK26_DEPARTMENTS.map((d) => ({
  name: d.name,
  icon: d.icon,
  color: d.name === "Event Operations" ? "text-gold"
    : d.name === "F&B / Kitchen" ? "text-success"
    : d.name === "Creative & Content" ? "text-info"
    : d.name === "Research & Story" ? "text-gold"
    : d.name === "Communications" ? "text-info"
    : "text-gold",
  bg: d.name === "Event Operations" ? "bg-gold/10"
    : d.name === "F&B / Kitchen" ? "bg-success/10"
    : d.name === "Creative & Content" ? "bg-info/10"
    : d.name === "Research & Story" ? "bg-gold/10"
    : d.name === "Communications" ? "bg-info/10"
    : "bg-gold/10",
}));

const statusConfig: Record<AssignmentStatus, { label: string; color: string; dotColor: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmed", color: "#7E9E78", dotColor: "#7E9E78", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#CDA88A", dotColor: "#CDA88A", icon: Clock },
  open: { label: "Open Role", color: "#C75B3F", dotColor: "#C75B3F", icon: AlertCircle },
};

const taskStatusConfig: Record<TaskStatus, { label: string; color: string; bg: string; icon: typeof CircleCheck }> = {
  ready: { label: "Ready", color: "#7E9E78", bg: "rgba(126,158,120,0.12)", icon: CircleCheck },
  "in-progress": { label: "In Progress", color: "#4A7FB5", bg: "rgba(74,127,181,0.12)", icon: Loader2 },
  blocked: { label: "Blocked", color: "#C75B3F", bg: "rgba(199,91,63,0.12)", icon: AlertTriangle },
  complete: { label: "Complete", color: "#7E9E78", bg: "rgba(126,158,120,0.12)", icon: CheckCircle2 },
};

interface TeamDeployProps {
  onNavigate?: (page: string) => void;
  viewMode?: ViewMode;
}

export function TeamDeploy({ onNavigate, viewMode = "leadership" }: TeamDeployProps) {
  const isTeamView = viewMode === "team";

  // Notion integration — pull team data from Notion, fall back to shared IK26 roster
  const { items: notionTeamItems, isLoading: notionLoading, isConfigured: notionConfigured } = useNotionDatabase("team");

  // Transform Notion data using shared transformer if available
  const notionTeamMembers: TeamMember[] = notionTeamItems.length > 0
    ? notionTeamItems.map(transformNotionTeamMember)
    : [];

  const activeTeamMembers = notionTeamMembers.length > 0 ? notionTeamMembers : IK26_TEAM_ROSTER;
  const isFromNotion = notionTeamMembers.length > 0;

  if (isTeamView) {
    return <TeamDeploySimplified onNavigate={onNavigate} members={activeTeamMembers} isFromNotion={isFromNotion} />;
  }

  return <TeamDeployFull onNavigate={onNavigate} members={activeTeamMembers} isFromNotion={isFromNotion} />;
}

/* ========== TEAM SIMPLIFIED VIEW ========== */
function TeamDeploySimplified({ onNavigate, members, isFromNotion }: { onNavigate?: (page: string) => void; members: TeamMember[]; isFromNotion: boolean }) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [localStatuses, setLocalStatuses] = useState<Record<string, TaskStatus>>({});

  const getMemberTaskStatus = (member: TeamMember): TaskStatus => {
    const key = `${member.name}-${member.role}`;
    return localStatuses[key] || member.taskStatus || "ready";
  };

  const handleMarkComplete = (member: TeamMember) => {
    const key = `${member.name}-${member.role}`;
    const current = getMemberTaskStatus(member);
    const next: TaskStatus = current === "complete" ? "ready" : "complete";
    setLocalStatuses((prev) => ({ ...prev, [key]: next }));
  };

  const filtered = statusFilter === "all"
    ? members
    : members.filter((m) => getMemberTaskStatus(m) === statusFilter);

  const statusCounts = {
    all: members.length,
    ready: members.filter((m) => getMemberTaskStatus(m) === "ready").length,
    "in-progress": members.filter((m) => getMemberTaskStatus(m) === "in-progress").length,
    blocked: members.filter((m) => getMemberTaskStatus(m) === "blocked").length,
    complete: members.filter((m) => getMemberTaskStatus(m) === "complete").length,
  };

  return (
    <div className="space-y-6" role="region" aria-label="Team Deploy - Team View">
      {/* Page heading */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2.5 mb-2">
          <UserCheck className="w-6 h-6" style={{ color: "#4A7FB5" }} aria-hidden="true" />
          <h1 className="text-foreground" style={{ ...headingFont, fontSize: "1.625rem" }}>
            Team Deploy
          </h1>
        </div>
        <p className="text-muted-foreground text-[1rem] leading-relaxed" style={bodyFont}>
          See who&rsquo;s working on what and update task status.
        </p>
      </motion.div>

      {/* Status filter row with large touch targets */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex gap-2 flex-wrap"
        role="toolbar"
        aria-label="Filter by task status"
      >
        {([
          { id: "all" as const, label: "All", color: "#6B7F8E" },
          { id: "in-progress" as const, label: "In Progress", color: "#4A7FB5" },
          { id: "ready" as const, label: "Ready", color: "#7E9E78" },
          { id: "blocked" as const, label: "Blocked", color: "#C75B3F" },
          { id: "complete" as const, label: "Complete", color: "#7E9E78" },
        ]).map((f) => {
          const isActive = statusFilter === f.id;
          const count = statusCounts[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.875rem] cursor-pointer min-h-[44px]"
              style={{
                backgroundColor: isActive ? `${f.color}18` : "rgba(107,127,142,0.04)",
                border: isActive ? `2px solid ${f.color}40` : "2px solid transparent",
                color: isActive ? f.color : "#6B7F8E",
                fontWeight: isActive ? 600 : 400,
                ...bodyFont,
              }}
              aria-pressed={isActive}
              aria-label={`${f.label}: ${count} members`}
            >
              {f.label}
              <span
                className="text-[0.75rem] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? `${f.color}15` : "rgba(107,127,142,0.08)",
                  color: isActive ? f.color : "#6B7F8E",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Team member cards - simple card-based layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" role="list" aria-label="Team members">
        {filtered.map((member, idx) => {
          const sCfg = statusConfig[member.status];
          const tsCfg = taskStatusConfig[getMemberTaskStatus(member)];
          const TsIcon = tsCfg.icon;
          const MIcon = member.icon;
          const isComplete = getMemberTaskStatus(member) === "complete";

          return (
            <motion.article
              key={`${member.name}-${member.role}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.03 }}
              className="bg-card rounded-xl p-5 flex flex-col gap-4"
              style={{
                border: `1px solid ${isComplete ? "rgba(126,158,120,0.2)" : "var(--border)"}`,
                opacity: isComplete ? 0.7 : 1,
              }}
              role="listitem"
              aria-label={`${member.name}, ${member.role}`}
            >
              {/* Top: Icon + Name + Role */}
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: "rgba(201,169,110,0.08)",
                    border: "1px solid rgba(201,169,110,0.15)",
                  }}
                  aria-hidden="true"
                >
                  <MIcon className="w-5 h-5" style={{ color: "#C9A96E" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-foreground text-[1rem] leading-tight"
                    style={headingFont}
                  >
                    {member.name}
                  </h3>
                  <p
                    className="text-muted-foreground text-[0.875rem] mt-0.5"
                    style={bodyFont}
                  >
                    {member.role}
                  </p>
                </div>
              </div>

              {/* Department + Assignment Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[0.8125rem] bg-secondary text-muted-foreground px-2.5 py-1 rounded-lg"
                  style={bodyFont}
                >
                  {member.department}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.8125rem]"
                  style={{ backgroundColor: `${sCfg.dotColor}12`, color: sCfg.color, ...bodyFont }}
                >
                  <sCfg.icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {sCfg.label}
                </span>
              </div>

              {/* Current task */}
              {member.currentTask && (
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: tsCfg.bg }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TsIcon className="w-4 h-4" style={{ color: tsCfg.color }} aria-hidden="true" />
                    <span className="text-[0.8125rem] font-medium" style={{ color: tsCfg.color, ...bodyFont }}>
                      {tsCfg.label}
                    </span>
                  </div>
                  <p className="text-foreground text-[0.875rem]" style={bodyFont}>
                    {member.currentTask}
                  </p>
                </div>
              )}

              {/* Single-tap complete button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMarkComplete(member)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer min-h-[44px]"
                style={{
                  backgroundColor: isComplete
                    ? "rgba(126,158,120,0.12)"
                    : "rgba(126,158,120,0.08)",
                  border: isComplete
                    ? "1px solid rgba(126,158,120,0.25)"
                    : "1px solid rgba(126,158,120,0.15)",
                  ...bodyFont,
                }}
                aria-label={isComplete ? `Mark ${member.name}'s task as not complete` : `Mark ${member.name}'s task as complete`}
              >
                {isComplete ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" style={{ color: "#7E9E78" }} />
                    <span className="text-[0.875rem] font-medium" style={{ color: "#7E9E78" }}>
                      Completed
                    </span>
                  </>
                ) : (
                  <>
                    <CircleCheck className="w-5 h-5" style={{ color: "#7E9E78" }} />
                    <span className="text-[0.875rem] font-medium" style={{ color: "#7E9E78" }}>
                      Mark Complete
                    </span>
                  </>
                )}
              </motion.button>
            </motion.article>
          );
        })}
      </div>

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Chef Roster")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: "rgba(126,158,120,0.06)",
              border: "1px solid rgba(126,158,120,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Chef Roster"
          >
            <ChefHat className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.875rem]" style={{ color: "#7E9E78" }}>Chef Roster</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Event Timeline")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: "rgba(107,127,142,0.06)",
              border: "1px solid rgba(107,127,142,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Event Timeline"
          >
            <CalendarDays className="w-4 h-4" style={{ color: "#6B7F8E" }} />
            <span className="text-[0.875rem]" style={{ color: "#6B7F8E" }}>Event Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#6B7F8E", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ========== FULL MANAGER/LEADERSHIP VIEW (unchanged from original) ========== */
function TeamDeployFull({ onNavigate, members, isFromNotion }: { onNavigate?: (page: string) => void; members: TeamMember[]; isFromNotion: boolean }) {
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [expandedMembers, setExpandedMembers] = useState<Record<string, boolean>>({});
  const confirmedCount = members.filter((m) => m.status === "confirmed").length;
  const openCount = members.filter((m) => m.status === "open").length;
  const pendingCount = members.filter((m) => m.status === "pending").length;

  const filtered = selectedDept === "all"
    ? members
    : members.filter((m) => m.department === selectedDept);

  const toggleMember = (key: string) => {
    setExpandedMembers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Team Deploy
            </h2>
          </div>
          <NotionSyncBadge isLive={isFromNotion} itemCount={isFromNotion ? members.length : undefined} />
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          Team assignments, shifts, and open roles.
        </p>
      </motion.div>

      {/* Compact stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex flex-wrap gap-2"
      >
        {[
          { label: "Positions", value: members.length, color: "#CDA88A", bg: "rgba(205,168,138,0.08)" },
          { label: "Confirmed", value: confirmedCount, color: "#7E9E78", bg: "rgba(126,158,120,0.08)" },
          ...(pendingCount > 0 ? [{ label: "Pending", value: pendingCount, color: "#CDA88A", bg: "rgba(205,168,138,0.08)" }] : []),
          ...(openCount > 0 ? [{ label: "Open Roles", value: openCount, color: "#C75B3F", bg: "rgba(199,91,63,0.08)" }] : []),
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ backgroundColor: stat.bg, border: `1px solid ${stat.color}20` }}
          >
            <span className="text-[1rem]" style={{ color: stat.color, ...headingFont }}>{stat.value}</span>
            <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>{stat.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Department filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedDept("all")}
          className={`px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer ${
            selectedDept === "all"
              ? "bg-gold/15 text-gold border border-gold/30"
              : "bg-secondary text-muted-foreground border border-border"
          }`}
          style={bodyFont}
        >
          All
        </button>
        {departments.map((dept) => (
          <button
            key={dept.name}
            onClick={() => setSelectedDept(dept.name)}
            className={`px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer ${
              selectedDept === dept.name
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
            style={bodyFont}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {/* Team cards */}
      <div className="space-y-3">
        {filtered.map((member, idx) => {
          const sCfg = statusConfig[member.status];
          const SIcon = sCfg.icon;
          const MIcon = member.icon;
          const memberKey = `${member.name}-${member.role}`;
          const isExpanded = expandedMembers[memberKey] || false;

          return (
            <motion.div
              key={memberKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.04 }}
              className="bg-card rounded-xl overflow-hidden"
              style={{ border: member.status === "open" ? "1px solid rgba(199,91,63,0.2)" : "1px solid var(--border)" }}
            >
              <button
                onClick={() => toggleMember(memberKey)}
                className="w-full p-5 flex items-center gap-4 text-left cursor-pointer"
                style={{ minHeight: "44px" }}
                aria-expanded={isExpanded}
                aria-label={`${member.name}, ${member.role}. ${sCfg.label}. Click to ${isExpanded ? "collapse" : "expand"} details.`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  member.status === "open" ? "bg-destructive/10 border border-destructive/20" : "bg-gold/10 border border-gold/20"
                }`}>
                  <MIcon className={`w-5 h-5 ${member.status === "open" ? "text-destructive" : "text-gold"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-[0.9375rem] ${member.name === "TBD" ? "text-destructive" : "text-foreground"}`} style={headingFont}>
                      {member.name}
                    </h3>
                    <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                      — {member.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[0.6875rem] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full" style={bodyFont}>
                      {member.department}
                    </span>
                    <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                      {(member.shifts || []).length} shifts · {(member.responsibilities || []).length} duties
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] shrink-0"
                  style={{ backgroundColor: `${sCfg.dotColor}15`, color: sCfg.color, ...bodyFont }}
                >
                  <SIcon className="w-3 h-3" />
                  {sCfg.label}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground/50 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  style={{ transition: "transform 0.2s" }}
                />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ backgroundColor: "rgba(221,207,195,0.1)" }}>
                      {member.note && (
                        <div className="sm:col-span-2 p-3 rounded-lg border" style={{ backgroundColor: "rgba(205,168,138,0.04)", borderColor: "rgba(205,168,138,0.15)" }}>
                          <p className="text-[0.75rem] leading-relaxed" style={{ color: "#CDA88A", ...bodyFont }}>
                            {member.note}
                          </p>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-card border border-border/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CalendarDays className="w-3.5 h-3.5 text-gold" />
                          <span className="text-foreground text-[0.8125rem]" style={bodyFont}>Shifts</span>
                        </div>
                        <div className="space-y-1">
                          {(member.shifts || []).map((shift) => (
                            <p key={shift} className="text-muted-foreground text-[0.75rem]" style={bodyFont}>{shift}</p>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border/60">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                          <span className="text-foreground text-[0.8125rem]" style={bodyFont}>Responsibilities</span>
                        </div>
                        <div className="space-y-1">
                          {(member.responsibilities || []).map((r) => (
                            <p key={r} className="text-muted-foreground text-[0.75rem]" style={bodyFont}>• {r}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Chef Roster")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(126,158,120,0.06)",
              border: "1px solid rgba(126,158,120,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Chef Roster"
          >
            <ChefHat className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.8125rem]" style={{ color: "#7E9E78" }}>Chef Roster</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Event Timeline")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(107,127,142,0.06)",
              border: "1px solid rgba(107,127,142,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Event Timeline"
          >
            <CalendarDays className="w-4 h-4" style={{ color: "#6B7F8E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#6B7F8E" }}>Event Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#6B7F8E", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Budget & COGS")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(126,158,120,0.06)",
              border: "1px solid rgba(126,158,120,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Budget and COGS"
          >
            <DollarSign className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.8125rem]" style={{ color: "#7E9E78" }}>Budget & COGS</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}