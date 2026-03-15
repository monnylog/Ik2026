import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Shield,
  ChefHat,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  User,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Database,
} from "lucide-react";
import { apiFetch } from "../lib/supabase";
import { getAvatar } from "./engagement/avatars";
import { useNotionDatabase } from "../lib/notion-sync";
import {
  IK26_TEAM_ROSTER,
  IK26_DEPARTMENTS,
  transformNotionTeamMember,
  type IK26TeamMember,
  type AssignmentStatus,
} from "../lib/ik26-team-roster";
import { NotionSyncBadge } from "./ui/notion-sync-badge";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface RegisteredProfile {
  id: string;
  displayName: string;
  role: string;
  avatarId: string;
  createdAt: string;
  lastActive: string;
  email: string;
  accessCode: string;
  onboardingCompleted: boolean;
}

// Use shared types and data from ik26-team-roster
type TeamMember = IK26TeamMember;

const departments = IK26_DEPARTMENTS;

const statusConfig: Record<AssignmentStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmed", color: "#7E9E78", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#CDA88A", icon: Clock },
  open: { label: "Open", color: "#C75B3F", icon: AlertCircle },
};

type ActiveTab = "roster" | "registered";

export function UserManagement() {
  const [profiles, setProfiles] = useState<RegisteredProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("roster");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  // Notion team data — uses shared transformer
  const { items: notionTeamItems, isLoading: notionLoading } = useNotionDatabase("team");

  // Transform Notion team data using shared transformer if available
  const notionTeamMembers: TeamMember[] = notionTeamItems.length > 0
    ? notionTeamItems.map(transformNotionTeamMember)
    : [];

  const teamMembers = notionTeamMembers.length > 0 ? notionTeamMembers : IK26_TEAM_ROSTER;
  const isFromNotion = notionTeamMembers.length > 0;

  const loadProfiles = useCallback(async () => {
    try {
      const data = await apiFetch("/admin/profiles");
      setProfiles(data.profiles || []);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadProfiles();
  };

  // Stats
  const confirmedCount = teamMembers.filter((m) => m.status === "confirmed").length;
  const pendingCount = teamMembers.filter((m) => m.status === "pending").length;
  const uniqueDepts = [...new Set(teamMembers.map((m) => m.department))];

  const filteredRoster = teamMembers.filter((m) => {
    if (deptFilter !== "all" && m.department !== deptFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.department.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by department
  const groupedRoster: Record<string, TeamMember[]> = {};
  filteredRoster.forEach((m) => {
    if (!groupedRoster[m.department]) groupedRoster[m.department] = [];
    groupedRoster[m.department].push(m);
  });

  const filteredProfiles = profiles.filter((p) =>
    p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chefCount = profiles.filter((p) => p.role === "chef").length;
  const leadershipCount = profiles.filter((p) => p.role === "leadership").length;
  const teamAppCount = profiles.filter((p) => p.role === "team").length;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
            Members
          </h1>
          <p className="text-muted-foreground text-[0.8125rem] mt-0.5" style={bodyFont}>
            IK26 team roster, roles, and registered app profiles.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer border border-border"
          title="Refresh profiles"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid var(--border)" }}>
        {([
          { key: "roster" as ActiveTab, label: "Team Roster", icon: UserCheck, count: teamMembers.length },
          { key: "registered" as ActiveTab, label: "App Users", icon: Users, count: profiles.length },
        ]).map((tab) => {
          const isActive = activeTab === tab.key;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer flex-1 justify-center"
              style={{
                ...bodyFont,
                backgroundColor: isActive ? "var(--card)" : "rgba(0,0,0,0)",
                color: isActive ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
              <span
                className="text-[0.625rem] px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? "rgba(201,169,110,0.1)" : "rgba(0,0,0,0.04)",
                  color: isActive ? "#C9A96E" : "var(--muted-foreground)",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── ROSTER TAB ─────────────────────────────────────────── */}
      {activeTab === "roster" && (
        <>
          {/* Roster stats */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Total", value: teamMembers.length, color: "#C9A96E", bg: "rgba(201,169,110,0.08)" },
              { label: "Confirmed", value: confirmedCount, color: "#7E9E78", bg: "rgba(126,158,120,0.08)" },
              ...(pendingCount > 0 ? [{ label: "Pending", value: pendingCount, color: "#CDA88A", bg: "rgba(205,168,138,0.08)" }] : []),
              { label: "Departments", value: uniqueDepts.length, color: "#4A7FB5", bg: "rgba(74,127,181,0.08)" },
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
            {isFromNotion && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(139,150,196,0.08)", border: "1px solid rgba(139,150,196,0.2)" }}
              >
                <Database className="w-3 h-3" style={{ color: "#8B96C4" }} />
                <span className="text-[0.6875rem]" style={{ color: "#8B96C4", ...bodyFont }}>Live from Notion</span>
              </div>
            )}
          </div>

          {/* Search + department filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, role, or department"
                className="w-full h-10 pl-9 pr-4 bg-card rounded-xl text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 border border-border focus:outline-none focus:ring-2 focus:ring-gold/30"
                style={bodyFont}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDeptFilter("all")}
                className={`px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer ${
                  deptFilter === "all"
                    ? "bg-gold/15 text-gold border border-gold/30"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
                style={bodyFont}
              >
                All
              </button>
              {departments.filter((d) => uniqueDepts.includes(d.name)).map((dept) => (
                <button
                  key={dept.name}
                  onClick={() => setDeptFilter(deptFilter === dept.name ? "all" : dept.name)}
                  className={`px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer ${
                    deptFilter === dept.name
                      ? "border"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                  style={
                    deptFilter === dept.name
                      ? { backgroundColor: dept.bg, borderColor: `${dept.color}30`, color: dept.color, ...bodyFont }
                      : bodyFont
                  }
                >
                  {dept.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped roster */}
          <div className="space-y-3">
            {Object.entries(groupedRoster).map(([deptName, members]) => {
              const dept = departments.find((d) => d.name === deptName);
              const DeptIcon = dept?.icon || Users;
              const deptColor = dept?.color || "#6B7F8E";
              const isExpanded = expandedDept === null || expandedDept === deptName;

              return (
                <motion.div
                  key={deptName}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Department header */}
                  <button
                    onClick={() => setExpandedDept(expandedDept === deptName ? null : deptName)}
                    className="w-full px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: dept?.bg || "rgba(107,127,142,0.08)", border: `1px solid ${deptColor}20` }}
                    >
                      <DeptIcon className="w-4 h-4" style={{ color: deptColor }} />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-foreground text-[0.875rem]" style={headingFont}>{deptName}</span>
                    </div>
                    <span className="text-[0.6875rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${deptColor}12`, color: deptColor, ...bodyFont }}>
                      {members.length}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Members */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-border/40">
                          {members.map((member) => {
                            const sCfg = statusConfig[member.status];
                            const SIcon = sCfg.icon;
                            const MIcon = member.icon;
                            return (
                              <div
                                key={`${member.name}-${member.role}`}
                                className="px-5 py-3 flex items-center gap-3"
                              >
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${deptColor}08`, border: `1px solid ${deptColor}15` }}
                                >
                                  <MIcon className="w-4 h-4" style={{ color: deptColor }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-foreground text-[0.8125rem] truncate" style={bodyFont}>
                                      {member.name}
                                    </span>
                                  </div>
                                  <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                                    {member.role}
                                  </span>
                                  {member.note && (
                                    <p className="text-muted-foreground/50 text-[0.625rem] mt-0.5 italic" style={bodyFont}>
                                      {member.note}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] shrink-0"
                                  style={{ backgroundColor: `${sCfg.color}12`, color: sCfg.color, ...bodyFont }}
                                >
                                  <SIcon className="w-2.5 h-2.5" />
                                  {sCfg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {filteredRoster.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <User className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                No team members match your search.
              </p>
            </div>
          )}
        </>
      )}

      {/* ─── REGISTERED PROFILES TAB ────────────────────────────── */}
      {activeTab === "registered" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total", value: profiles.length, icon: Users, color: "#C9A96E" },
              { label: "Chefs", value: chefCount, icon: ChefHat, color: "#7E9E78" },
              { label: "Team", value: teamAppCount, icon: UserCheck, color: "#4A7FB5" },
              { label: "Leadership", value: leadershipCount, icon: Shield, color: "#CDA88A" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                  <span className="text-muted-foreground text-[0.6875rem] uppercase tracking-wider" style={bodyFont}>
                    {stat.label}
                  </span>
                </div>
                <span className="text-foreground text-[1.5rem]" style={headingFont}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name"
              className="w-full h-10 pl-9 pr-4 bg-card rounded-xl text-[0.8125rem] text-foreground placeholder:text-muted-foreground/40 border border-border focus:outline-none focus:ring-2 focus:ring-gold/30"
              style={bodyFont}
            />
          </div>

          {/* Profile list */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                <span className="text-muted-foreground text-[0.8125rem] ml-2" style={bodyFont}>
                  Loading profiles
                </span>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                  {searchQuery ? "No profiles match your search." : "No profiles registered yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {/* Table header */}
                <div className="px-5 py-2.5 bg-secondary/30 grid grid-cols-12 gap-3 text-[0.625rem] text-muted-foreground uppercase tracking-[0.15em]" style={bodyFont}>
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-3 hidden sm:block">Joined</div>
                  <div className="col-span-3 hidden sm:block">Last Active</div>
                </div>

                {/* Rows */}
                <AnimatePresence>
                  {filteredProfiles.map((p, i) => {
                    const avatar = getAvatar(p.avatarId);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="px-5 py-3 grid grid-cols-12 gap-3 items-center hover:bg-secondary/20 transition-colors"
                      >
                        {/* Name + avatar */}
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                            style={{ backgroundColor: avatar.bg }}
                          >
                            {avatar.emoji}
                          </div>
                          <div className="min-w-0">
                            <span className="text-foreground text-[0.8125rem] block truncate" style={bodyFont}>
                              {p.displayName}
                            </span>
                            <span className="text-muted-foreground/40 text-[0.5625rem] font-mono">
                              {p.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>

                        {/* Role */}
                        <div className="col-span-2">
                          <span
                            className="inline-flex items-center gap-1 text-[0.6875rem] px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: p.role === "leadership" ? "rgba(205,168,138,0.08)"
                                : p.role === "team" ? "rgba(74,127,181,0.08)"
                                : "rgba(126,158,120,0.08)",
                              color: p.role === "leadership" ? "#CDA88A"
                                : p.role === "team" ? "#4A7FB5"
                                : "#7E9E78",
                              ...bodyFont,
                            }}
                          >
                            {p.role === "leadership" ? <Shield className="w-2.5 h-2.5" /> : p.role === "team" ? <UserCheck className="w-2.5 h-2.5" /> : <ChefHat className="w-2.5 h-2.5" />}
                            {p.role === "leadership" ? "Lead" : p.role === "team" ? "Team" : "Chef"}
                          </span>
                        </div>

                        {/* Joined */}
                        <div className="col-span-3 hidden sm:flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground/30" />
                          <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                            {formatDate(p.createdAt)}
                          </span>
                        </div>

                        {/* Last active */}
                        <div className="col-span-3 hidden sm:flex items-center gap-1.5">
                          <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                            {formatDate(p.lastActive)}
                          </span>
                          {p.onboardingCompleted && (
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: "#7E9E78" }}
                              title="Onboarding completed"
                            />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}