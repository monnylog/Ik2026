import { useState } from "react";
import { motion } from "motion/react";
import {
  Heart,
  Users,
  MessageCircle,
  Calendar,
  Sparkles,
  ChefHat,
  Briefcase,
  Link as LinkIcon,
  ArrowLeft,
  Search,
  Copy,
  Check,
  ArrowRight,
  Mic,
  BookOpen,
  Phone,
  Circle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import type { ViewMode } from "./onboarding/use-auth";

import { bodyFont, headingFont } from "../lib/fonts";

interface CommunityPageProps {
  role: UserRole;
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  viewMode?: ViewMode;
}

interface Participant {
  name: string;
  type: "chef" | "team";
  city: string;
  tag: string;
  online?: boolean;
}

const participants: Participant[] = [
  { name: "Chef Dio Buan", type: "chef", city: "Las Vegas, NV", tag: "Course 1", online: true },
  { name: "Chef Rachel Barril", type: "chef", city: "Alaska", tag: "Course 2", online: false },
  { name: "Chef Justin Barnes", type: "chef", city: "Hawaii", tag: "Course 3", online: true },
  { name: "Chef Patrice Cleary", type: "chef", city: "Washington D.C.", tag: "Course 4", online: false },
  { name: "Chef Aaron Versoza", type: "chef", city: "Seattle, WA", tag: "Course 5", online: true },
  { name: "Chef Christina Q.", type: "chef", city: "New Orleans, LA", tag: "Course 6", online: false },
  { name: "Chef Lord Maynard", type: "chef", city: "California", tag: "Course 7", online: true },
  { name: "Monica Blanco", type: "team", city: "Las Vegas, NV", tag: "Co-Owner / EP", online: true },
  { name: "Walbert Castillo", type: "team", city: "Las Vegas, NV", tag: "Co-Owner / EP", online: true },
  { name: "Ayce Mangapit", type: "team", city: "Las Vegas, NV", tag: "Creative Director", online: false },
  { name: "JJ Mayang", type: "team", city: "Las Vegas, NV", tag: "Day-of Coord", online: true },
  { name: "Christine Antonio", type: "team", city: "Las Vegas, NV", tag: "Project Mgr", online: true },
  { name: "Ava Carino", type: "team", city: "Las Vegas, NV", tag: "Food Historian", online: false },
  { name: "Flerine Cruz Atienza", type: "team", city: "Las Vegas, NV", tag: "EP / PR", online: true },
  { name: "Andrew", type: "team", city: "Las Vegas, NV", tag: "Research Lead", online: false },
];

const connectionCards = [
  { title: "West Coast Roots", description: "5 participants based on the Pacific coast", members: ["Chef Aaron Versoza", "Chef Lord Maynard", "Chef Dio Buan"] },
  { title: "First-Time Collaborators", description: "4 chefs cooking together for the first time", members: ["Chef Rachel Barril", "Chef Justin Barnes", "Chef Patrice Cleary", "Chef Christina Q."] },
  { title: "Storytelling Enthusiasts", description: "Interested in leading talks or demos", members: ["Chef Aaron Versoza", "Chef Christina Q.", "Ava Carino"] },
];

const commonThreads = [
  { group: "Island Heritage", count: 3, description: "Chefs with roots in island communities" },
  { group: "Immigrant Kitchen", count: 5, description: "Stories of adapting recipes to new landscapes" },
  { group: "Community Hosts", count: 2, description: "Opening their homes to visiting chefs" },
];

const icebreakers = [
  "What's a dish you make that belongs to two places at the same time?",
  "What Filipino dish do you not know how to make?",
  "What flavor do you find yourself explaining most to people who didn't grow up with it?",
];

function getCountdown() {
  const eventDate = new Date("2026-05-22T00:00:00");
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  const remainDays = days % 30;
  return { months, days: remainDays, totalDays: days };
}

export function CommunityPage({ role, onBack, onNavigate, viewMode }: CommunityPageProps) {
  const isTeamView = viewMode === "team" || (role === "team" && viewMode !== "leadership");

  if (isTeamView) {
    return <CommunityTeamView onBack={onBack} onNavigate={onNavigate} />;
  }

  return <CommunityFullView role={role} onBack={onBack} onNavigate={onNavigate} />;
}

/* ========== TEAM VIEW: Clean Contact Directory ========== */
function CommunityTeamView({
  onBack,
  onNavigate,
}: {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q)
    );
  });

  const getInitials = (name: string) => {
    const parts = name.replace(/^Chef\s+/, "").split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : parts[0].substring(0, 2);
  };

  return (
    <div className="space-y-6" role="region" aria-label="Team Directory">
      {/* Back button */}
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer min-h-[44px]"
            style={{ border: "1px solid var(--border)", ...bodyFont }}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            <span className="text-[0.875rem] text-muted-foreground">Dashboard</span>
          </button>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <Users className="w-6 h-6" style={{ color: "#4A7FB5" }} aria-hidden="true" />
          <h1 className="text-foreground" style={{ ...headingFont, fontSize: "1.625rem" }}>
            Team Directory
          </h1>
        </div>
        <p className="text-muted-foreground text-[1rem] leading-relaxed" style={bodyFont}>
          Chefs, crew, and collaborators on the IK26 team.
        </p>
      </motion.div>

      {/* Large search bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
      >
        <label htmlFor="team-search" className="sr-only">
          Search team members by name, city, or role
        </label>
        <div
          className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 min-h-[52px]"
          style={{
            border: "2px solid var(--border)",
          }}
        >
          <Search className="w-5 h-5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
          <input
            id="team-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or role..."
            className="flex-1 bg-transparent text-[1rem] text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-w-0"
            style={bodyFont}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-muted-foreground/50 text-[0.875rem] cursor-pointer px-2 py-1 rounded-lg min-h-[44px] flex items-center"
              style={bodyFont}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-muted-foreground/50 text-[0.8125rem] mt-2" style={bodyFont}>
          {filtered.length} of {participants.length} people
        </p>
      </motion.div>

      {/* Contact cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" role="list" aria-label="Team members">
        {filtered.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3 py-12 text-center">
            <p className="text-muted-foreground/40 text-[1rem]" style={bodyFont}>
              No matching people found.
            </p>
          </div>
        )}
        {filtered.map((person, idx) => (
          <motion.article
            key={person.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + idx * 0.025 }}
            className="bg-card rounded-xl p-5 flex flex-col items-center text-center gap-3"
            style={{ border: "1px solid var(--border)" }}
            role="listitem"
            aria-label={`${person.name}, ${person.tag}. ${person.online ? "Online" : "Offline"}`}
          >
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[1.125rem] font-semibold"
                style={{
                  backgroundColor: person.type === "chef"
                    ? "rgba(201,169,110,0.12)"
                    : "rgba(74,127,181,0.12)",
                  color: person.type === "chef" ? "#C9A96E" : "#4A7FB5",
                  border: person.type === "chef"
                    ? "2px solid rgba(201,169,110,0.2)"
                    : "2px solid rgba(74,127,181,0.2)",
                  ...headingFont,
                }}
              >
                {getInitials(person.name)}
              </div>
              {/* Online/Offline indicator - icon + color, not color alone */}
              <div
                className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--card)",
                  border: "2px solid var(--card)",
                }}
                aria-hidden="true"
              >
                {person.online ? (
                  <CheckCircle2
                    className="w-4 h-4"
                    style={{ color: "#7E9E78" }}
                  />
                ) : (
                  <Circle
                    className="w-4 h-4"
                    style={{ color: "#9CA3AF" }}
                  />
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <h3 className="text-foreground text-[1rem]" style={headingFont}>
                {person.name}
              </h3>
              <p className="text-muted-foreground text-[0.875rem] mt-0.5" style={bodyFont}>
                {person.tag}
              </p>
              <p className="text-muted-foreground/60 text-[0.8125rem]" style={bodyFont}>
                {person.city}
              </p>
              <span
                className="inline-flex items-center gap-1 text-[0.75rem] mt-1"
                style={{
                  color: person.online ? "#7E9E78" : "#9CA3AF",
                  ...bodyFont,
                }}
              >
                {person.online ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    Online
                  </>
                ) : (
                  <>
                    <Circle className="w-3 h-3" aria-hidden="true" />
                    Offline
                  </>
                )}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 w-full mt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate?.("Comms")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer min-h-[44px]"
                style={{
                  backgroundColor: "rgba(26,92,56,0.08)",
                  border: "1px solid rgba(26,92,56,0.15)",
                  ...bodyFont,
                }}
                aria-label={`Message ${person.name}`}
              >
                <MessageCircle className="w-4 h-4" style={{ color: "#1A5C38" }} />
                <span className="text-[0.8125rem]" style={{ color: "#1A5C38" }}>Chat</span>
              </motion.button>
            </div>
          </motion.article>
        ))}
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
            onClick={() => onNavigate("Comms")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: "rgba(26,92,56,0.06)",
              border: "1px solid rgba(26,92,56,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Team Comms"
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#1A5C38" }} />
            <span className="text-[0.875rem]" style={{ color: "#1A5C38" }}>Team Comms</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#1A5C38", opacity: 0.5 }} />
          </button>
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
            <Users className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.875rem]" style={{ color: "#7E9E78" }}>Chef Roster</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ========== FULL VIEW (Leadership / Chef) ========== */
function CommunityFullView({
  role,
  onBack,
  onNavigate,
}: {
  role: UserRole;
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}) {
  const countdown = getCountdown();
  const showAll = role === "leadership";
  const showConnections = true;

  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterFilter, setRosterFilter] = useState<"all" | "chef" | "team">("all");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const baseParticipants = role === "chef"
    ? participants.filter((p) => p.type === "chef")
    : participants;

  const visibleParticipants = baseParticipants.filter((p) => {
    const matchesFilter = rosterFilter === "all" || p.type === rosterFilter;
    const matchesSearch = !rosterSearch ||
      p.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      p.city.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      p.tag.toLowerCase().includes(rosterSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const chefCount = baseParticipants.filter((p) => p.type === "chef").length;
  const teamCount = baseParticipants.filter((p) => p.type === "team").length;

  const handleCopyPrompt = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      {onBack && (
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer group"
            style={{ border: "1px solid var(--border)" }}
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
              Dashboard
            </span>
          </button>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-5 h-5 text-gold" />
          <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
            Community
          </h2>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          Participant roster and team connections for IK26.
        </p>
      </motion.div>

      {/* Before We Gather - Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="bg-card rounded-xl p-5 flex items-center gap-5"
        style={{ border: "1px solid rgba(205,168,138,0.2)" }}
      >
        <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-foreground text-[0.9375rem] mb-0.5" style={headingFont}>
            Before We Gather
          </h3>
          <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
            <span className="text-gold">{countdown.months} months, {countdown.days} days</span> until the event.
          </p>
        </div>
      </motion.div>

      {/* Meet the Table & Connections side by side on larger screens */}
      <div className={`grid gap-6 ${showConnections ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Meet the Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h3 className="text-foreground" style={headingFont}>
              Meet the Table
            </h3>
            <span className="ml-auto text-muted-foreground text-[0.8125rem]" style={bodyFont}>
              {visibleParticipants.length} people
            </span>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 mb-3">
            <Search className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
            <input
              type="text"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              placeholder="Search by name, city, or role..."
              className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
              style={bodyFont}
              aria-label="Search participants"
            />
            {rosterSearch && (
              <button
                onClick={() => setRosterSearch("")}
                className="text-muted-foreground/30 text-[0.75rem] cursor-pointer"
                style={bodyFont}
                aria-label="Clear search"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter pills */}
          {role === "leadership" && (
            <div className="flex gap-1.5 mb-3">
              {([
                { id: "all" as const, label: "All", count: baseParticipants.length },
                { id: "chef" as const, label: "Chefs", count: chefCount },
                { id: "team" as const, label: "Team", count: teamCount },
              ]).map((f) => {
                const isActive = rosterFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setRosterFilter(isActive && f.id !== "all" ? "all" : f.id)}
                    className="text-[0.625rem] px-2.5 py-1 rounded-full cursor-pointer"
                    style={{
                      backgroundColor: isActive ? "rgba(201,169,110,0.15)" : "transparent",
                      border: `1px solid ${isActive ? "rgba(201,169,110,0.3)" : "var(--border)"}`,
                      color: isActive ? "#C9A96E" : "var(--muted-foreground)",
                      ...bodyFont,
                    }}
                    aria-pressed={isActive}
                  >
                    {f.label} ({f.count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Participant list */}
          <div className="space-y-2">
            {visibleParticipants.length === 0 && (
              <p className="text-muted-foreground/40 text-[0.75rem] text-center py-6" style={bodyFont}>
                {rosterSearch ? "No matching participants." : "No participants to show."}
              </p>
            )}
            {visibleParticipants.map((person, idx) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-default"
                style={{ backgroundColor: "rgba(221,207,195,0.3)" }}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  person.type === "chef" ? "bg-gold/10 border border-gold/20" : "bg-info/10 border border-info/20"
                }`}>
                  {person.type === "chef" ? <ChefHat className="w-4 h-4 text-gold" /> : <Briefcase className="w-4 h-4 text-info" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-[0.8125rem] truncate" style={bodyFont}>{person.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[0.6875rem] truncate" style={bodyFont}>{person.city}</span>
                    <span className="text-muted-foreground/30">&middot;</span>
                    <span className={`text-[0.6875rem] ${person.type === "chef" ? "text-gold" : "text-info"}`} style={bodyFont}>{person.tag}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Connection Cards */}
        {showConnections && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="rounded-xl p-5"
            style={{
              border: "1px solid rgba(205,168,138,0.2)",
              background: "linear-gradient(135deg, rgba(205,168,138,0.03), rgba(205,168,138,0.08))",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              <h3 className="text-foreground" style={headingFont}>
                Connections
              </h3>
              <LinkIcon className="w-3.5 h-3.5 text-gold/60 ml-1" />
            </div>
            <p className="text-muted-foreground text-[0.8125rem] mb-4" style={bodyFont}>
              Identified shared backgrounds and interests.
            </p>

            <div className="space-y-3">
              {connectionCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.06 }}
                  className="p-4 rounded-xl bg-card"
                  style={{ border: "1px solid rgba(205,168,138,0.15)" }}
                >
                  <h4 className="text-foreground text-[0.875rem] mb-1" style={headingFont}>
                    {card.title}
                  </h4>
                  <p className="text-muted-foreground text-[0.75rem] mb-2.5" style={bodyFont}>{card.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {card.members.map((m) => (
                      <span key={m} className="text-[0.6875rem] bg-gold/8 text-gold px-2 py-0.5 rounded-full" style={bodyFont}>{m}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Common Threads */}
            {showAll && (
              <div className="mt-5 pt-4 border-t border-gold/10">
                <h4 className="text-foreground text-[0.875rem] mb-3" style={headingFont}>Common Threads</h4>
                <div className="space-y-2">
                  {commonThreads.map((thread, idx) => (
                    <motion.div
                      key={thread.group}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + idx * 0.05 }}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-card border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-gold" />
                        </div>
                        <div>
                          <p className="text-foreground text-[0.8125rem]" style={bodyFont}>{thread.group}</p>
                          <p className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>{thread.description}</p>
                        </div>
                      </div>
                      <span className="text-gold text-[0.8125rem] shrink-0 ml-3" style={bodyFont}>{thread.count}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Icebreaker Prompts */}
      {showConnections && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="rounded-xl p-5"
          style={{ background: "linear-gradient(to bottom, rgba(192,209,177,0.15), rgba(205,168,138,0.08))", border: "1px solid rgba(205,168,138,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-gold" />
            <h3 className="text-foreground" style={headingFont}>
              Discussion Prompts
            </h3>
          </div>
          <p className="text-muted-foreground text-[0.8125rem] mb-4" style={bodyFont}>
            From the research questionnaire. Reference for pre-event conversation.
          </p>
          <div className="space-y-3">
            {icebreakers.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.06 }}
                className="flex gap-3 p-3 rounded-lg bg-white/60 border border-white/30 group"
              >
                <MessageCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <p className="text-foreground text-[0.8125rem] leading-relaxed flex-1" style={headingFont}>
                  {q}
                </p>
                <button
                  onClick={() => handleCopyPrompt(q, idx)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Copy prompt"
                  aria-label={`Copy prompt: ${q.substring(0, 30)}...`}
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3 h-3" style={{ color: "#325B34" }} />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground/40" />
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Discord Community CTA */}
      <motion.a
        href="https://discord.gg/eQyaK4Pd"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.4 }}
        whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(88,101,242,0.12)" }}
        className="block rounded-xl p-5"
        style={{
          background: "linear-gradient(135deg, rgba(88,101,242,0.06), rgba(88,101,242,0.02))",
          border: "1px solid rgba(88,101,242,0.15)",
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(88,101,242,0.1)" }}
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.074.074 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground text-[0.9375rem] mb-0.5" style={headingFont}>
              Join our Discord
            </h3>
            <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
              Real-time voice channels, event updates, and community discussions.
            </p>
          </div>
          <ExternalLink className="w-4 h-4 shrink-0" style={{ color: "#5865F2", opacity: 0.6 }} />
        </div>
      </motion.a>

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Comms")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(26,92,56,0.06)",
              border: "1px solid rgba(26,92,56,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Team Comms"
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#1A5C38" }} />
            <span className="text-[0.8125rem]" style={{ color: "#1A5C38" }}>Team Comms</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#1A5C38", opacity: 0.5 }} />
          </button>
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
            <Users className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.875rem]" style={{ color: "#7E9E78" }}>Chef Roster</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Our Istoryas")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Our Istoryas"
          >
            <Mic className="w-4 h-4" style={{ color: "#C9A96E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#C9A96E" }}>Our Istoryas</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#C9A96E", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}