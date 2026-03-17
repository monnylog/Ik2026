import { useNotion, getCriticalMilestones, getInProgressMilestones, getUpcomingThisWeek } from "../lib/notion-context";
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  Plane,
  Users,
  ChefHat,
  Calendar,
  UtensilsCrossed,
  ArrowRight,
  BookOpen,
  MessageCircle,
  ClipboardList,
  Wifi,
  WifiOff,
  ExternalLink,
  Flag,
  Rocket,
  Camera,
  User,
  ChevronDown,
  ChevronRight,
  Gavel,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { useNotionDatabase } from "../lib/notion-sync";
import { transformDecision } from "../lib/notion-transforms";

import { bodyFont, headingFont } from "../lib/fonts";

interface ActionItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: string;
  icon: typeof AlertTriangle;
  chefVisible?: boolean;
  teamVisible?: boolean; // if false, hidden from team view (leadership-only items like budget/staffing)
  navigateTo?: string; // page to navigate to when clicked
}

const actionItems: ActionItem[] = [
  // ── Open Decisions (matching real Notion data) ──
  {
    id: "fb-director",
    title: "F&B Lead / Events Director (Mariana) — Decision Needed",
    description: "Events Director role currently TBD. Mariana is top candidate per Monny & Walbert. Melvin held this in Y1+Y2. Single biggest operational gap — blocks FOH/BOH coordination and vendor management.",
    severity: "critical",
    category: "Staffing",
    icon: Users,
    chefVisible: false,
    teamVisible: false,
    navigateTo: "Team Deploy",
  },
  {
    id: "bev-director",
    title: "Beverage Director — Assign (Cy or Aria)",
    description: "Y2 had Cy, Aria, Gary (Seattle) as mixologists. Cy is suggested Y3 lead but unconfirmed. Blocks course pairings, bar setup, non-alcoholic program, and glassware coordination.",
    severity: "critical",
    category: "Staffing",
    icon: Users,
    chefVisible: false,
    teamVisible: false,
    navigateTo: "Team Deploy",
  },
  {
    id: "kma-venue-deposit",
    title: "KMA Venue Date & Deposit — Lock May 22",
    description: "May 22, 2026 at Keep Memory Alive Event Center. Awaiting Gina's venue pricing quote. Deposit required to lock date. Blocks insurance, production timeline, and all vendor contracts.",
    severity: "critical",
    category: "Venue",
    icon: Calendar,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Event Timeline",
  },
  {
    id: "kasama-decision",
    title: "Kasama Outreach — Timothy Flores Decision",
    description: "Route through Max's Chicago owner connection. Dual option: keynote speaker or cooking chef. Decision deadline Mar 25. If cooking, bumps to 8 chefs/courses.",
    severity: "critical",
    category: "Chef",
    icon: ChefHat,
    chefVisible: false,
    teamVisible: false,
    navigateTo: "Menu & Courses",
  },
  {
    id: "day-of-coordinator",
    title: "Day-of Coordinator (Jerjon) — Confirm Role",
    description: "Jerjon proposed for Day-of Coordinator. Also handling documentary/film with Ayce and narrative writing. JJ as backup. Needs formal confirmation to finalize run-of-show ownership.",
    severity: "critical",
    category: "Staffing",
    icon: Users,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Team Deploy",
  },
  {
    id: "save-the-date",
    title: "Save-the-Date Graphic — Overdue (was Mar 7)",
    description: "Need graphic from Denise: 'May 22 / Las Vegas / Isang Kusina: Year Three'. Kara to publish on social.",
    severity: "critical",
    category: "Marketing",
    icon: MessageCircle,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Links & Resources",
  },
  {
    id: "gina-followup",
    title: "Gina Follow-Up — KMA Venue Quote (In Progress)",
    description: "Text/email sent: 'Building budget this week, your number is the anchor.' Awaiting response for venue pricing.",
    severity: "warning",
    category: "Venue",
    icon: Calendar,
    chefVisible: false,
    teamVisible: false,
    navigateTo: "Budget & COGS",
  },
  {
    id: "andrew-confirm",
    title: "Andrew Dizon Availability — Confirm by Mar 14",
    description: "Head of Research for all of Y2. If unavailable, JJ absorbs. Blocks all 7 researcher–chef pairings.",
    severity: "warning",
    category: "Research",
    icon: BookOpen,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Research & Story",
  },
  {
    id: "chef-agreements",
    title: "Chef Participation Agreements — Send by Mar 14",
    description: "$500 honorarium, travel terms, dietary/equipment form, dish deadline (Apr 29), Drive folder link.",
    severity: "warning",
    category: "Chef",
    icon: ClipboardList,
    chefVisible: false,
    teamVisible: false,
    navigateTo: "Menu & Courses",
  },
  {
    id: "research-assignments",
    title: "Research Partnerships — Assign Mar 14–18",
    description: "7 researcher–chef pairings needed. Andrew (lead), JJ, Armida, Ava (2 chefs), Flerine (2 chefs).",
    severity: "warning",
    category: "Research",
    icon: BookOpen,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Research & Story",
  },
  {
    id: "whatsapp-group",
    title: "WhatsApp Chef Group — Create by Mar 14",
    description: "Add all 7 confirmed chefs + Walbert + F&B Lead. Y2 used WhatsApp for all chef coordination.",
    severity: "warning",
    category: "Comms",
    icon: MessageCircle,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Comms",
  },
  {
    id: "tickets-on-sale",
    title: "Tickets On Sale — Mar 21–22",
    description: "GA $150 (bev included) / VIP $275 / Kapamilya Table $2,500. Coordinate social blitz from all chef accounts nationally.",
    severity: "info",
    category: "Marketing",
    icon: Calendar,
    chefVisible: false,
    teamVisible: true,
    navigateTo: "Event Timeline",
  },
  // ── Chef-visible items ──
  {
    id: "menu-concepts",
    title: "Menu Concept Drafts Due -- Round 1 by Mar 28",
    description: "Submit your proposed course, ingredient list, and plating concept to your Drive subfolder.",
    severity: "warning",
    category: "Menu",
    icon: UtensilsCrossed,
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "ingredient-list",
    title: "Submit Your Ingredient Wishlist",
    description: "Key ingredients, specialty items, and sourcing preferences so procurement can begin ordering. Receipts required for off-site prep.",
    severity: "warning",
    category: "Kitchen",
    icon: ClipboardList,
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "research-connect",
    title: "Connect with Your Research Partner",
    description: "Reach out to your assigned researcher to discuss historical context and storytelling for your course.",
    severity: "info",
    category: "Research",
    icon: BookOpen,
    chefVisible: true,
    navigateTo: "Comms",
  },
  {
    id: "chef-questionnaire",
    title: "Complete Chef Questionnaire & Logistics Form",
    description: "Travel info, dietary restrictions, shirt size, lodging preference, plus 6 storytelling questions for your course narrative.",
    severity: "info",
    category: "Onboarding",
    icon: ChefHat,
    chefVisible: true,
    navigateTo: "Settings",
  },
  {
    id: "dish-deadline",
    title: "Final Dish Deadline -- Apr 29",
    description: "All 7 courses must be locked with finalized recipes, plating, and allergen documentation.",
    severity: "info",
    category: "Menu",
    icon: UtensilsCrossed,
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
];

// Static chef-visible items (these don't come from Notion)
const chefActionItems: ActionItem[] = actionItems.filter((i) => i.chefVisible);

// Division to icon mapping for Notion milestones
function iconForDivision(division: string | null): typeof AlertTriangle {
  const map: Record<string, typeof AlertTriangle> = {
    Ops: Rocket,
    Creative: Camera,
    Restaurant: UtensilsCrossed,
    Marketing: Flag,
    Finance: Calendar,
    Production: Users,
    Research: BookOpen,
    Beverage: UtensilsCrossed,
    Sponsorships: Rocket,
  };
  return (division && map[division]) || AlertTriangle;
}

function divisionToCategory(division: string | null): string {
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

function formatDueDate(isoDate: string | null): string {
  if (!isoDate) return "";
  const d = new Date(isoDate + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const severityConfig = {
  critical: {
    border: "1px solid rgba(43,68,100,0.3)",
    bg: "rgba(43,68,100,0.05)",
    dotBg: "rgba(43,68,100,0.12)",
    color: "text-destructive",
    label: "Critical",
  },
  warning: {
    border: "1px solid rgba(205,168,138,0.25)",
    bg: "rgba(205,168,138,0.03)",
    dotBg: "rgba(205,168,138,0.12)",
    color: "text-gold",
    label: "Pending",
  },
  info: {
    border: "1px solid rgba(74,127,181,0.2)",
    bg: "rgba(74,127,181,0.03)",
    dotBg: "rgba(74,127,181,0.1)",
    color: "text-info",
    label: "Upcoming",
  },
};

interface ActionNeededProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function ActionNeeded({ role, onNavigate }: ActionNeededProps) {
  const isChef = role === "chef";
  const { milestones: notionMilestones, isLive, isLoading } = useNotion();
  const { items: decisionItems } = useNotionDatabase("decisions");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["critical", "warning"]));

  // Build live action items from shared Notion context
  const liveItems: ActionItem[] = [];

  // ── Inject Open Decisions from Notion decisions database ──
  if (!isChef && decisionItems.length > 0) {
    for (const raw of decisionItems) {
      const d = transformDecision(raw);
      if (!d.title) continue;
      const confirmedText = d.confirmed ? ` — Confirmed: ${d.confirmed}` : "";
      const proposedText = d.proposed ? ` Proposed: ${d.proposed}` : "";
      liveItems.push({
        id: d._notionId || d.id,
        title: `${d.title}${d.dueDate ? ` — Decision by ${d.dueDate}` : ""}`,
        description: `${d.description || ""}${proposedText}${confirmedText}`.trim() || "Open decision needing resolution",
        severity: d.severity || (d.status?.toLowerCase().includes("confirm") ? "info" : "critical"),
        category: "Decision",
        icon: Gavel,
        chefVisible: false,
        teamVisible: true,
        navigateTo: "Event Timeline",
      });
    }
  }

  if (isLive && !isChef) {
    const criticals = getCriticalMilestones(notionMilestones);
    for (const m of criticals) {
      const due = formatDueDate(m.dueDate);
      const statusLabel = m.status?.includes("CRITICAL") ? "CRITICAL" : "Overdue";
      liveItems.push({
        id: m.id,
        title: `${m.milestone}${due ? ` -- ${statusLabel} (${due})` : ` -- ${statusLabel}`}`,
        description: m.blocksAndDeps || (m.owner ? `Owner: ${m.owner}` : "No description"),
        severity: "critical",
        category: divisionToCategory(m.division),
        icon: iconForDivision(m.division),
        chefVisible: false,
        navigateTo: "Event Timeline",
      });
    }

    const inProgress = getInProgressMilestones(notionMilestones);
    for (const m of inProgress) {
      const due = formatDueDate(m.dueDate);
      liveItems.push({
        id: m.id,
        title: `${m.milestone}${due ? ` -- In Progress (due ${due})` : " -- In Progress"}`,
        description: m.blocksAndDeps || (m.owner ? `Owner: ${m.owner}` : "No description"),
        severity: "warning",
        category: divisionToCategory(m.division),
        icon: iconForDivision(m.division),
        chefVisible: false,
        navigateTo: "Event Timeline",
      });
    }

    const upcoming = getUpcomingThisWeek(notionMilestones);
    for (const m of upcoming) {
      const due = formatDueDate(m.dueDate);
      liveItems.push({
        id: m.id,
        title: `${m.milestone}${due ? ` -- Due ${due}` : ""}`,
        description: m.blocksAndDeps || (m.owner ? `Owner: ${m.owner}` : "Coming up this week"),
        severity: "info",
        category: divisionToCategory(m.division),
        icon: iconForDivision(m.division),
        chefVisible: false,
        navigateTo: "Event Timeline",
      });
    }
  }

  // Determine visible items
  const visibleItems = isChef
    ? chefActionItems
    : isLive
      ? liveItems
      : role === "team"
        ? actionItems.filter((i) => !i.chefVisible && i.teamVisible !== false)
        : actionItems.filter((i) => !i.chefVisible);

  const criticalItems = visibleItems.filter((i) => i.severity === "critical");
  const warningItems = visibleItems.filter((i) => i.severity === "warning");
  const infoItems = visibleItems.filter((i) => i.severity === "info");

  if (visibleItems.length === 0) return null;

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const severityGroups = [
    { key: "critical", label: "Critical", items: criticalItems, cfg: severityConfig.critical, icon: AlertTriangle },
    { key: "warning", label: "In Progress", items: warningItems, cfg: severityConfig.warning, icon: Clock },
    { key: "info", label: "Upcoming", items: infoItems, cfg: severityConfig.info, icon: AlertCircle },
  ].filter((g) => g.items.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl p-5"
      style={{ border: isChef ? "1px solid rgba(205,168,138,0.2)" : "1px solid rgba(43,68,100,0.2)" }}
    >
      {/* Compact header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: isChef ? "#CDA88A" : "#3B6298" }} />
          <h3 className="text-foreground" style={headingFont}>
            {isChef ? "Your Action Items" : "Action Needed"}
          </h3>
          {!isChef && (
            <span
              className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: isLive ? "rgba(93,160,107,0.1)" : "rgba(107,127,142,0.1)",
                color: isLive ? "#5DA06B" : "#6B7F8E",
                ...bodyFont,
              }}
            >
              {isLive ? <Wifi className="w-2 h-2" /> : <WifiOff className="w-2 h-2" />}
              {isLive ? "Live" : "Static"}
            </span>
          )}
        </div>
        {/* Inline severity summary badges */}
        <div className="flex items-center gap-1.5">
          {criticalItems.length > 0 && (
            <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1" style={bodyFont}>
              {criticalItems.length}
            </span>
          )}
          {warningItems.length > 0 && (
            <span className="text-[0.625rem] px-2 py-0.5 rounded-full bg-gold/10 text-gold flex items-center gap-1" style={bodyFont}>
              {warningItems.length}
            </span>
          )}
          {infoItems.length > 0 && (
            <span className="text-[0.625rem] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ backgroundColor: "rgba(74,127,181,0.1)", color: "#4A7FB5", ...bodyFont }}>
              {infoItems.length}
            </span>
          )}
          <span className="text-muted-foreground text-[0.6875rem] ml-1" style={bodyFont}>
            total {visibleItems.length}
          </span>
        </div>
      </div>

      {/* Severity groups */}
      <div className="space-y-2">
        {severityGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.key);
          const GroupIcon = group.icon;
          return (
            <div key={group.key} className="rounded-lg overflow-hidden" style={{ border: group.cfg.border }}>
              {/* Group header — always visible */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer transition-colors hover:opacity-90"
                style={{ backgroundColor: group.cfg.bg }}
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: group.cfg.dotBg }}>
                  <GroupIcon className={`w-3 h-3 ${group.cfg.color}`} />
                </div>
                <span className={`text-[0.8125rem] font-medium ${group.cfg.color}`} style={bodyFont}>
                  {group.label}
                </span>
                <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </span>
                <div className="ml-auto">
                  {isExpanded
                    ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>

              {/* Group items — collapsible */}
              {isExpanded && (
                <div className="divide-y" style={{ borderColor: `${group.cfg.dotBg}` }}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const hasLink = !!item.navigateTo && !!onNavigate;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 py-2 px-3.5 transition-colors group ${hasLink ? "cursor-pointer hover:bg-secondary/20" : "cursor-default"}`}
                        style={{ backgroundColor: "transparent" }}
                        onClick={() => { if (hasLink) onNavigate!(item.navigateTo!); }}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${group.cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-foreground text-[0.8125rem] truncate block" style={bodyFont}>
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[0.5625rem] px-1.5 py-0.5 rounded shrink-0 bg-secondary text-muted-foreground" style={bodyFont}>
                          {item.category}
                        </span>
                        {hasLink && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-gold transition-colors shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}