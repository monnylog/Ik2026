import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  X,
  LayoutDashboard,
  MessageCircle,
  Mic,
  CalendarDays,
  Users,
  UserCheck,
  Heart,
  Shield,
  Plane,
  UtensilsCrossed,
  DollarSign,
  BookOpen,
  Link2,
  Settings,
  CornerDownLeft,
  ChefHat,
  User,
  FileText,
  Sparkles,
  ListChecks,
  Tag,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Share2,
  Flame,
  Handshake,
  Receipt,
  BarChart3,
  Wallet,
  Database,
  Inbox,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { getVisibleNavItemsForView, type ViewMode } from "./onboarding/use-auth";
import { confirmedChefs } from "./onboarding/chef-directory";
import { useFocusTrap } from "../lib/use-focus-trap";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface SearchableItem {
  label: string;
  description: string;
  keywords: string[];
  icon: typeof LayoutDashboard;
  color: string;
  category: "page" | "action" | "chef" | "resource" | "engagement" | "checklist";
  navigateTo: string; // page to navigate to
  url?: string; // external URL to open
}

const pageItems: SearchableItem[] = [
  { label: "Dashboard", description: "Overview, KPIs, activity feed, and countdown", keywords: ["home", "overview", "main", "kpi", "stats"], icon: LayoutDashboard, color: "#CDA88A", category: "page", navigateTo: "Dashboard" },
  { label: "Comms", description: "Real-time team chat and messaging channels", keywords: ["chat", "message", "communication", "discord", "talk"], icon: MessageCircle, color: "#1A5C38", category: "page", navigateTo: "Comms" },
  { label: "Our Istoryas", description: "Voice notes, memories, flavor fusions, and prompts", keywords: ["story", "stories", "voice", "memory", "memories", "fusion", "archive", "prompt"], icon: Mic, color: "#C9A96E", category: "page", navigateTo: "Our Istoryas" },
  { label: "Event Timeline", description: "Key dates, milestones, and deadlines", keywords: ["timeline", "schedule", "dates", "milestone", "calendar", "deadline"], icon: CalendarDays, color: "#6B7F8E", category: "page", navigateTo: "Event Timeline" },
  { label: "Chef Roster", description: "All participating chefs and their details", keywords: ["chefs", "roster", "participants", "cook", "chef"], icon: Users, color: "#7E9E78", category: "page", navigateTo: "Chef Roster" },
  { label: "Team Deploy", description: "Team assignments and deployment plan", keywords: ["team", "assign", "deploy", "staff", "roles"], icon: UserCheck, color: "#4A7FB5", category: "page", navigateTo: "Team Deploy" },
  { label: "Community", description: "Participant connections and icebreakers", keywords: ["community", "connections", "icebreaker", "people", "network"], icon: Heart, color: "#C9A96E", category: "page", navigateTo: "Community" },
  { label: "Members", description: "User management and access control", keywords: ["members", "users", "admin", "manage", "access"], icon: Shield, color: "#C75B3F", category: "page", navigateTo: "Members" },
  { label: "Travel & Lodging", description: "Flight bookings, hotel info, and logistics", keywords: ["travel", "flight", "hotel", "lodging", "airport", "booking", "itinerary", "vegas", "trip"], icon: Plane, color: "#4A7FB5", category: "page", navigateTo: "Travel & Lodging" },
  { label: "Menu & Courses", description: "Multi-course dinner menu development", keywords: ["menu", "course", "dinner", "food", "dish", "recipe"], icon: UtensilsCrossed, color: "#7E9E78", category: "page", navigateTo: "Menu & Courses" },
  { label: "Submit Menu", description: "Submit your dish concept and creative brief", keywords: ["submit", "wizard", "dish", "brief", "submission"], icon: UtensilsCrossed, color: "#CDA88A", category: "page", navigateTo: "Submit Menu" },
  { label: "Budget & COGS", description: "Financial tracking and cost analysis", keywords: ["budget", "cost", "money", "finance", "expense", "cogs"], icon: DollarSign, color: "#CDA88A", category: "page", navigateTo: "Budget & COGS" },
  { label: "Research & Story", description: "Historical research and cultural documentation", keywords: ["research", "story", "history", "culture", "documentation"], icon: BookOpen, color: "#6B7F8E", category: "page", navigateTo: "Research & Story" },
  { label: "Links & Resources", description: "Shared documents, links, and references", keywords: ["links", "resources", "documents", "files", "reference"], icon: Link2, color: "#3B6298", category: "page", navigateTo: "Links & Resources" },
  { label: "Settings", description: "Profile, avatar, theme, and account preferences", keywords: ["settings", "profile", "avatar", "theme", "account", "preferences"], icon: Settings, color: "#6B7F8E", category: "action", navigateTo: "Settings" },
  { label: "Pre-Event Checklist", description: "Countdown timer and preparation task checklist", keywords: ["checklist", "countdown", "preparation", "pre-event", "tasks", "progress"], icon: ListChecks, color: "#C9A96E", category: "page", navigateTo: "Pre-Event Checklist" },
  { label: "Task Board", description: "Kanban board for collaborative task management", keywords: ["kanban", "task", "board", "todo", "progress", "done", "assign"], icon: Tag, color: "#4A7FB5", category: "page", navigateTo: "Task Board" },
  { label: "Event Schedule", description: "Event day run of show with time blocks and assignments", keywords: ["schedule", "event day", "run of show", "time", "blocks", "dinner service"], icon: CalendarClock, color: "#6B7F8E", category: "page", navigateTo: "Event Schedule" },
  { label: "Activity Log", description: "Chronological feed of all actions and changes across the hub", keywords: ["activity", "log", "history", "audit", "changes", "feed", "events"], icon: ClipboardList, color: "#C9A96E", category: "page", navigateTo: "Activity Log" },
  { label: "Share & Invite", description: "Ready-to-send templates for sharing across social media, email, and messaging", keywords: ["share", "invite", "social", "facebook", "instagram", "twitter", "email", "whatsapp", "sms", "outreach", "template", "spread"], icon: Share2, color: "#C49370", category: "page", navigateTo: "Share Invite" },
  { label: "Mission Control", description: "Critical alerts, blockers, and escalations for leadership", keywords: ["mission", "control", "war", "room", "critical", "alert", "blocker", "escalation", "urgent"], icon: Flame, color: "#C85050", category: "page", navigateTo: "Mission Control" },
  { label: "Sponsors & Partners", description: "Sponsor pipeline, tier tracking, and partnership management", keywords: ["sponsor", "partner", "sponsorship", "tier", "brand", "funding", "pipeline"], icon: Handshake, color: "#C9A96E", category: "page", navigateTo: "Sponsors & Partners" },
  { label: "Expenses", description: "Submit and track event expenses and receipts", keywords: ["expense", "receipt", "spend", "cost", "reimburse", "quickbooks"], icon: Receipt, color: "#CDA88A", category: "page", navigateTo: "Expenses" },
  { label: "Finance", description: "Financial dashboard with budget vs actuals overview", keywords: ["finance", "financial", "dashboard", "budget", "revenue", "p&l"], icon: BarChart3, color: "#4A7FB5", category: "page", navigateTo: "Finance" },
  { label: "Reimbursements", description: "Submit and manage expense reimbursement requests", keywords: ["reimburse", "reimbursement", "refund", "claim", "receipt"], icon: Wallet, color: "#7E9E78", category: "page", navigateTo: "Reimbursements" },
  { label: "Forms & Agreements", description: "Legal forms, waivers, and embedded Google Forms", keywords: ["form", "agreement", "waiver", "legal", "google form", "sign", "contract"], icon: FileText, color: "#6B7F8E", category: "page", navigateTo: "Forms & Agreements" },
  { label: "Portal", description: "Public-facing event landing page preview", keywords: ["portal", "public", "landing", "website", "preview"], icon: Sparkles, color: "#C9A96E", category: "page", navigateTo: "Portal" },
  { label: "Inquiries", description: "Manage portal contact form inquiries", keywords: ["inquiry", "inquiries", "contact", "form", "message", "visitor"], icon: Inbox, color: "#4A7FB5", category: "page", navigateTo: "Inquiries" },
  { label: "Notion Admin", description: "Configure Notion database sync and content types", keywords: ["notion", "admin", "sync", "database", "config", "api"], icon: Database, color: "#6B7F8E", category: "page", navigateTo: "Notion Admin" },
];

// Chef searchable items from confirmed chef directory
const chefItems: SearchableItem[] = confirmedChefs.map((chef) => ({
  label: chef.name,
  description: `Course ${chef.course}: ${chef.courseTitle} — ${chef.signatureDish}`,
  keywords: [
    chef.name.toLowerCase(),
    chef.city.toLowerCase(),
    chef.state?.toLowerCase() || "",
    chef.signatureDish.toLowerCase(),
    ...chef.specialties.map((s) => s.toLowerCase()),
    `course ${chef.course}`,
    chef.courseTitle.toLowerCase(),
  ].filter(Boolean),
  icon: ChefHat,
  color: "#7E9E78",
  category: "chef" as const,
  navigateTo: "Chef Roster",
}));

// Resource searchable items
const resourceItems: SearchableItem[] = [
  { label: "Brand & Visual Identity", description: "Logos, color palette, typography specs", keywords: ["brand", "logo", "identity", "design", "guidelines", "visual"], icon: FileText, color: "#C9A96E", category: "resource", navigateTo: "Links & Resources" },
  { label: "Venue Floor Plan", description: "CAD drawings of event space and kitchen layout", keywords: ["venue", "floor", "plan", "kitchen", "layout", "cad"], icon: FileText, color: "#6B7F8E", category: "resource", navigateTo: "Links & Resources" },
  { label: "Guest List & RSVP", description: "Guest tracking and dietary restrictions", keywords: ["guest", "rsvp", "dietary", "table", "seating"], icon: FileText, color: "#4A7FB5", category: "resource", navigateTo: "Links & Resources" },
  { label: "Vendor Contacts", description: "AV, rentals, florals, and printing contacts", keywords: ["vendor", "contract", "av", "rental", "floral"], icon: FileText, color: "#CDA88A", category: "resource", navigateTo: "Links & Resources" },
  { label: "IK26 Discord Server", description: "Join the Isang Kusina community for real-time voice, text, and updates", keywords: ["discord", "server", "voice", "community", "invite", "join"], icon: MessageCircle, color: "#5865F2", category: "resource", navigateTo: "Community", url: "https://discord.gg/eQyaK4Pd" },
];

// Engagement searchable items
const engagementItems: SearchableItem[] = [
  { label: "Daily Prompt", description: "Share a memory or reflection with the team", keywords: ["prompt", "daily", "reflection", "memory", "share"], icon: Sparkles, color: "#C9A96E", category: "engagement", navigateTo: "Dashboard" },
  { label: "Memory Wall", description: "Post food memories and stories", keywords: ["memory", "wall", "stories", "food", "nostalgia"], icon: Heart, color: "#CDA88A", category: "engagement", navigateTo: "Our Istoryas" },
  { label: "Flavor Fusion", description: "Create unexpected ingredient combinations", keywords: ["flavor", "fusion", "ingredient", "combine", "creative"], icon: Sparkles, color: "#7E9E78", category: "engagement", navigateTo: "Our Istoryas" },
  { label: "Recipe Roulette", description: "Spin the wheel for recipe inspiration", keywords: ["recipe", "roulette", "spin", "random", "inspiration"], icon: Sparkles, color: "#4A7FB5", category: "engagement", navigateTo: "Our Istoryas" },
];

// Team member items
const teamItems: SearchableItem[] = [
  { label: "Monny", description: "Leadership — Co-founder & Creative Director", keywords: ["monny", "leader", "director", "creative", "founder"], icon: User, color: "#DDA15E", category: "chef", navigateTo: "Members" },
  { label: "Walbert", description: "Leadership — Co-founder & Operations Director", keywords: ["walbert", "leader", "director", "operations", "founder"], icon: User, color: "#DDA15E", category: "chef", navigateTo: "Members" },
  { label: "Denise", description: "Team — Design & Brand", keywords: ["denise", "team", "design", "brand"], icon: User, color: "#4A7FB5", category: "chef", navigateTo: "Members" },
  { label: "Kara", description: "Team — Marketing & Social Media", keywords: ["kara", "team", "marketing", "social"], icon: User, color: "#4A7FB5", category: "chef", navigateTo: "Members" },
  { label: "Sarah", description: "Team — Logistics & Operations", keywords: ["sarah", "team", "logistics", "operations"], icon: User, color: "#4A7FB5", category: "chef", navigateTo: "Members" },
];

// Task searchable items
const taskItems: SearchableItem[] = [
  { label: "Confirm venue AV setup", description: "Venue · Critical · Due Mar 20", keywords: ["av", "audio", "visual", "venue", "kma", "setup"], icon: ListChecks, color: "#3B6298", category: "action", navigateTo: "Dashboard" },
  { label: "Walk KMA kitchen", description: "Venue · High · Due Mar 23", keywords: ["kitchen", "walkthrough", "station", "cold storage", "kma"], icon: ListChecks, color: "#3B6298", category: "action", navigateTo: "Dashboard" },
  { label: "Collect menu concept drafts", description: "Menu · Critical · Due Mar 28", keywords: ["menu", "concept", "draft", "chef", "round 1"], icon: ListChecks, color: "#7E9E78", category: "action", navigateTo: "Dashboard" },
  { label: "Book hotel block Venetian", description: "Logistics · Critical · Completed", keywords: ["hotel", "venetian", "block", "rooms", "lodging"], icon: ListChecks, color: "#CDA88A", category: "action", navigateTo: "Dashboard" },
  { label: "Airport pickups for chefs", description: "Logistics · High · Due May 10", keywords: ["airport", "pickup", "arrivals", "transport", "chef"], icon: ListChecks, color: "#CDA88A", category: "action", navigateTo: "Dashboard" },
  { label: "Volunteer shift schedule", description: "Logistics · High · Due Apr 15", keywords: ["volunteer", "shift", "schedule", "event day", "staff"], icon: ListChecks, color: "#CDA88A", category: "action", navigateTo: "Dashboard" },
  { label: "Chef headshot photos", description: "Marketing · Medium · Due Apr 5", keywords: ["headshot", "photo", "program", "booklet", "portrait"], icon: ListChecks, color: "#C9A96E", category: "action", navigateTo: "Dashboard" },
  { label: "Partnership emails to sponsors", description: "Marketing · High · Due Mar 25", keywords: ["sponsor", "partnership", "email", "confirmation"], icon: ListChecks, color: "#C9A96E", category: "action", navigateTo: "Dashboard" },
  { label: "Press release LVRJ", description: "Marketing · Medium · Due Apr 22", keywords: ["press", "release", "review", "journal", "media"], icon: ListChecks, color: "#C9A96E", category: "action", navigateTo: "Dashboard" },
  { label: "Beverage pairings", description: "Menu · Medium · Due Apr 18", keywords: ["beverage", "pairing", "wine", "cocktail", "drink"], icon: ListChecks, color: "#7E9E78", category: "action", navigateTo: "Dashboard" },
];

// Timeline milestone searchable items
const milestoneItems: SearchableItem[] = [
  { label: "Save-the-Date Published", description: "Mar 7 · Marketing · Done", keywords: ["save the date", "graphic", "social", "instagram"], icon: CalendarDays, color: "#7E9E78", category: "resource", navigateTo: "Event Timeline" },
  { label: "F&B Director Assignment", description: "Mar 12 · Staffing · Critical", keywords: ["f&b", "director", "events", "mariana", "staffing"], icon: CalendarDays, color: "#C75B3F", category: "resource", navigateTo: "Event Timeline" },
  { label: "Tickets On Sale", description: "Mar 21 · Marketing · Upcoming", keywords: ["tickets", "sale", "eventbrite", "early bird", "pricing"], icon: CalendarDays, color: "#6B7F8E", category: "resource", navigateTo: "Event Timeline" },
  { label: "Kitchen Walkthrough KMA", description: "Mar 23 · Event Prep · Upcoming", keywords: ["kitchen", "walkthrough", "kma", "venue", "station"], icon: CalendarDays, color: "#6B7F8E", category: "resource", navigateTo: "Event Timeline" },
  { label: "Menu Locked — Final", description: "Apr 15 · Chefs · Upcoming", keywords: ["menu", "locked", "final", "ingredient", "procurement"], icon: CalendarDays, color: "#6B7F8E", category: "resource", navigateTo: "Event Timeline" },
  { label: "Full Kitchen Rehearsal", description: "May 20 · Chefs · Upcoming", keywords: ["rehearsal", "kitchen", "run-through", "practice"], icon: CalendarDays, color: "#6B7F8E", category: "resource", navigateTo: "Event Timeline" },
  { label: "Chef Family Dinner", description: "May 21 · Event · Upcoming", keywords: ["family", "dinner", "gratitude", "storytelling"], icon: CalendarDays, color: "#C9A96E", category: "resource", navigateTo: "Event Timeline" },
  { label: "Event Night — May 22", description: "May 22 · Event · The Big Night", keywords: ["event", "night", "may 22", "isang kusina", "dinner"], icon: CalendarDays, color: "#C9A96E", category: "resource", navigateTo: "Event Timeline" },
];

// Checklist items searchable
const checklistItems: SearchableItem[] = [
  { label: "Finalize venue floor plan", description: "Checklist · Venue · Critical", keywords: ["floor plan", "venue", "kma", "layout", "finalize"], icon: CheckSquare, color: "#C75B3F", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Confirm AV equipment rental", description: "Checklist · Venue · Critical", keywords: ["av", "equipment", "rental", "projector", "sound"], icon: CheckSquare, color: "#C75B3F", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Source calamansi (10 lbs)", description: "Checklist · Menu · High Priority", keywords: ["calamansi", "ingredient", "source", "citrus", "procurement"], icon: CheckSquare, color: "#C9A96E", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Print event programs", description: "Checklist · Communications · Medium", keywords: ["print", "program", "booklet", "event", "program"], icon: CheckSquare, color: "#4A7FB5", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Arrange portable kamado grill", description: "Checklist · Setup · High Priority", keywords: ["kamado", "grill", "portable", "setup", "cooking"], icon: CheckSquare, color: "#CDA88A", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Order table centerpieces", description: "Checklist · Setup · Medium", keywords: ["centerpiece", "table", "decor", "flowers", "arrangement"], icon: CheckSquare, color: "#7E9E78", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Chef welcome gift bags", description: "Checklist · Hospitality · Medium", keywords: ["gift", "bag", "welcome", "chef", "hospitality"], icon: CheckSquare, color: "#C9A96E", category: "checklist", navigateTo: "Pre-Event Checklist" },
  { label: "Emergency first aid kit", description: "Checklist · Safety · Critical", keywords: ["first aid", "emergency", "medical", "safety", "kit"], icon: CheckSquare, color: "#C75B3F", category: "checklist", navigateTo: "Pre-Event Checklist" },
];

// Task Board items searchable
const taskBoardItems: SearchableItem[] = [
  { label: "Finalize venue floor plan", description: "Task Board · Logistics · To Do · High", keywords: ["floor plan", "venue", "logistics", "todo"], icon: ClipboardList, color: "#4A7FB5", category: "action", navigateTo: "Task Board" },
  { label: "Source calamansi (10 lbs)", description: "Task Board · Menu · To Do · High", keywords: ["calamansi", "ingredient", "menu", "source"], icon: ClipboardList, color: "#4A7FB5", category: "action", navigateTo: "Task Board" },
  { label: "Design social media templates", description: "Task Board · Creative · In Progress · Medium", keywords: ["social media", "template", "design", "creative"], icon: ClipboardList, color: "#C9A96E", category: "action", navigateTo: "Task Board" },
  { label: "Confirm wine pairings", description: "Task Board · Menu · In Progress · Medium", keywords: ["wine", "pairing", "beverage", "confirm"], icon: ClipboardList, color: "#C9A96E", category: "action", navigateTo: "Task Board" },
  { label: "Coordinate chef airport pickups", description: "Task Board · Logistics · In Progress · High", keywords: ["airport", "pickup", "transport", "chef", "coordinate"], icon: ClipboardList, color: "#C9A96E", category: "action", navigateTo: "Task Board" },
  { label: "Book kitchen rehearsal space", description: "Task Board · Setup · Done", keywords: ["kitchen", "rehearsal", "space", "book", "done"], icon: ClipboardList, color: "#7E9E78", category: "action", navigateTo: "Task Board" },
  { label: "Send save-the-date emails", description: "Task Board · Comms · Done", keywords: ["save the date", "email", "comms", "send"], icon: ClipboardList, color: "#7E9E78", category: "action", navigateTo: "Task Board" },
];

const allSearchItems = [...pageItems, ...chefItems, ...teamItems, ...taskItems, ...taskBoardItems, ...milestoneItems, ...checklistItems, ...resourceItems, ...engagementItems];

const categoryLabels: Record<string, string> = {
  page: "Pages",
  action: "Tasks & Actions",
  chef: "People",
  checklist: "Checklist Items",
  resource: "Milestones & Resources",
  engagement: "Engagement",
};

interface GlobalSearchProps {
  role: UserRole;
  onNavigate: (page: string) => void;
  viewMode?: ViewMode;
}

export function GlobalSearch({ role, onNavigate, viewMode }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // Filter items by viewMode-aware visibility
  const effectiveViewMode: ViewMode = viewMode || (role === "leadership" ? "leadership" : role === "team" ? "team" : "chef");
  const visibleLabels = getVisibleNavItemsForView(
    effectiveViewMode,
    pageItems.map((i) => i.label)
  );

  // Determine visible items based on role
  const visibleItems = useMemo(() => {
    // Get all visible page labels for this view mode
    const visiblePageSet = new Set(visibleLabels);
    visiblePageSet.add("Submit Menu"); // always accessible
    visiblePageSet.add("Settings"); // always accessible
    visiblePageSet.add("Dashboard"); // always accessible

    return allSearchItems.filter((i) => {
      // For page items, check visibility
      if (i.category === "page") {
        return visiblePageSet.has(i.label);
      }
      // Filter out items that navigate to hidden pages
      if (i.navigateTo && !visiblePageSet.has(i.navigateTo)) {
        return false;
      }
      // Chef items visible to all
      if (i.category === "chef") return true;
      // Resources visible to leadership and team
      if (i.category === "resource") return role !== "chef";
      // Engagement visible to all
      if (i.category === "engagement") return true;
      return true;
    });
  }, [visibleLabels, role]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return visibleItems.slice(0, 15); // Show top 15 when empty
    const q = query.toLowerCase();
    return visibleItems.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q))
    );
  }, [query, visibleItems]);

  // Group results by category
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const item of filtered) {
      const cat = item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => {
    const flat: typeof filtered = [];
    const order = ["page", "action", "chef", "resource", "engagement", "checklist"];
    for (const cat of order) {
      if (grouped[cat]) flat.push(...grouped[cat]);
    }
    return flat;
  }, [grouped]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = useCallback(
    (item: SearchableItem) => {
      if (item.url) {
        window.open(item.url, "_blank");
      } else {
        onNavigate(item.navigateTo);
      }
      setOpen(false);
    },
    [onNavigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && flatResults[selectedIdx]) {
      handleSelect(flatResults[selectedIdx]);
    }
  };

  // Track cumulative index for keyboard nav
  let cumulativeIdx = 0;

  return (
    <>
      {/* Trigger — search input in top bar */}
      <button
        onClick={() => setOpen(true)}
        className="relative hidden sm:flex items-center w-44 h-8 pl-8 pr-3 bg-secondary/80 rounded-lg text-[0.8125rem] text-muted-foreground border border-border hover:border-gold/30 transition-colors cursor-pointer"
        style={bodyFont}
      >
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <span className="flex-1 text-left">Search</span>
        <kbd
          className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground/50"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setOpen(false)}
            />

            {/* Search dialog */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="fixed left-1/2 -translate-x-1/2 top-[15%] w-[90vw] max-w-lg z-50 bg-card rounded-2xl shadow-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)", maxHeight: "80vh" }}
              ref={trapRef}
              role="dialog"
              aria-modal="true"
              aria-label="Global search"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, chefs, tasks, milestones..."
                  className="flex-1 bg-transparent text-foreground text-[0.9375rem] placeholder:text-muted-foreground/30 focus:outline-none"
                  style={bodyFont}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="w-6 h-6 rounded flex items-center justify-center hover:bg-secondary cursor-pointer"
                    aria-label="Clear search query"
                  >
                    <X className="w-3 h-3 text-muted-foreground/40" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-[0.6875rem] text-muted-foreground/40 px-2 py-1 rounded border border-border hover:bg-secondary cursor-pointer"
                  style={bodyFont}
                  aria-label="Close search"
                >
                  ESC
                </button>
              </div>

              {/* Results grouped by category */}
              <div className="max-h-[50vh] overflow-y-auto py-2">
                {flatResults.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <p className="text-muted-foreground/40 text-[0.875rem]" style={bodyFont}>
                      No results for "{query}"
                    </p>
                  </div>
                )}

                {(["page", "action", "chef", "resource", "engagement", "checklist"] as const).map((cat) => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  const startIdx = cumulativeIdx;
                  cumulativeIdx += items.length;

                  return (
                    <div key={cat}>
                      {/* Category label */}
                      {query.trim() && (
                        <div className="px-4 pt-2 pb-1">
                          <span className="text-[0.625rem] uppercase tracking-wider text-muted-foreground/40" style={bodyFont}>
                            {categoryLabels[cat] || cat}
                          </span>
                        </div>
                      )}
                      {items.map((item, idx) => {
                        const globalIdx = startIdx + idx;
                        const Icon = item.icon;
                        const isSelected = globalIdx === selectedIdx;
                        return (
                          <button
                            key={`${item.label}-${idx}`}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIdx(globalIdx)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                              isSelected ? "bg-gold/8" : "hover:bg-secondary/50"
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${item.color}12`,
                                border: `1px solid ${item.color}20`,
                              }}
                            >
                              <Icon className="w-4 h-4" style={{ color: item.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground text-[0.8125rem] block" style={bodyFont}>
                                {item.label}
                              </span>
                              <span className="text-muted-foreground text-[0.6875rem] truncate block" style={bodyFont}>
                                {item.description}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-1 shrink-0">
                                <CornerDownLeft className="w-3 h-3 text-gold/50" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border/50 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-muted-foreground/30">
                  <kbd className="text-[0.5rem] px-1 py-0.5 rounded border border-border bg-background" style={{ fontFamily: "'JetBrains Mono', monospace" }}>↑↓</kbd>
                  <span className="text-[0.5625rem]" style={bodyFont}>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground/30">
                  <kbd className="text-[0.5rem] px-1 py-0.5 rounded border border-border bg-background" style={{ fontFamily: "'JetBrains Mono', monospace" }}>↵</kbd>
                  <span className="text-[0.5625rem]" style={bodyFont}>Open</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground/30">
                  <kbd className="text-[0.5rem] px-1 py-0.5 rounded border border-border bg-background" style={{ fontFamily: "'JetBrains Mono', monospace" }}>esc</kbd>
                  <span className="text-[0.5625rem]" style={bodyFont}>Close</span>
                </div>
                {query.trim() && (
                  <span className="text-[0.5625rem] text-muted-foreground/30 ml-auto" style={bodyFont}>
                    {flatResults.length} result{flatResults.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}