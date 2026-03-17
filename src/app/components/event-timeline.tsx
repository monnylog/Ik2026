import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Flag,
  Rocket,
  Users,
  UtensilsCrossed,
  Plane,
  Camera,
  PartyPopper,
  ArrowRight,
  List,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Zap,
  RefreshCw,
  ExternalLink,
  Wifi,
  WifiOff,
  User,
  MessageCircle,
  CalendarPlus,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { useNotion } from "../lib/notion-context";
import { EmptyState } from "./ui/empty-state";
import { TimelineSkeleton } from "./ui/skeleton-loaders";
import { toast } from "sonner";
import { bodyFont, headingFont, monoFont } from "../lib/fonts";

type MilestoneStatus = "done" | "in-progress" | "upcoming" | "critical";

interface Milestone {
  id: string;
  date: string;
  sortDate: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  icon: typeof CalendarDays;
  category: string;
  owner?: string;
  notionUrl?: string;
  weekPhase?: string;
}

// ─── Status mapping from Notion ───
function mapNotionStatus(notionStatus: string | null): MilestoneStatus {
  if (!notionStatus) return "upcoming";
  if (notionStatus.includes("Done")) return "done";
  if (notionStatus.includes("In Progress")) return "in-progress";
  if (notionStatus.includes("CRITICAL")) return "critical";
  if (notionStatus.includes("Overdue")) return "critical";
  if (notionStatus.includes("Future")) return "upcoming";
  return "upcoming";
}

// ─── Category mapping from Notion Division ───
function mapDivision(division: string | null): string {
  const map: Record<string, string> = {
    Ops: "Planning",
    Creative: "Creative",
    Restaurant: "Chefs",
    Marketing: "Marketing",
    Finance: "Finance",
    Production: "Event Prep",
    Research: "Research",
    Beverage: "Beverage",
    Sponsorships: "Sponsorships",
  };
  return (division && map[division]) || division || "General";
}

// ─── Icon for category ───
function iconForCategory(category: string): typeof CalendarDays {
  const map: Record<string, typeof CalendarDays> = {
    Marketing: Flag,
    Planning: Rocket,
    Chefs: UtensilsCrossed,
    Finance: CalendarDays,
    "Event Prep": Users,
    Research: Flag,
    Beverage: UtensilsCrossed,
    Creative: Camera,
    Sponsorships: Rocket,
    Logistics: Plane,
  };
  return map[category] || CalendarDays;
}

// ─── Format date for display ───
function formatDate(isoDate: string | null, isoDateEnd?: string | null): string {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const start = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (isoDateEnd) {
    const e = new Date(isoDateEnd + "T00:00:00");
    if (d.getMonth() === e.getMonth()) {
      return `${months[d.getMonth()]} ${d.getDate()}–${e.getDate()}, ${d.getFullYear()}`;
    }
    return `${start} – ${months[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }
  return start;
}

// ─── Generate Google Calendar link for milestone ───
function getGoogleCalendarLink(milestone: Milestone): string {
  if (!milestone.sortDate) return "";
  
  // Format date as YYYYMMDD
  const dateStr = milestone.sortDate.replace(/-/g, "");
  
  const title = encodeURIComponent(milestone.title || "IK26 Milestone");
  const details = encodeURIComponent(milestone.description || milestone.owner || "");
  const location = encodeURIComponent("Las Vegas, NV");
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}&location=${location}`;
}

// ─── Static fallback data ───
const STATIC_MILESTONES: Milestone[] = [
  // ─── Week 1: Launch (Mar 7–13) ───
  { id: "concept-vision", date: "Mar 7, 2026", sortDate: "2026-03-07", title: "Concept & Vision Finalized", description: "7 chefs, 7 cities, 7 courses — the Filipino-American migration timeline concept locked. Theme: 'Isang Kusina: We Are One Kitchen.'", status: "done", icon: Flag, category: "Planning" },
  { id: "save-the-date", date: "Mar 7, 2026", sortDate: "2026-03-07", title: "Save-the-Date Graphic Published", description: "Design from Denise + Kara published across Instagram, Facebook, and community channels.", status: "done", icon: Flag, category: "Marketing" },
  { id: "drive-folder", date: "Mar 8, 2026", sortDate: "2026-03-08", title: "Google Drive Folder Created", description: "Mirroring Y2 structure: /Chef Folders, /Creative, /Operations, /Finance.", status: "done", icon: Rocket, category: "Planning" },
  { id: "gina-followup", date: "Mar 10, 2026", sortDate: "2026-03-10", title: "Gina Follow-Up — KMA Venue Quote", description: "Building budget this week. Need final venue pricing from Keep Memory Alive Event Center.", status: "in-progress", icon: Clock, category: "Planning" },
  { id: "chef-agreements", date: "Mar 11, 2026", sortDate: "2026-03-11", title: "Chef Participation Agreements Sent", description: "$500 honorarium, travel terms, dietary/equipment form, dish deadline (Apr 29).", status: "in-progress", icon: UtensilsCrossed, category: "Chefs" },
  { id: "fb-director", date: "Mar 12, 2026", sortDate: "2026-03-12", title: "F&B Lead / Events Director Assigned", description: "Single biggest operational gap. Candidate: Mariana. Blocks all kitchen logistics.", status: "critical", icon: AlertCircle, category: "Staffing" },
  { id: "whatsapp-group", date: "Mar 12, 2026", sortDate: "2026-03-12", title: "WhatsApp Chef Group Created", description: "Add all confirmed chefs + Walbert + F&B Lead. Primary chef coordination channel.", status: "in-progress", icon: Users, category: "Planning" },
  { id: "chef-outreach-kasama", date: "Mar 13, 2026", sortDate: "2026-03-13", title: "Kasama Outreach — Timothy Flores", description: "Route through Max's Chicago owner connection. Dual option: keynote speaker or cooking.", status: "in-progress", icon: UtensilsCrossed, category: "Chefs" },
  // ─── Week 2: Numbers (Mar 14–20) ───
  { id: "research-assignments", date: "Mar 14, 2026", sortDate: "2026-03-14", title: "Research Partnerships Assigned", description: "7 researcher–chef pairings: Andrew (lead), JJ, Armida, Ava (2 chefs), Flerine (2 chefs).", status: "upcoming", icon: Users, category: "Research" },
  { id: "budget-model-v1", date: "Mar 15, 2026", sortDate: "2026-03-15", title: "Budget Model v1 Complete", description: "Full budget model with venue, travel, F&B, AV, decor, honoraria. Target: break-even at 150 guests.", status: "upcoming", icon: CalendarDays, category: "Finance" },
  { id: "sponsor-wave-1", date: "Mar 16, 2026", sortDate: "2026-03-16", title: "Sponsor Outreach Wave 1", description: "30 prospects including Jollibee, Red Ribbon, Goldilocks, Lumpia Co. Deck + one-pager sent.", status: "upcoming", icon: Rocket, category: "Sponsorships" },
  { id: "ticket-pricing", date: "Mar 18, 2026", sortDate: "2026-03-18", title: "Ticket Pricing Locked", description: "GA $150 (bev included) / VIP $275 / Kapamilya Table $2,500 (8 seats). Eventbrite setup.", status: "upcoming", icon: CalendarDays, category: "Finance" },
  { id: "chef-surveys-due", date: "Mar 20, 2026", sortDate: "2026-03-20", title: "Chef Kickoff Surveys Due", description: "Dietary preferences, ingredient wishlist, storytelling questions from all chefs.", status: "upcoming", icon: UtensilsCrossed, category: "Chefs" },
  // ─── Week 3: Go Live (Mar 21–27) ───
  { id: "tickets-on-sale", date: "Mar 21, 2026", sortDate: "2026-03-21", title: "Tickets On Sale", description: "Coordinate social blitz from all chef accounts nationally. Early bird pricing for first 48 hours.", status: "upcoming", icon: Rocket, category: "Marketing" },
  { id: "kitchen-walkthrough", date: "Mar 23, 2026", sortDate: "2026-03-23", title: "Kitchen Walkthrough at KMA", description: "Walbert + F&B Lead walk the KMA kitchen: station count, equipment list, cold storage, loading dock.", status: "upcoming", icon: UtensilsCrossed, category: "Event Prep" },
  { id: "chef-travel-booked", date: "Mar 25, 2026", sortDate: "2026-03-25", title: "All Chef Travel Booked", description: "Flights, hotels, and ground transport confirmed for all out-of-town chefs. Hotel block at The Venetian.", status: "upcoming", icon: Plane, category: "Logistics" },
  // ─── Week 4: Lock (Mar 28–Apr 6) ───
  { id: "menu-concepts-r1", date: "Mar 28, 2026", sortDate: "2026-03-28", title: "Menu Concept Drafts — Round 1", description: "Each chef submits proposed course, ingredient list, and plating concept to their Drive subfolder.", status: "upcoming", icon: UtensilsCrossed, category: "Chefs" },
  { id: "press-kit-draft", date: "Mar 30, 2026", sortDate: "2026-03-30", title: "Press Kit & Media One-Pager", description: "Chef bios, event story, high-res photos, social handles. For media outreach and sponsor materials.", status: "upcoming", icon: Camera, category: "Creative" },
  { id: "av-spec", date: "Apr 1, 2026", sortDate: "2026-04-01", title: "AV & Production Spec Finalized", description: "Sound, lighting, projector, livestream setup. Documentary crew equipment list.", status: "upcoming", icon: Camera, category: "Event Prep" },
  { id: "sponsor-deadline", date: "Apr 6, 2026", sortDate: "2026-04-06", title: "Sponsor Commitment Deadline", description: "Final sponsor list locked. Logo placement, table allocation, recognition tiers confirmed.", status: "upcoming", icon: Rocket, category: "Sponsorships" },
  // ─── Weeks 5–6: Build (Apr 7–27) ───
  { id: "menu-locked", date: "Apr 15, 2026", sortDate: "2026-04-15", title: "Menu Locked — Final Versions", description: "All 7 courses + shared dessert finalized. Ingredient procurement list sent to suppliers.", status: "upcoming", icon: UtensilsCrossed, category: "Chefs" },
  { id: "beverage-pairings", date: "Apr 18, 2026", sortDate: "2026-04-18", title: "Beverage Pairings Confirmed", description: "Wine, cocktail, and non-alcoholic pairing for each course. Bar setup and glassware ordered.", status: "upcoming", icon: UtensilsCrossed, category: "Beverage" },
  { id: "foh-staffing", date: "Apr 20, 2026", sortDate: "2026-04-20", title: "FOH Staffing Complete", description: "Servers, bartenders, hosts, coat check. Volunteer shifts assigned. Training date set.", status: "upcoming", icon: Users, category: "Event Prep" },
  { id: "media-outreach", date: "Apr 22, 2026", sortDate: "2026-04-22", title: "Media Outreach Wave", description: "Press releases to Las Vegas Review-Journal, Eater Vegas, local food bloggers, Filipino media outlets.", status: "upcoming", icon: Flag, category: "Marketing" },
  // ─── Weeks 7–8: Rehearse (Apr 28–May 14) ───
  { id: "kitchen-stations", date: "Apr 29, 2026", sortDate: "2026-04-29", title: "Kitchen Station Assignments", description: "Each chef assigned a station with equipment list. Shared prep areas designated. Cold storage allocated.", status: "upcoming", icon: UtensilsCrossed, category: "Event Prep" },
  { id: "run-of-show", date: "May 1, 2026", sortDate: "2026-05-01", title: "Run-of-Show Document Final", description: "Minute-by-minute event flow: guest arrival, cocktail hour, each course timing, speeches, documentary breaks.", status: "upcoming", icon: CalendarDays, category: "Event Prep" },
  { id: "story-videos", date: "May 5, 2026", sortDate: "2026-05-05", title: "Chef Story Videos Delivered", description: "2-minute video per chef: their city, migration story, and dish inspiration. Plays before each course.", status: "upcoming", icon: Camera, category: "Creative" },
  { id: "doc-crew-arrival", date: "May 10, 2026", sortDate: "2026-05-10", title: "Documentary Crew Arrives", description: "3-person crew for behind-the-scenes filming. Pre-event interviews with chefs begin.", status: "upcoming", icon: Camera, category: "Creative" },
  // ─── Weeks 9–10: Final Sprint (May 15–22) ───
  { id: "final-guest-count", date: "May 15, 2026", sortDate: "2026-05-15", title: "Final Guest Count Locked", description: "Cutoff for ticket sales. Final headcount to F&B for plating quantities and table layout.", status: "upcoming", icon: Users, category: "Event Prep" },
  { id: "prep-lists", date: "May 18, 2026", sortDate: "2026-05-18", title: "Chef Prep Lists & Ingredient Delivery", description: "All specialty ingredients received. Each chef's prep list printed and posted at their station.", status: "upcoming", icon: UtensilsCrossed, category: "Event Prep" },
  { id: "kitchen-rehearsal", date: "May 20, 2026", sortDate: "2026-05-20", title: "Full Kitchen Rehearsal", description: "All chefs on-site at KMA. Run-through of every course: plating, timing, service flow. Last adjustments.", status: "upcoming", icon: UtensilsCrossed, category: "Chefs" },
  { id: "chef-dinner", date: "May 21, 2026", sortDate: "2026-05-21", title: "Chef Family Dinner", description: "Private dinner for all chefs and core team. Gratitude, storytelling, and final pep talk before the big night.", status: "upcoming", icon: PartyPopper, category: "Event" },
  { id: "event-night", date: "May 22, 2026", sortDate: "2026-05-22", title: "Isang Kusina 2026 — Event Night", description: "7 chefs | 7 cities | 7 courses | 1 kitchen. The culmination of months of work and Filipino culinary storytelling.", status: "upcoming", icon: PartyPopper, category: "Event" },
];

// Today's date: March 14, 2026
const TODAY = "2026-03-14";

const statusColors: Record<MilestoneStatus, { color: string; bg: string; dotColor: string; label: string }> = {
  done: { color: "#7E9E78", bg: "rgba(126,158,120,0.1)", dotColor: "#7E9E78", label: "Complete" },
  "in-progress": { color: "#CDA88A", bg: "rgba(205,168,138,0.1)", dotColor: "#CDA88A", label: "In Progress" },
  upcoming: { color: "#6B7F8E", bg: "rgba(107,127,142,0.08)", dotColor: "rgba(107,127,142,0.35)", label: "Upcoming" },
  critical: { color: "#C75B3F", bg: "rgba(199,91,63,0.1)", dotColor: "#C75B3F", label: "Critical" },
};

// Categories hidden from chef view
const internalCategories = ["Staffing", "Planning", "Finance", "Sponsorships"];

// ─── Week Phase Definitions (aligned to Notion's Week property) ───
interface WeekPhase {
  id: string;
  weekNumber: number;
  notionWeek: string; // Matches the Notion "Week" select value
  title: string;
  subtitle: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  color: string;
  bgColor: string;
}

const weekPhases: WeekPhase[] = [
  {
    id: "week-1",
    weekNumber: 1,
    notionWeek: "Week 1: Launch",
    title: "Launch",
    subtitle: "Lock the core — venue, team leads, chef agreements",
    dateRange: "Mar 7–13",
    startDate: "2026-03-07",
    endDate: "2026-03-14",
    color: "#C75B3F",
    bgColor: "rgba(199,91,63,0.06)",
  },
  {
    id: "week-2",
    weekNumber: 2,
    notionWeek: "Week 2: Numbers",
    title: "Numbers",
    subtitle: "Budget model, ticket pricing, sponsor outreach wave 1",
    dateRange: "Mar 14–20",
    startDate: "2026-03-14",
    endDate: "2026-03-21",
    color: "#E8A830",
    bgColor: "rgba(232,168,48,0.06)",
  },
  {
    id: "week-3",
    weekNumber: 3,
    notionWeek: "Week 3: Go Live",
    title: "Go Live",
    subtitle: "Tickets on sale, chef travel booked, kitchen walkthrough",
    dateRange: "Mar 21–27",
    startDate: "2026-03-21",
    endDate: "2026-03-28",
    color: "#3B6298",
    bgColor: "rgba(59,98,152,0.06)",
  },
  {
    id: "week-4",
    weekNumber: 4,
    notionWeek: "Week 4: Lock",
    title: "Lock",
    subtitle: "Menu Round 1, press kit, AV spec, sponsor deadline",
    dateRange: "Mar 28–Apr 6",
    startDate: "2026-03-28",
    endDate: "2026-04-07",
    color: "#CDA88A",
    bgColor: "rgba(205,168,138,0.06)",
  },
  {
    id: "weeks-5-6",
    weekNumber: 5,
    notionWeek: "Weeks 5-6: Build",
    title: "Build",
    subtitle: "Menu locked, beverage pairings, FOH staffing, media outreach",
    dateRange: "Apr 7–27",
    startDate: "2026-04-07",
    endDate: "2026-04-28",
    color: "#5DA06B",
    bgColor: "rgba(93,160,107,0.06)",
  },
  {
    id: "weeks-7-8",
    weekNumber: 6,
    notionWeek: "Weeks 7-8: Rehearse",
    title: "Rehearse",
    subtitle: "Kitchen stations, run-of-show, story videos, doc crew",
    dateRange: "Apr 18–May 1",
    startDate: "2026-04-18",
    endDate: "2026-05-02",
    color: "#C9A96E",
    bgColor: "rgba(201,169,110,0.06)",
  },
  {
    id: "weeks-9-10",
    weekNumber: 7,
    notionWeek: "Weeks 9-10: Final Sprint",
    title: "Final Sprint",
    subtitle: "Guest count, prep lists, chef dinner, event night",
    dateRange: "May 1–22",
    startDate: "2026-05-01",
    endDate: "2026-05-23",
    color: "#9B59B6",
    bgColor: "rgba(155,89,182,0.06)",
  },
];

// Milestones that have no week or are post-event
const POST_EVENT_PHASE: WeekPhase = {
  id: "post-event",
  weekNumber: 8,
  notionWeek: "",
  title: "Post-Event",
  subtitle: "Wrap-up, debrief, retrospective, documentary",
  dateRange: "May 23+",
  startDate: "2026-05-23",
  endDate: "2026-12-31",
  color: "#6B7F8E",
  bgColor: "rgba(107,127,142,0.06)",
};

function getPhaseForMilestone(m: Milestone): string {
  // Use weekPhase from Notion if available
  if (m.weekPhase) {
    const phase = weekPhases.find((p) => p.notionWeek === m.weekPhase);
    if (phase) return phase.id;
  }
  // Fallback: match by date
  if (m.sortDate) {
    for (const phase of weekPhases) {
      if (m.sortDate >= phase.startDate && m.sortDate < phase.endDate) {
        return phase.id;
      }
    }
    if (m.sortDate >= POST_EVENT_PHASE.startDate) return POST_EVENT_PHASE.id;
  }
  return "week-1";
}

function getPhaseStatus(phaseMilestones: Milestone[]): { label: string; color: string; bg: string } {
  if (phaseMilestones.length === 0) return { label: "Empty", color: "#6B7F8E", bg: "rgba(107,127,142,0.08)" };
  const allDone = phaseMilestones.every((m) => m.status === "done");
  const hasCritical = phaseMilestones.some((m) => m.status === "critical");
  const hasInProgress = phaseMilestones.some((m) => m.status === "in-progress");
  if (allDone) return { label: "Complete", color: "#7E9E78", bg: "rgba(126,158,120,0.1)" };
  if (hasCritical) return { label: "Has Critical", color: "#C75B3F", bg: "rgba(199,91,63,0.1)" };
  if (hasInProgress) return { label: "In Progress", color: "#CDA88A", bg: "rgba(205,168,138,0.1)" };
  return { label: "Upcoming", color: "#6B7F8E", bg: "rgba(107,127,142,0.08)" };
}

function isCurrentPhase(phase: WeekPhase): boolean {
  return TODAY >= phase.startDate && TODAY < phase.endDate;
}

function isPastPhase(phase: WeekPhase): boolean {
  return TODAY >= phase.endDate;
}

type ViewType = "timeline" | "weekly";

interface EventTimelineProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function EventTimeline({ role, onNavigate }: EventTimelineProps) {
  const [viewType, setViewType] = useState<ViewType>("weekly");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    const expanded = new Set<string>();
    for (const phase of weekPhases) {
      if (isCurrentPhase(phase)) expanded.add(phase.id);
    }
    return expanded;
  });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterPhase, setFilterPhase] = useState<string | null>(null);
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [completedOverrides, setCompletedOverrides] = useState<Set<string>>(new Set());

  const isChef = role === "chef";

  // ── Use shared Notion context instead of independent fetch ──
  const { milestones: notionMilestones, isLive, isLoading, isCached, cachedAt, refresh } = useNotion();

  // Transform NotionMilestones → local Milestone[] for display
  const liveMilestones = useMemo<Milestone[]>(() => {
    if (!isLive || notionMilestones.length === 0) return STATIC_MILESTONES;
    return notionMilestones
      .filter((m) => m.milestone && m.milestone.trim() !== "")
      .map((m) => {
        const status = mapNotionStatus(m.status);
        const category = mapDivision(m.division);
        return {
          id: m.id,
          date: formatDate(m.dueDate, m.dueDateEnd),
          sortDate: m.dueDate || "9999-12-31",
          title: m.milestone,
          description: m.blocksAndDeps || "",
          status,
          icon: status === "critical" ? AlertCircle : iconForCategory(category),
          category,
          owner: m.owner || undefined,
          notionUrl: m.url || undefined,
          weekPhase: m.week || undefined,
        };
      })
      .sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  }, [notionMilestones, isLive]);

  const totalNotionCount = liveMilestones.length;

  const lastFetched = cachedAt
    ? (isCached ? `Cached ${new Date(cachedAt).toLocaleTimeString()}` : `Live ${new Date(cachedAt).toLocaleTimeString()}`)
    : null;

  // Auto-expand phases with critical items when live data arrives
  useEffect(() => {
    if (!isLive || liveMilestones === STATIC_MILESTONES) return;
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      for (const m of liveMilestones) {
        if (m.status === "critical") {
          next.add(getPhaseForMilestone(m));
        }
      }
      for (const phase of weekPhases) {
        if (isCurrentPhase(phase)) next.add(phase.id);
      }
      return next;
    });
  }, [isLive, liveMilestones]);

  // Handle refresh via shared context
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  }, [refresh]);

  // Use liveMilestones as the source, applying completed overrides
  const milestones = useMemo(() => {
    return liveMilestones.map((m) => {
      if (completedOverrides.has(m.id)) {
        return { ...m, status: "done" as MilestoneStatus };
      }
      return m;
    });
  }, [liveMilestones, completedOverrides]);

  // Collect unique owners for the owner filter
  const allOwners = useMemo(() => {
    const owners = new Set<string>();
    milestones.forEach((m) => { if (m.owner) owners.add(m.owner); });
    return Array.from(owners).sort();
  }, [milestones]);

  // Filter milestones for chef view + phase/owner filters
  const visibleMilestones = useMemo(() => {
    let list = isChef
      ? milestones.filter((m) => !internalCategories.includes(m.category))
      : milestones;
    if (filterPhase) {
      list = list.filter((m) => getPhaseForMilestone(m) === filterPhase);
    }
    if (filterOwner) {
      list = list.filter((m) => m.owner === filterOwner);
    }
    return list;
  }, [milestones, isChef, filterPhase, filterOwner]);

  const doneCount = visibleMilestones.filter((m) => m.status === "done").length;
  const inProgressCount = visibleMilestones.filter((m) => m.status === "in-progress").length;
  const criticalCount = visibleMilestones.filter((m) => m.status === "critical").length;
  const progress = visibleMilestones.length > 0
    ? Math.round(((doneCount + inProgressCount * 0.5) / visibleMilestones.length) * 100)
    : 0;

  function getVisibleNowIndex(): number {
    for (let i = 0; i < visibleMilestones.length; i++) {
      if (visibleMilestones[i].sortDate > TODAY) return i;
    }
    return visibleMilestones.length;
  }
  const nowIndex = getVisibleNowIndex();

  const eventDate = new Date("2026-05-22");
  const today = new Date("2026-03-14");
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };
  const expandAll = () => {
    const all = weekPhases.map((p) => p.id);
    all.push(POST_EVENT_PHASE.id);
    setExpandedPhases(new Set(all));
  };
  const collapseAll = () => setExpandedPhases(new Set());

  // Group milestones by week phase
  const allPhases = [...weekPhases, POST_EVENT_PHASE];
  const milestonesByPhase = new Map<string, Milestone[]>();
  for (const phase of allPhases) {
    milestonesByPhase.set(phase.id, []);
  }
  for (const m of visibleMilestones) {
    const phaseId = getPhaseForMilestone(m);
    if (!milestonesByPhase.has(phaseId)) {
      milestonesByPhase.set(phaseId, []);
    }
    milestonesByPhase.get(phaseId)!.push(m);
  }

  // Only show post-event if it has milestones and user is leadership
  const visiblePhases = allPhases.filter((p) => {
    if (p.id === "post-event") {
      return !isChef && (milestonesByPhase.get(p.id)?.length || 0) > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Event Timeline
            </h2>
            {/* Live indicator */}
            {isLive ? (
              <span
                className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(93,160,107,0.1)", color: "#5DA06B", ...bodyFont }}
              >
                <Wifi className="w-2.5 h-2.5" />
                Notion Live
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(107,127,142,0.1)", color: "#6B7F8E", ...bodyFont }}
              >
                <WifiOff className="w-2.5 h-2.5" />
                Static
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            {isLive && !isChef && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 text-[0.6875rem] px-2 py-1 rounded-lg cursor-pointer transition-colors hover:bg-secondary disabled:opacity-50"
                style={{ color: "#6B7F8E", ...bodyFont }}
                title={lastFetched || "Refresh data from Notion"}
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Syncing…" : "Sync"}
              </button>
            )}

            {/* View toggle */}
            <div
              className="flex items-center rounded-lg p-0.5"
              style={{ backgroundColor: "rgba(221,207,195,0.4)", border: "1px solid rgba(221,207,195,0.6)" }}
            >
              <button
                onClick={() => setViewType("timeline")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] transition-all cursor-pointer"
                style={{
                  backgroundColor: viewType === "timeline" ? "#FFFFFF" : "transparent",
                  color: viewType === "timeline" ? "#2B4464" : "#6B7F8E",
                  boxShadow: viewType === "timeline" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  ...bodyFont,
                }}
              >
                <List className="w-3.5 h-3.5" />
                Timeline
              </button>
              <button
                onClick={() => setViewType("weekly")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] transition-all cursor-pointer"
                style={{
                  backgroundColor: viewType === "weekly" ? "#FFFFFF" : "transparent",
                  color: viewType === "weekly" ? "#2B4464" : "#6B7F8E",
                  boxShadow: viewType === "weekly" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  ...bodyFont,
                }}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Week-by-Week
              </button>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          {isLive
            ? `${totalNotionCount} milestones from the IK26 Path database${viewType === "weekly" ? ", organized by week phase" : ""}.`
            : "Key milestones from kickoff to event night."}
          {lastFetched && isLive && (
            <span className="text-[0.75rem] ml-2" style={{ color: "rgba(107,127,142,0.5)" }}>
              ({lastFetched})
            </span>
          )}
        </p>
      </motion.div>

      {/* Compact progress overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="bg-card border rounded-xl p-4"
        style={{ borderColor: "rgba(205,168,138,0.2)" }}
      >
        {/* Top row: progress + stats inline */}
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[1.5rem] shrink-0" style={{ color: "#CDA88A", ...headingFont }}>
            {progress}%
          </span>
          {/* Progress bar */}
          <div className="flex-1 relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(221,207,195,0.5)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #CDA88A, #C9A96E)" }}
            />
          </div>
          <span
            className="text-[0.75rem] px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
            style={{ backgroundColor: "rgba(205,168,138,0.1)", color: "#CDA88A", ...bodyFont }}
          >
            {daysUntil}d left
          </span>
        </div>

        {/* Status legend + milestone count — compact row */}
        <div className="flex items-center gap-3 flex-wrap">
          {(["done", "in-progress", "critical", "upcoming"] as MilestoneStatus[]).map((status) => {
            const cfg = statusColors[status];
            const count = visibleMilestones.filter((m) => m.status === status).length;
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dotColor }} />
                <span className="text-[0.75rem]" style={{ color: cfg.color, ...bodyFont }}>
                  {count} {cfg.label}
                </span>
              </div>
            );
          })}
          {isLive && (
            <span className="text-[0.6875rem] text-muted-foreground/50 ml-auto" style={bodyFont}>
              {visibleMilestones.length} milestones
            </span>
          )}
        </div>

        {/* Week phase mini-bar (weekly view) */}
        {viewType === "weekly" && (
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(221,207,195,0.4)" }}>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              {weekPhases.map((phase) => {
                const phaseMilestones = milestonesByPhase.get(phase.id) || [];
                const phaseProgress = phaseMilestones.length === 0 ? 0 :
                  phaseMilestones.filter((m) => m.status === "done").length / phaseMilestones.length;
                const isCurrent = isCurrentPhase(phase);
                return (
                  <div
                    key={phase.id}
                    className="flex-1 relative rounded-sm overflow-hidden cursor-pointer"
                    style={{
                      backgroundColor: "rgba(221,207,195,0.4)",
                      outline: isCurrent ? `2px solid ${phase.color}` : "none",
                      outlineOffset: "1px",
                    }}
                    onClick={() => togglePhase(phase.id)}
                    title={`${phase.notionWeek} (${(phaseMilestones.filter((m) => m.status === "done").length)}/${phaseMilestones.length} done)`}
                  >
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{
                        width: `${phaseProgress * 100}%`,
                        backgroundColor: phase.color,
                        opacity: isPastPhase(phase) && phaseProgress === 0 ? 0.3 : 1,
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>Week 1: Launch</span>
              <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>Weeks 9-10: Final Sprint</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Phase Filter Pills + Owner Filter */}
      {!isChef && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-[0.6875rem] text-muted-foreground shrink-0" style={bodyFont}>Filter:</span>
          <button
            onClick={() => setFilterPhase(null)}
            className="px-2.5 py-1 rounded-full text-[0.6875rem] cursor-pointer transition-all"
            style={{
              backgroundColor: !filterPhase ? "rgba(201,169,110,0.12)" : "transparent",
              color: !filterPhase ? "#C9A96E" : "#8A857F",
              border: !filterPhase ? "1px solid rgba(201,169,110,0.25)" : "1px solid rgba(0,0,0,0.06)",
              ...bodyFont,
            }}
          >
            All Phases
          </button>
          {weekPhases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setFilterPhase(filterPhase === phase.id ? null : phase.id)}
              className="px-2.5 py-1 rounded-full text-[0.6875rem] cursor-pointer transition-all"
              style={{
                backgroundColor: filterPhase === phase.id ? `${phase.color}15` : "transparent",
                color: filterPhase === phase.id ? phase.color : "#8A857F",
                border: filterPhase === phase.id ? `1px solid ${phase.color}40` : "1px solid rgba(0,0,0,0.06)",
                ...bodyFont,
              }}
            >
              {phase.title}
            </button>
          ))}
          {allOwners.length > 0 && (
            <select
              value={filterOwner || ""}
              onChange={(e) => setFilterOwner(e.target.value || null)}
              className="px-2.5 py-1 rounded-full text-[0.6875rem] cursor-pointer bg-transparent"
              style={{
                color: filterOwner ? "#4A7FB5" : "#8A857F",
                border: filterOwner ? "1px solid rgba(74,127,181,0.3)" : "1px solid rgba(0,0,0,0.06)",
                ...bodyFont,
              }}
            >
              <option value="">All Owners</option>
              {allOwners.map((owner) => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          )}
        </motion.div>
      )}

      {/* Loading state */}
      {isLoading && <TimelineSkeleton />}

      {/* ═══ VIEWS ═══ */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          {viewType === "weekly" ? (
            <motion.div
              key="weekly"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {/* Controls */}
              <div className="flex items-center justify-end gap-2">
                <button onClick={expandAll} className="text-[0.75rem] px-2.5 py-1 rounded-lg transition-colors cursor-pointer hover:bg-secondary" style={{ color: "#6B7F8E", ...bodyFont }}>
                  Expand All
                </button>
                <span className="text-muted-foreground text-[0.625rem]">|</span>
                <button onClick={collapseAll} className="text-[0.75rem] px-2.5 py-1 rounded-lg transition-colors cursor-pointer hover:bg-secondary" style={{ color: "#6B7F8E", ...bodyFont }}>
                  Collapse All
                </button>
              </div>

              {visiblePhases.map((phase, phaseIdx) => {
                const phaseMilestones = milestonesByPhase.get(phase.id) || [];
                const isExpanded = expandedPhases.has(phase.id);
                const isCurrent = isCurrentPhase(phase);
                const isPast = isPastPhase(phase);
                const phaseStatus = getPhaseStatus(phaseMilestones);
                const phaseCritical = phaseMilestones.filter((m) => m.status === "critical").length;
                const doneInPhase = phaseMilestones.filter((m) => m.status === "done").length;
                const phaseProgress = phaseMilestones.length === 0 ? 0 : Math.round((doneInPhase / phaseMilestones.length) * 100);

                return (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + phaseIdx * 0.04, duration: 0.35 }}
                    className="rounded-xl overflow-hidden"
                    style={{
                      border: isCurrent ? `2px solid ${phase.color}` : "1px solid rgba(221,207,195,0.6)",
                      backgroundColor: isCurrent ? phase.bgColor : "#FFFFFF",
                    }}
                  >
                    {/* Phase Header */}
                    <button
                      onClick={() => togglePhase(phase.id)}
                      className="w-full flex items-center gap-3 p-4 cursor-pointer transition-colors text-left"
                      style={{ backgroundColor: isCurrent ? "transparent" : isPast ? "rgba(221,207,195,0.15)" : "transparent" }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isCurrent ? phase.color : isPast ? "rgba(126,158,120,0.1)" : phase.bgColor }}
                      >
                        <span
                          className="text-[0.8125rem] font-semibold"
                          style={{ color: isCurrent ? "#FFFFFF" : isPast ? "#7E9E78" : phase.color, ...headingFont }}
                        >
                          {phase.weekNumber}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <h3
                            className="text-[0.9375rem] truncate"
                            style={{ color: isPast ? "#6B7F8E" : "#2B4464", ...headingFont }}
                          >
                            {phase.title}
                          </h3>
                          {isCurrent && (
                            <span
                              className="text-[0.625rem] px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
                              style={{ backgroundColor: phase.color, color: "#FFFFFF", ...bodyFont, fontWeight: 600 }}
                            >
                              Current
                            </span>
                          )}
                          {phaseCritical > 0 && (
                            <span
                              className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full shrink-0"
                              style={{ backgroundColor: "rgba(199,91,63,0.1)", color: "#C75B3F", ...bodyFont, fontWeight: 600 }}
                            >
                              <Zap className="w-2.5 h-2.5" />
                              {phaseCritical} critical
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[0.75rem]" style={{ color: "rgba(107,127,142,0.7)", ...monoFont }}>
                            {phase.dateRange}
                          </span>
                          <span className="text-[0.6875rem] hidden sm:inline" style={{ color: "#6B7F8E", ...bodyFont }}>
                            {phase.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className="text-[0.6875rem] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: phaseStatus.bg, color: phaseStatus.color, ...bodyFont }}
                          >
                            {doneInPhase}/{phaseMilestones.length} done
                          </span>
                          {phaseMilestones.length > 0 && (
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(221,207,195,0.4)" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${phaseProgress}%`, backgroundColor: phaseProgress === 100 ? "#7E9E78" : phase.color }}
                              />
                            </div>
                          )}
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {/* Phase Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(221,207,195,0.4)" }}>
                            {phaseMilestones.length === 0 ? (
                              <div className="py-6 text-center">
                                <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>
                                  No milestones in this phase yet
                                </span>
                              </div>
                            ) : (
                              phaseMilestones.map((milestone, mIdx) => {
                                const cfg = statusColors[milestone.status];
                                const Icon = milestone.icon;
                                const isDone = milestone.status === "done";
                                const isCritical = milestone.status === "critical";
                                const isOverdue = !isDone && milestone.sortDate && milestone.sortDate < TODAY && milestone.sortDate !== "9999-12-31";

                                return (
                                  <motion.div
                                    key={milestone.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: mIdx * 0.03, duration: 0.2 }}
                                    className={`flex items-start gap-3 ${mIdx === 0 ? "pt-4" : "pt-3"} ${isDone ? "opacity-55" : ""}`}
                                    style={{
                                      borderLeft: isCritical ? "3px solid #C75B3F" : isOverdue ? "3px solid #C85050" : undefined,
                                      paddingLeft: (isCritical || isOverdue) ? "0.75rem" : undefined,
                                    }}
                                  >
                                    {/* Completion toggle checkbox */}
                                    {!isChef && !isDone && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCompletedOverrides((prev) => new Set(prev).add(milestone.id));
                                          if (milestone.notionUrl) window.open(milestone.notionUrl, "_blank");
                                          toast.success("Milestone marked done", { description: "Open in Notion to save the change.", duration: 4000 });
                                        }}
                                        className="w-5 h-5 rounded border-2 shrink-0 mt-1.5 flex items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                                        style={{ borderColor: "rgba(107,127,142,0.3)" }}
                                        title="Mark as done (opens in Notion)"
                                      />
                                    )}
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}>
                                      {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                      ) : isCritical ? (
                                        <AlertCircle className="w-3.5 h-3.5 animate-pulse" style={{ color: cfg.color }} />
                                      ) : milestone.status === "in-progress" ? (
                                        <Clock className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                      ) : (
                                        <Circle className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                          <Icon className="w-3 h-3 shrink-0" style={{ color: isDone ? "#7E9E78" : phase.color }} />
                                          <h4
                                            className={`text-[0.8125rem] ${isDone ? "line-through" : ""} ${isCritical ? "font-bold" : ""}`}
                                            style={{ color: isDone ? "#6B7F8E" : isCritical ? "#C75B3F" : "#2B4464", ...headingFont }}
                                          >
                                            {milestone.title}
                                          </h4>
                                          {isOverdue && (
                                            <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0" style={{ backgroundColor: "rgba(200,80,80,0.12)", color: "#C85050", ...bodyFont }}>
                                              OVERDUE
                                            </span>
                                          )}
                                          {/* Notion link for leadership */}
                                          {!isChef && milestone.notionUrl && (
                                            <a
                                              href={milestone.notionUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="shrink-0 opacity-30 hover:opacity-70 transition-opacity"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink className="w-2.5 h-2.5" style={{ color: "#6B7F8E" }} />
                                            </a>
                                          )}
                                        </div>
                                        <span
                                          className="text-[0.625rem] px-1.5 py-0.5 rounded-full shrink-0"
                                          style={{ backgroundColor: cfg.bg, color: cfg.color, ...bodyFont }}
                                        >
                                          {cfg.label}
                                        </span>
                                      </div>
                                      {milestone.description && (
                                        <p className="text-[0.75rem] leading-relaxed mb-1" style={{ color: "#6B7F8E", ...bodyFont }}>
                                          {milestone.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {milestone.date && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[0.6875rem]" style={{ color: isDone ? "rgba(107,127,142,0.5)" : "rgba(107,127,142,0.7)", ...monoFont }}>
                                              {milestone.date}
                                            </span>
                                            {milestone.sortDate && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(getGoogleCalendarLink(milestone), "_blank");
                                                }}
                                                className="transition-all hover:text-amber-500"
                                                style={{ color: "rgba(107,127,142,0.45)" }}
                                                title="Add to Google Calendar"
                                              >
                                                <CalendarPlus className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                        {!isChef && (
                                          <span
                                            className="text-[0.625rem] px-1.5 py-0.5 rounded-full"
                                            style={{ backgroundColor: isDone ? "rgba(221,207,195,0.3)" : "rgba(221,207,195,0.5)", color: isDone ? "rgba(107,127,142,0.5)" : "#6B7F8E", ...bodyFont }}
                                          >
                                            {milestone.category}
                                          </span>
                                        )}
                                        {!isChef && milestone.owner && (
                                          <span
                                            className="flex items-center gap-1 text-[0.625rem] px-1.5 py-0.5 rounded-full"
                                            style={{ backgroundColor: "rgba(59,98,152,0.08)", color: "#3B6298", ...bodyFont }}
                                          >
                                            <User className="w-2 h-2" />
                                            {milestone.owner}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* ═══ INTERACTIVE TIMELINE VIEW ═══ */
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {visiblePhases.map((phase, phaseIdx) => {
                const phaseMilestones = milestonesByPhase.get(phase.id) || [];
                if (phaseMilestones.length === 0 && isChef) return null;
                const isCurrent = isCurrentPhase(phase);
                const isPast = isPastPhase(phase);
                const doneInPhase = phaseMilestones.filter((m) => m.status === "done").length;
                // Check if today marker should appear in this phase
                const showTodayInPhase = isCurrent;

                return (
                  <div key={phase.id} className="relative mb-2">
                    {/* Phase section header */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: phaseIdx * 0.05 }}
                      className="flex items-center gap-3 mb-3 mt-4 first:mt-0"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: isCurrent ? phase.color : isPast ? "rgba(126,158,120,0.15)" : phase.bgColor }}
                      >
                        <span className="text-[0.6875rem] font-bold" style={{ color: isCurrent ? "#FFF" : isPast ? "#7E9E78" : phase.color, ...headingFont }}>
                          {phase.weekNumber}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[0.8125rem]" style={{ color: isCurrent ? phase.color : isPast ? "#6B7F8E" : "#2B4464", ...headingFont }}>
                            {phase.title}
                          </h3>
                          <span className="text-[0.625rem]" style={{ color: "rgba(107,127,142,0.6)", ...monoFont }}>{phase.dateRange}</span>
                          {isCurrent && (
                            <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: phase.color, color: "#FFF", ...bodyFont, fontWeight: 600 }}>
                              Now
                            </span>
                          )}
                        </div>
                        <p className="text-[0.625rem] text-muted-foreground hidden sm:block" style={bodyFont}>{phase.subtitle}</p>
                      </div>
                      <span className="text-[0.625rem] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: phase.bgColor, color: phase.color, ...bodyFont }}>
                        {doneInPhase}/{phaseMilestones.length}
                      </span>
                    </motion.div>

                    {/* Vertical track for this phase */}
                    <div className="relative pl-3 ml-3.5" style={{ borderLeft: `2px solid ${isCurrent ? phase.color : isPast ? "rgba(126,158,120,0.2)" : "rgba(221,207,195,0.5)"}` }}>
                      {/* Today marker line */}
                      {showTodayInPhase && (
                        <motion.div
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="relative flex items-center gap-3 py-2 mb-2"
                        >
                          <div className="absolute -left-[calc(0.75rem+5px)] z-10">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#CDA88A", boxShadow: "0 0 0 3px rgba(205,168,138,0.25), 0 0 8px rgba(205,168,138,0.3)" }} />
                          </div>
                          <div className="flex-1 flex items-center gap-2 py-2 px-3 rounded-lg ml-3" style={{ background: "linear-gradient(90deg, rgba(205,168,138,0.1), transparent)", border: "1px dashed rgba(205,168,138,0.3)" }}>
                            <ArrowRight className="w-3 h-3" style={{ color: "#CDA88A" }} />
                            <span className="text-[0.75rem]" style={{ color: "#CDA88A", ...headingFont }}>Today</span>
                            <span className="text-[0.625rem] text-muted-foreground" style={monoFont}>Mar 11</span>
                            <span className="text-[0.625rem] ml-auto" style={{ color: "#CDA88A", ...bodyFont }}>{daysUntil}d to event</span>
                          </div>
                        </motion.div>
                      )}

                      {/* Milestones */}
                      {phaseMilestones.map((milestone, mIdx) => {
                        const cfg = statusColors[milestone.status];
                        const Icon = milestone.icon;
                        const isDone = milestone.status === "done";
                        const isExpRow = expandedRow === milestone.id;

                        return (
                          <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + mIdx * 0.03 }}
                            className={`relative py-1.5 ${isDone ? "opacity-50" : ""}`}
                          >
                            {/* Dot on the track */}
                            <div className="absolute -left-[calc(0.75rem+4px)] top-4 z-10">
                              <div
                                className="w-2.5 h-2.5 rounded-full border-2"
                                style={{
                                  backgroundColor: isDone ? "#FFF" : cfg.dotColor,
                                  borderColor: cfg.dotColor,
                                }}
                              />
                            </div>

                            {/* Card */}
                            <button
                              onClick={() => setExpandedRow(isExpRow ? null : milestone.id)}
                              className="w-full text-left ml-3 rounded-xl p-3 transition-all cursor-pointer hover:shadow-sm"
                              style={{
                                backgroundColor: isDone ? "rgba(221,207,195,0.15)" : isExpRow ? "#FFFFFF" : "rgba(255,255,255,0.7)",
                                border: milestone.status === "critical" ? "1px solid rgba(199,91,63,0.3)" : isExpRow ? "1px solid rgba(221,207,195,0.8)" : "1px solid rgba(221,207,195,0.4)",
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Icon className="w-3 h-3 shrink-0" style={{ color: isDone ? "#7E9E78" : phase.color }} />
                                  <h4 className={`text-[0.8125rem] truncate ${isDone ? "line-through" : ""}`} style={{ color: isDone ? "#6B7F8E" : "#2B4464", ...headingFont }}>
                                    {milestone.title}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color, ...bodyFont }}>{cfg.label}</span>
                                  <ChevronDown className={`w-3 h-3 text-muted-foreground/40 transition-transform ${isExpRow ? "rotate-180" : ""}`} />
                                </div>
                              </div>

                              {/* Expanded detail */}
                              <AnimatePresence>
                                {isExpRow && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(221,207,195,0.4)" }}>
                                      {milestone.description && (
                                        <p className="text-[0.75rem] mb-2 leading-relaxed" style={{ color: "#6B7F8E", ...bodyFont }}>{milestone.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {milestone.date && (
                                          <div className="flex items-center gap-1">
                                            <span className="text-[0.6875rem]" style={{ color: "rgba(107,127,142,0.7)", ...monoFont }}>{milestone.date}</span>
                                            {milestone.sortDate && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  window.open(getGoogleCalendarLink(milestone), "_blank");
                                                }}
                                                className="transition-all hover:text-amber-500"
                                                style={{ color: "rgba(107,127,142,0.45)" }}
                                                title="Add to Google Calendar"
                                              >
                                                <CalendarPlus className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        )}
                                        {!isChef && <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(221,207,195,0.5)", color: "#6B7F8E", ...bodyFont }}>{milestone.category}</span>}
                                        {!isChef && milestone.owner && (
                                          <span className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(59,98,152,0.08)", color: "#3B6298", ...bodyFont }}>
                                            <User className="w-2 h-2" />{milestone.owner}
                                          </span>
                                        )}
                                        {!isChef && milestone.notionUrl && (
                                          <a href={milestone.notionUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full hover:opacity-80" style={{ backgroundColor: "rgba(107,127,142,0.08)", color: "#6B7F8E", ...bodyFont }} onClick={(e) => e.stopPropagation()}>
                                            <ExternalLink className="w-2 h-2" />Notion
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                          </motion.div>
                        );
                      })}

                      {phaseMilestones.length === 0 && (
                        <div className="ml-3 py-4 text-center text-[0.75rem] text-muted-foreground" style={bodyFont}>No milestones yet</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Travel & Lodging")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(74,127,181,0.06)",
              border: "1px solid rgba(74,127,181,0.12)",
              ...bodyFont,
            }}
          >
            <Plane className="w-4 h-4" style={{ color: "#4A7FB5" }} />
            <span className="text-[0.8125rem]" style={{ color: "#4A7FB5" }}>
              Travel & Lodging
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#4A7FB5", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Menu & Courses")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(205,168,138,0.06)",
              border: "1px solid rgba(205,168,138,0.12)",
              ...bodyFont,
            }}
          >
            <UtensilsCrossed className="w-4 h-4" style={{ color: "#CDA88A" }} />
            <span className="text-[0.8125rem]" style={{ color: "#CDA88A" }}>
              Menu & Courses
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#CDA88A", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Comms")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(26,92,56,0.06)",
              border: "1px solid rgba(26,92,56,0.12)",
              ...bodyFont,
            }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#1A5C38" }} />
            <span className="text-[0.8125rem]" style={{ color: "#1A5C38" }}>
              Team Comms
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#1A5C38", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}