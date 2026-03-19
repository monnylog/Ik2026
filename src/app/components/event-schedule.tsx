import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { bodyFont, headingFont } from "../lib/fonts";
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Loader2,
  ChevronDown,
  CalendarDays,
  CalendarPlus,
  UtensilsCrossed,
  Users,
  Camera,
  Music,
  Mic,
  PartyPopper,
  Coffee,
  Truck,
  Wrench,
  Sparkles,
  ArrowRight,
  Tag,
  Printer,
  Download,
  FileText,
  Leaf,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { useEventSchedule, type ScheduleEntry } from "../lib/notion-domain-hooks";
import { createCalendarLinkLocal } from "../lib/api-tools";

// Convert "7:00 AM" → "07:00:00" for ISO date construction
function parseTimeToISO(time: string): string {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "00:00:00";
  let h = parseInt(match[1]);
  const m = match[2];
  const p = match[3].toUpperCase();
  if (p === "PM" && h !== 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}:00`;
}

type ScheduleStatus = "completed" | "active" | "upcoming";

interface ScheduleBlock {
  id: string;
  time: string;
  endTime: string;
  title: string;
  description: string;
  team: string;
  location: string;
  status: ScheduleStatus;
  icon: typeof Clock;
  color: string;
  details?: string[];
}

const scheduleBlocks: ScheduleBlock[] = [
  {
    id: "s1",
    time: "7:00 AM",
    endTime: "8:30 AM",
    title: "Venue Doors Open & Setup Begins",
    description: "Production team arrives for venue preparation. Lighting, AV, and table setup.",
    team: "Production + Ops Team",
    location: "KMA Event Center, Main Hall",
    status: "completed",
    icon: Wrench,
    color: "#4A7FB5",
    details: [
      "Confirm AV system and mic checks",
      "Set up 25 round tables (8-top configuration)",
      "Stage backdrop and signage installation",
      "Lighting cue walkthrough with technician",
    ],
  },
  {
    id: "s2",
    time: "8:30 AM",
    endTime: "9:30 AM",
    title: "Kitchen Station Setup",
    description: "Chefs arrive and set up individual kitchen stations. Equipment verification and ingredient staging.",
    team: "All 7 Chefs + Kitchen Staff",
    location: "KMA Event Center, Kitchen Wing",
    status: "completed",
    icon: UtensilsCrossed,
    color: "#7E9E78",
    details: [
      "Assign station numbers per course",
      "Verify portable kamado grill (Chef Lord Maynard)",
      "Staging area for ingredient mise en place",
      "Confirm plating supply — plates, garnish, tools",
    ],
  },
  {
    id: "s3",
    time: "9:30 AM",
    endTime: "10:30 AM",
    title: "Chef Briefing & Run-Through",
    description: "Full team briefing: course timing, plating standards, service flow, and emergency protocols.",
    team: "Maria Santos + All Chefs",
    location: "Kitchen Wing, Briefing Area",
    status: "completed",
    icon: Users,
    color: "#C49370",
    details: [
      "Review course-by-course timing sheet",
      "Confirm dietary accommodation protocols",
      "Emergency contact & fire safety review",
      "Group photo opportunity",
    ],
  },
  {
    id: "s4",
    time: "10:30 AM",
    endTime: "1:00 PM",
    title: "Prep Begins — All Courses",
    description: "Chefs begin full preparation for their respective courses. Sous chefs assist with mise en place.",
    team: "All Chefs + 12 Kitchen Volunteers",
    location: "Kitchen Wing, Stations 1-8",
    status: "active",
    icon: UtensilsCrossed,
    color: "#D4A843",
    details: [
      "Course 1: Kare-Kare base & oxtail smoking (Chef Dio)",
      "Course 2: Salmon curing & sinigang broth (Chef Rachel)",
      "Course 7: Crispy Pata scoring & charcoal prep (Chef Lord)",
      "Course 8: Ube panna cotta setting (Chef Marco)",
    ],
  },
  {
    id: "s5",
    time: "1:00 PM",
    endTime: "2:00 PM",
    title: "Staff Meal & Final Check",
    description: "Team lunch break. Final walkthrough of dining room, place cards, and printed materials.",
    team: "Full Team",
    location: "Staff Area + Main Hall",
    status: "upcoming",
    icon: Coffee,
    color: "#6B7F8E",
    details: [
      "Family-style staff meal provided by venue",
      "Place card distribution — verify seating chart",
      "Final print materials check (menus, programs)",
      "FOH staff uniform check",
    ],
  },
  {
    id: "s6",
    time: "2:00 PM",
    endTime: "4:00 PM",
    title: "Final Prep & Plating Rehearsal",
    description: "Final cooking push and plating rehearsal for all courses. Photography team sets up for food shots.",
    team: "All Chefs + Luisa Mabini (Photo)",
    location: "Kitchen Wing + Photo Station",
    status: "upcoming",
    icon: Camera,
    color: "#C49370",
    details: [
      "Plating rehearsal — one plate per course",
      "Luisa shoots hero images of each dish",
      "Sauce reductions and final seasoning",
      "Dessert tempering and garnish prep",
    ],
  },
  {
    id: "s7",
    time: "4:30 PM",
    endTime: "5:00 PM",
    title: "FOH Team Huddle",
    description: "Front-of-house staff briefing: service flow, wine pairings, allergy protocol, VIP table assignments.",
    team: "FOH Lead + 20 Servers",
    location: "Main Hall, Stage Area",
    status: "upcoming",
    icon: Users,
    color: "#4A7FB5",
    details: [
      "Walkthrough of 7-course service flow",
      "Wine pairing cue sheet distributed",
      "Allergy protocol and table flags review",
      "VIP host table assignments",
    ],
  },
  {
    id: "s8",
    time: "5:00 PM",
    endTime: "6:00 PM",
    title: "Guest Arrival & Cocktail Hour",
    description: "Doors open for guests. Welcome cocktails, live music, and gallery display of chef stories.",
    team: "FOH Team + Bartender",
    location: "Main Hall, Lobby & Lounge",
    status: "upcoming",
    icon: PartyPopper,
    color: "#D4A843",
    details: [
      "Welcome cocktail: Calamansi Collins",
      "Live acoustic set — Filipino folk fusion",
      "Photo wall and Istorya story display",
      "Seating guide distribution",
    ],
  },
  {
    id: "s9",
    time: "6:00 PM",
    endTime: "9:00 PM",
    title: "Dinner Service — 7 Courses",
    description: "The main event. Seven-course progressive dinner tracing Filipino-American history from 1587 to today.",
    team: "All Chefs + Full FOH Team",
    location: "Main Hall, Dining Area",
    status: "upcoming",
    icon: UtensilsCrossed,
    color: "#7E9E78",
    details: [
      "Course 1 (6:15): Kare-Kare — Chef Dio (1911, Las Vegas)",
      "Course 2 (6:35): Smoked Salmon Sinigang — Chef Rachel (1911, Alaska)",
      "Course 3 (6:55): Lechon Belly — Chef Justin (1906, Hawaii)",
      "Course 4 (7:20): Bibingka Soufflé — Chef Patrice (1903, D.C.)",
      "Course 5 (7:45): Pacific NW Tinola — Chef Aaron (1883, Seattle)",
      "Course 6 (8:10): Shrimp & Bagoong Étouffée — Chef Christina (1763, NOLA)",
      "Course 7 (8:35): Galleon-Spiced Crispy Pata — Chef Lord (1587, CA)",
    ],
  },
  {
    id: "s10",
    time: "9:00 PM",
    endTime: "9:30 PM",
    title: "Dessert & Chef Introductions",
    description: "Collaborative dessert course by Chef Marco. Each chef introduced with their story and historical era.",
    team: "Chef Marco + MC",
    location: "Main Hall, Stage",
    status: "upcoming",
    icon: Mic,
    color: "#C49370",
    details: [
      "Course 8: Ube Panna Cotta with Calamansi Caramel — Chef Marco",
      "MC introduces each chef by course/era",
      "Standing ovation moment",
      "Group toast — Mabuhay!",
    ],
  },
  {
    id: "s11",
    time: "9:30 PM",
    endTime: "10:30 PM",
    title: "Closing Celebration & After-Party",
    description: "Live music, open bar, and mingling. Photo ops with chefs. Gratitude wall signing.",
    team: "Full Team + DJ",
    location: "Main Hall + Lounge",
    status: "upcoming",
    icon: Music,
    color: "#D4A843",
    details: [
      "DJ set — OPM (Original Pilipino Music) + modern",
      "Gratitude wall — guests leave messages",
      "Chef meet-and-greet photo station",
      "Social media live posts",
    ],
  },
  {
    id: "s12",
    time: "10:30 PM",
    endTime: "12:00 AM",
    title: "Teardown & Wrap",
    description: "Production team breakdown. Equipment return, kitchen cleanup, and venue handoff.",
    team: "Production + Ops Team",
    location: "KMA Event Center",
    status: "upcoming",
    icon: Truck,
    color: "#6B7F8E",
    details: [
      "Kitchen station breakdown and cleanup",
      "Equipment inventory and return",
      "Venue inspection and handoff",
      "Team debrief and thank-yous",
    ],
  },
];

const statusConfig: Record<ScheduleStatus, { label: string; color: string; bg: string; borderColor: string }> = {
  completed: { label: "Completed", color: "#7E9E78", bg: "rgba(126,158,120,0.1)", borderColor: "rgba(126,158,120,0.25)" },
  active: { label: "In Progress", color: "#D4A843", bg: "rgba(212,168,67,0.1)", borderColor: "rgba(212,168,67,0.3)" },
  upcoming: { label: "Upcoming", color: "#6B7F8E", bg: "rgba(107,127,142,0.06)", borderColor: "rgba(107,127,142,0.15)" },
};

interface EventScheduleProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function EventSchedule({ role, onNavigate }: EventScheduleProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | "all">("all");

  const { schedule: notionSchedule, isLoading: scheduleLoading } = useEventSchedule();
  const isFromNotion = notionSchedule.length > 0;

  function entryToBlock(e: ScheduleEntry): ScheduleBlock {
    const status: ScheduleStatus = e.status === "completed" ? "completed" : e.status === "active" ? "active" : "upcoming";
    return {
      id: e.id,
      time: e.time,
      endTime: e.endTime || "",
      title: e.activity,
      description: e.notes || "",
      team: e.owner || "",
      location: e.location || "",
      status,
      icon: Clock,
      color: status === "completed" ? "#7E9E78" : status === "active" ? "#D4A843" : "#6B7F8E",
      details: [],
    };
  }

  const activeSchedule: ScheduleBlock[] = notionSchedule.length > 0
    ? notionSchedule.map(entryToBlock)
    : scheduleBlocks;

  const filtered = filterStatus === "all"
    ? activeSchedule
    : activeSchedule.filter((b) => b.status === filterStatus);

  const completedCount = activeSchedule.filter((b) => b.status === "completed").length;
  const activeBlock = activeSchedule.find((b) => b.status === "active");

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    const html = `<!DOCTYPE html>
<html><head><title>IK26 — Event Day Schedule</title>
<link href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #2B4440; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #C49370; padding-bottom: 20px; }
  .header h1 { font-size: 28px; color: #2B4440; margin-bottom: 4px; letter-spacing: 0.5px; }
  .header .subtitle { font-size: 13px; color: #6B7F8E; margin-top: 6px; }
  .header .date { font-size: 15px; color: #5C7256; font-weight: 600; margin-top: 4px; }
  .block { display: flex; gap: 16px; padding: 14px 0; border-bottom: 1px solid #E6E0D2; }
  .block:last-child { border-bottom: none; }
  .time-col { width: 110px; flex-shrink: 0; }
  .time-col .time { font-size: 13px; font-weight: 700; color: #2B4440; }
  .time-col .end { font-size: 11px; color: #6B7F8E; }
  .content { flex: 1; }
  .content h3 { font-size: 14px; font-weight: 600; color: #2B4440; margin-bottom: 3px; }
  .content .desc { font-size: 12px; color: #6B7F8E; line-height: 1.5; margin-bottom: 6px; }
  .meta { display: flex; gap: 16px; font-size: 11px; color: #8A9A82; }
  .details { margin-top: 8px; padding-left: 12px; }
  .details li { font-size: 11px; color: #5C7256; line-height: 1.6; list-style: disc; }
  .status { display: inline-block; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
  .status-completed { background: #E8F0E0; color: #5C7256; }
  .status-active { background: #FFF3D4; color: #D4A843; }
  .status-upcoming { background: #E8EDF2; color: #6B7F8E; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #C49370; text-align: center; font-size: 11px; color: #8A9A82; }
  .footer strong { color: #2B4440; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<div class="header">
  <h1>ISANG KUSINA 2026</h1>
  <div class="date">June 14, 2026 — Event Day Run of Show</div>
  <div class="subtitle">KMA Event Center, Las Vegas &bull; 7:00 AM – 12:00 AM</div>
</div>
${activeSchedule.map((b) => `
<div class="block">
  <div class="time-col">
    <div class="time">${b.time}</div>
    <div class="end">to ${b.endTime}</div>
  </div>
  <div class="content">
    <h3>${b.title}<span class="status status-${b.status}">${statusConfig[b.status].label}</span></h3>
    <div class="desc">${b.description}</div>
    <div class="meta">
      <span>👤 ${b.team}</span>
      <span>📍 ${b.location}</span>
    </div>
    ${b.details ? `<ul class="details">${b.details.map((d) => `<li>${d}</li>`).join("")}</ul>` : ""}
  </div>
</div>`).join("")}
<div class="footer">
  <strong>Isang Kusina 2026</strong> — Collaborative Filipino Chefs Dinner<br/>
  Printed on ${(() => { const d = new Date(); d.setFullYear(2026); return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); })()}
  &bull; Confidential — Team Use Only
</div>
</body></html>`;
    printWin.document.write(html);
    printWin.document.close();
    setTimeout(() => printWin.print(), 400);
  };

  // Export schedule as CSV
  const exportScheduleCSV = () => {
    const headers = ["Time", "End Time", "Title", "Description", "Team", "Location", "Status"];
    const rows = activeSchedule.map((b) => [
      b.time,
      b.endTime,
      `"${b.title}"`,
      `"${b.description.replace(/"/g, '""')}"`,
      `"${b.team}"`,
      `"${b.location}"`,
      statusConfig[b.status].label,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-schedule-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Event Day Schedule
            </h2>
            <NotionSyncBadge isLive={isFromNotion} compact />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportScheduleCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] cursor-pointer transition-colors"
              style={{
                backgroundColor: "rgba(212,168,67,0.08)",
                color: "#D4A843",
                border: "1px solid rgba(212,168,67,0.2)",
                ...bodyFont,
              }}
              aria-label="Export schedule as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[0.75rem] cursor-pointer transition-colors print:hidden"
              style={{
                backgroundColor: "rgba(43,68,64,0.06)",
                border: "1px solid rgba(43,68,64,0.12)",
                color: "#2B4440",
                ...bodyFont,
              }}
            >
              <Printer className="w-3.5 h-3.5" />
              Print Schedule
            </motion.button>
            <span
              className="text-[0.6875rem] px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(212,168,67,0.1)", color: "#D4A843", ...bodyFont }}
            >
              {activeSchedule.length} blocks
            </span>
            <span
              className="text-[0.6875rem] px-2.5 py-1 rounded-full"
              style={{ backgroundColor: "rgba(126,158,120,0.1)", color: "#7E9E78", ...bodyFont }}
            >
              {completedCount} done
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          June 14, 2026 &middot; KMA Event Center, Las Vegas &middot; Full event day run of show.
        </p>
      </motion.div>

      {/* Currently Active block highlight */}
      {activeBlock && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="p-4 rounded-xl"
          style={{
            background: "linear-gradient(135deg, rgba(212,168,67,0.06), rgba(196,147,112,0.04))",
            border: "1px solid rgba(212,168,67,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#D4A843" }} />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: "#D4A843", opacity: 0.3 }} />
            </div>
            <span className="text-[0.6875rem] uppercase tracking-wider" style={{ color: "#D4A843", ...bodyFont }}>
              Currently Active
            </span>
          </div>
          <p className="text-foreground text-[0.9375rem]" style={{ ...bodyFont, fontWeight: 600 }}>
            {activeBlock.time} — {activeBlock.title}
          </p>
          <p className="text-muted-foreground text-[0.75rem] mt-0.5" style={bodyFont}>
            {activeBlock.team} &middot; {activeBlock.location}
          </p>
        </motion.div>
      )}

      {/* Horizontal Timeline Strip — compact bird's-eye view */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4 }}
        className="bg-card rounded-xl p-4 overflow-hidden"
        style={{ border: "1px solid rgba(196,147,112,0.1)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
            7:00 AM
          </span>
          <span className="text-[0.6875rem] text-muted-foreground/40 uppercase tracking-wider" style={bodyFont}>
            Day at a Glance
          </span>
          <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
            12:00 AM
          </span>
        </div>
        <div className="flex gap-[2px] h-10 rounded-lg overflow-hidden">
          {activeSchedule.map((block, idx) => {
            const sCfg = statusConfig[block.status];
            // Calculate proportional width based on time span
            const parseTime = (t: string) => {
              const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (!match) return 0;
              let h = parseInt(match[1]);
              const m = parseInt(match[2]);
              const ampm = match[3].toUpperCase();
              if (ampm === "PM" && h !== 12) h += 12;
              if (ampm === "AM" && h === 12) h = 24; // midnight
              return h * 60 + m;
            };
            const start = parseTime(block.time);
            const end = parseTime(block.endTime);
            const totalMinutes = 17 * 60; // 7 AM to midnight
            const blockMinutes = Math.max(end - start, 30);
            const widthPct = (blockMinutes / totalMinutes) * 100;

            return (
              <motion.button
                key={block.id}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                onClick={() => {
                  setFilterStatus("all");
                  setExpandedBlock(expandedBlock === block.id ? null : block.id);
                  // Scroll to block
                  const el = document.getElementById(`schedule-block-${block.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="relative h-full rounded-md flex items-center justify-center cursor-pointer transition-all group"
                style={{
                  width: `${widthPct}%`,
                  minWidth: "1.5rem",
                  backgroundColor: block.status === "active"
                    ? "rgba(212,168,67,0.2)"
                    : block.status === "completed"
                    ? "rgba(126,158,120,0.15)"
                    : "rgba(107,127,142,0.06)",
                  borderLeft: `2px solid ${sCfg.color}`,
                }}
                title={`${block.time} — ${block.title}`}
              >
                {block.status === "active" && (
                  <div
                    className="absolute inset-0 rounded-md animate-pulse"
                    style={{ backgroundColor: "rgba(212,168,67,0.08)" }}
                  />
                )}
                <span
                  className="text-[0.5rem] font-medium truncate px-1 relative z-10 opacity-60 group-hover:opacity-100 transition-opacity hidden sm:block"
                  style={{ color: sCfg.color, ...bodyFont }}
                >
                  {block.title.length > 12 ? block.title.slice(0, 12) + "\u2026" : block.title}
                </span>
              </motion.button>
            );
          })}
        </div>
        {/* Progress indicator */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(196,147,112,0.06)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / activeSchedule.length) * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7E9E78, #D4A843)" }}
            />
          </div>
          <span className="text-[0.6875rem] text-muted-foreground/50 shrink-0" style={bodyFont}>
            {completedCount}/{activeSchedule.length} complete
          </span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
        className="flex flex-wrap items-center gap-2"
      >
        {(["all", "completed", "active", "upcoming"] as const).map((s) => {
          const isActive = filterStatus === s;
          const cfg = s !== "all" ? statusConfig[s] : null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(isActive ? "all" : s)}
              className={`px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors cursor-pointer ${
                isActive ? "border" : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
              }`}
              style={
                isActive && cfg
                  ? { backgroundColor: cfg.bg, borderColor: cfg.borderColor, color: cfg.color, ...bodyFont }
                  : isActive
                  ? { backgroundColor: "rgba(212,168,67,0.12)", borderColor: "rgba(212,168,67,0.3)", color: "#D4A843", ...bodyFont }
                  : bodyFont
              }
            >
              {s === "all" ? `All (${activeSchedule.length})` : `${cfg?.label} (${activeSchedule.filter((b) => b.status === s).length})`}
            </button>
          );
        })}
      </motion.div>

      {/* Vertical Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[23px] sm:left-1/2 top-0 bottom-0 w-px sm:-translate-x-px"
          style={{ backgroundColor: "rgba(196,147,112,0.15)" }}
        />

        <div className="space-y-0">
          {filtered.map((block, idx) => {
            const sCfg = statusConfig[block.status];
            const BlockIcon = block.icon;
            const isExpanded = expandedBlock === block.id;
            const isLeft = idx % 2 === 0; // Alternating layout on desktop

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
                id={`schedule-block-${block.id}`}
              >
                {/* Timeline node */}
                <div className="absolute left-[15px] sm:left-1/2 sm:-translate-x-1/2 z-10 top-6">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: block.status === "active" ? "#D4A843" : block.status === "completed" ? "#7E9E78" : "var(--card)",
                      border: `2px solid ${block.status === "active" ? "#D4A843" : block.status === "completed" ? "#7E9E78" : "rgba(196,147,112,0.3)"}`,
                      boxShadow: block.status === "active" ? "0 0 12px rgba(212,168,67,0.3)" : "none",
                    }}
                  >
                    {block.status === "completed" && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    {block.status === "active" && <Loader2 className="w-2.5 h-2.5 text-white animate-spin" style={{ animationDuration: "3s" }} />}
                  </motion.div>
                </div>

                {/* Card — alternating left/right on desktop */}
                <div className={`pl-14 sm:pl-0 pb-6 ${isLeft ? "sm:pr-[calc(50%+24px)]" : "sm:pl-[calc(50%+24px)]"}`}>
                  <motion.button
                    whileHover={{
                      y: -2,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.05), 0 0 0 1px rgba(196,147,112,0.12)",
                      transition: { duration: 0.2 },
                    }}
                    onClick={() => setExpandedBlock(isExpanded ? null : block.id)}
                    className="w-full text-left bg-card rounded-xl p-4 sm:p-5 transition-all cursor-pointer"
                    style={{ border: `1px solid ${sCfg.borderColor}` }}
                  >
                    {/* Time badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[0.6875rem] px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${block.color}12`, color: block.color, ...bodyFont, fontWeight: 600 }}
                        >
                          {block.time} — {block.endTime}
                        </span>
                        <span
                          className="text-[0.5625rem] px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ backgroundColor: sCfg.bg, color: sCfg.color, ...bodyFont }}
                        >
                          {sCfg.label}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>

                    {/* Title */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${block.color}12` }}
                      >
                        <BlockIcon className="w-4 h-4" style={{ color: block.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-[0.9375rem] leading-snug ${block.status === "completed" ? "text-muted-foreground/70" : "text-foreground"}`}
                          style={headingFont}
                        >
                          {block.title}
                        </h4>
                        <p className="text-muted-foreground text-[0.75rem] mt-0.5 leading-relaxed" style={bodyFont}>
                          {block.description}
                        </p>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap text-[0.6875rem] text-muted-foreground/60" style={bodyFont}>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {block.team}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {block.location}
                      </span>
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && block.details && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid rgba(196,147,112,0.1)" }}>
                            {block.details.map((detail, dIdx) => (
                              <div
                                key={dIdx}
                                className="flex items-start gap-2 text-[0.75rem] text-muted-foreground"
                                style={bodyFont}
                              >
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: block.color, opacity: 0.5 }} />
                                {detail}
                              </div>
                            ))}
                            {/* Google Calendar deep link */}
                            <a
                              href={createCalendarLinkLocal({
                                title: `IK26: ${block.title}`,
                                description: `${block.description}\n\nTeam: ${block.team}`,
                                location: block.location,
                                startDate: `2026-06-14T${parseTimeToISO(block.time)}`,
                                endDate: `2026-06-14T${parseTimeToISO(block.endTime)}`,
                              })}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.6875rem] mt-2 cursor-pointer"
                              style={{
                                backgroundColor: "rgba(74,127,181,0.06)",
                                color: "#4A7FB5",
                                border: "1px solid rgba(74,127,181,0.12)",
                                ...bodyFont,
                              }}
                            >
                              <CalendarPlus className="w-3 h-3" />
                              Add to Google Calendar
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer nav */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Pre-Event Checklist")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)", ...bodyFont }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#D4A843" }} />
            <span className="text-[0.8125rem]" style={{ color: "#D4A843" }}>Pre-Event Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#D4A843", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Task Board")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(74,127,181,0.06)", border: "1px solid rgba(74,127,181,0.12)", ...bodyFont }}
          >
            <Tag className="w-4 h-4" style={{ color: "#4A7FB5" }} />
            <span className="text-[0.8125rem]" style={{ color: "#4A7FB5" }}>Task Board</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#4A7FB5", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}