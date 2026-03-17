import { useNotion, getRecentlyCompleted, getCriticalMilestones } from "../../lib/notion-context";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plane,
  UtensilsCrossed,
  Users,
  FileText,
  Megaphone,
  Palette,
  ChevronDown,
  Radio,
  Target,
  ArrowRight,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";
import { supabase } from "../../lib/supabase";
import { EmptyState } from "../ui/empty-state";
import { ActivityFeedSkeleton } from "../ui/skeleton-loaders";

import { bodyFont, headingFont } from "../../lib/fonts";

type ActivityCategory = "general" | "menu" | "travel" | "team" | "creative" | "logistics" | "milestones";
type ActivityStatus = "done" | "in-progress" | "alert" | "info";

interface ActivityItem {
  id: string;
  text: string;
  detail?: string;
  author: string;
  timestamp: string;
  category: ActivityCategory;
  status: ActivityStatus;
  chefVisible: boolean;
  teamVisible?: boolean; // if false, hidden from team view (leadership-only staffing/budget items)
  navigateTo?: string; // in-app page to link to
}

const activities: ActivityItem[] = [
  {
    id: "a1",
    text: "Kickoff surveys sent to all 7 chefs",
    detail: "Dietary preferences, ingredient wishlist, and storytelling questions. Responses due by Mar 20.",
    author: "Maria Santos",
    timestamp: "Mar 9, 10:15 AM",
    category: "general",
    status: "in-progress",
    chefVisible: true,
  },
  {
    id: "a2",
    text: "Kitchen rehearsal date confirmed: May 20, 2026",
    detail: "Full run-through at the event venue. All chefs should plan to arrive by May 19.",
    author: "Dio Buan",
    timestamp: "Mar 8, 4:30 PM",
    category: "logistics",
    status: "done",
    chefVisible: true,
    navigateTo: "Event Timeline",
  },
  {
    id: "a3",
    text: "Team Comms channel launched — all rooms live",
    detail: "Chat with the team right inside the hub. Rooms: #general, #kitchen, #travel, #creative, #logistics, #urgent.",
    author: "Sofia Delgado",
    timestamp: "Mar 7, 2:00 PM",
    category: "general",
    status: "done",
    chefVisible: true,
    navigateTo: "Comms",
  },
  {
    id: "a4",
    text: "Menu concept template shared in #kitchen",
    detail: "Use the template to submit your initial dish concept, key ingredients, and plating direction.",
    author: "Dio Buan",
    timestamp: "Mar 7, 11:00 AM",
    category: "menu",
    status: "info",
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "a5",
    text: "Chef Rachel Barril — flight booked (AK Airlines)",
    detail: "Arriving May 19, 10:15 AM. Host housing confirmed at Santos residence.",
    author: "Ana Cruz",
    timestamp: "Mar 6, 3:45 PM",
    category: "travel",
    status: "done",
    chefVisible: true,
    navigateTo: "Travel & Lodging",
  },
  {
    id: "a5b",
    text: "Chef Dio submitted dish concept: Kare-Kare with Smoked Oxtail Marrow",
    detail: "Course 1 — Las Vegas frontier theme. Oxtail slow-smoked over mesquite, peanut sauce infused with local desert sage. Plating: clay bowl, banana leaf garnish.",
    author: "Dio Buan",
    timestamp: "Mar 6, 2:10 PM",
    category: "menu",
    status: "done",
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "a5c",
    text: "Chef Aaron Versoza — ingredients list submitted",
    detail: "Pacific Northwest Tinola: geoduck, spot prawns, malunggay from local farm, green papaya. Requesting specialty: fresh calamansi (10 lbs).",
    author: "Aaron Versoza",
    timestamp: "Mar 6, 12:30 PM",
    category: "menu",
    status: "done",
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "a6",
    text: "Research team assignments draft complete",
    detail: "Historical research assignments per course/region ready for review. Distribution target: Mar 14–18.",
    author: "James Reyes",
    timestamp: "Mar 6, 11:30 AM",
    category: "team",
    status: "in-progress",
    chefVisible: false,
    teamVisible: true,
  },
  {
    id: "a6b",
    text: "Sponsorship deck v3 shared with Jollibee Foods Corp",
    detail: "Platinum tier ($10K) partnership proposal sent. Follow-up call scheduled Mar 18. Contact: VP of Brand Partnerships.",
    author: "Sarah Obal",
    timestamp: "Mar 5, 6:15 PM",
    category: "team",
    status: "in-progress",
    chefVisible: false,
    teamVisible: true,
  },
  {
    id: "a7",
    text: "F&B Lead position — still unfilled",
    detail: "Blocking FOH staffing, beverage program, and service flow. Escalating to external recruiters.",
    author: "Maria Santos",
    timestamp: "Mar 5, 5:00 PM",
    category: "team",
    status: "alert",
    chefVisible: false,
    teamVisible: false,
  },
  {
    id: "a8",
    text: "Brand guidelines v2 published",
    detail: "Updated logo, color palette, and typography for all event materials. Available in Links & Resources.",
    author: "Sofia Delgado",
    timestamp: "Mar 5, 10:00 AM",
    category: "creative",
    status: "done",
    chefVisible: true,
    navigateTo: "Links & Resources",
  },
  {
    id: "a8b",
    text: "Chef Patrice Cleary shared Bibingka Soufflé concept art",
    detail: "Course 4 — French-Filipino fusion representing the Pensionados era. Plating inspired by Embassy dinnerware. Research partner: Armida.",
    author: "Patrice Cleary",
    timestamp: "Mar 4, 4:45 PM",
    category: "creative",
    status: "done",
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "a9",
    text: "Travel booking reminders sent to pending chefs",
    detail: "Chef Christina Q. and Chef Justin Barnes — awaiting flight and lodging confirmations.",
    author: "Ana Cruz",
    timestamp: "Mar 4, 2:15 PM",
    category: "travel",
    status: "in-progress",
    chefVisible: true,
    navigateTo: "Travel & Lodging",
  },
  {
    id: "a9b",
    text: "Photographer confirmed: Luisa Mabini (Manila-based)",
    detail: "Award-winning food photographer. Portfolio includes Eater, Bon Appétit. Arriving May 18 for pre-event coverage. $3,200 package.",
    author: "Kara Reyes",
    timestamp: "Mar 3, 5:30 PM",
    category: "creative",
    status: "done",
    chefVisible: false,
    teamVisible: true,
  },
  {
    id: "a10",
    text: "FOH staffing plan — 200+ guest capacity review",
    detail: "Requires F&B Lead hire before plan can be finalized. Current estimate: 18–22 FOH staff needed.",
    author: "Maria Santos",
    timestamp: "Mar 3, 4:00 PM",
    category: "logistics",
    status: "alert",
    chefVisible: false,
    teamVisible: false,
  },
  {
    id: "a10b",
    text: "Chef Lord Maynard kitchen needs: wood-fired station",
    detail: "Course 7 (1587) — Galleon-Spiced Crispy Pata requires open-flame setup. Requesting portable kamado grill and lump charcoal (50 lbs).",
    author: "Lord Maynard",
    timestamp: "Mar 3, 1:45 PM",
    category: "menu",
    status: "in-progress",
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "a11",
    text: "Venue walkthrough photos uploaded",
    detail: "Kitchen stations, dining layout, and prep areas documented. Available in Content & Media Folder.",
    author: "Carlos Mendoza",
    timestamp: "Mar 2, 1:00 PM",
    category: "logistics",
    status: "done",
    chefVisible: true,
    navigateTo: "Links & Resources",
  },
  {
    id: "a11b",
    text: "Chef Justin Barnes — lechon belly test cook successful",
    detail: "Course 3 — Sakada theme. 12-hour sous vide pork belly with pineapple atchara. Photos shared in #kitchen channel.",
    author: "Justin Barnes",
    timestamp: "Mar 1, 3:20 PM",
    category: "menu",
    status: "done",
    chefVisible: true,
    navigateTo: "Comms",
  },
  {
    id: "a12",
    text: "Chef Patrice Cleary — lodging confirmed (Suite 412)",
    detail: "United DCA → LAS, May 19 6:00 AM. Hotel block booking confirmed.",
    author: "Ana Cruz",
    timestamp: "Mar 1, 11:45 AM",
    category: "travel",
    status: "done",
    chefVisible: true,
    navigateTo: "Travel & Lodging",
  },
  {
    id: "a13",
    text: "Chef Christina Q. shared Shrimp & Bagoong Étouffée story",
    detail: "Course 6 — traces 1763 Manila Village in Louisiana. Cajun-Filipino fusion with fermented shrimp paste and holy trinity. Research: Flerine.",
    author: "Christina Quackenbush",
    timestamp: "Feb 28, 4:00 PM",
    category: "menu",
    status: "done",
    chefVisible: true,
    navigateTo: "Menu & Courses",
  },
  {
    id: "a14",
    text: "Budget forecast v2 — $52K projected total",
    detail: "Key drivers: venue ($8K), food ($15K), travel ($12K), beverages ($5K), creative ($6K), staffing ($4K), contingency ($2K).",
    author: "Jerjon Castillo",
    timestamp: "Feb 27, 2:30 PM",
    category: "logistics",
    status: "done",
    chefVisible: false,
    teamVisible: false,
    navigateTo: "Budget & COGS",
  },
];

const categoryConfig: Record<ActivityCategory, { icon: typeof Clock; label: string; color: string }> = {
  general: { icon: Megaphone, label: "General", color: "#CDA88A" },
  menu: { icon: UtensilsCrossed, label: "Menu", color: "#7E9E78" },
  travel: { icon: Plane, label: "Travel", color: "#4A7FB5" },
  team: { icon: Users, label: "Team", color: "#6B7F8E" },
  creative: { icon: Palette, label: "Creative", color: "#C9A96E" },
  logistics: { icon: FileText, label: "Logistics", color: "#3B6298" },
  milestones: { icon: Target, label: "Milestones", color: "#5DA06B" },
};

const statusIcons: Record<ActivityStatus, { icon: typeof Clock; color: string }> = {
  done: { icon: CheckCircle2, color: "#7E9E78" },
  "in-progress": { icon: Loader2, color: "#CDA88A" },
  alert: { icon: AlertCircle, color: "#C75B3F" },
  info: { icon: Clock, color: "#6B7F8E" },
};

interface ActivityFeedProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function ActivityFeed({ role, onNavigate }: ActivityFeedProps) {
  const isChef = role === "chef";
  const [activeFilter, setActiveFilter] = useState<ActivityCategory | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [liveEntries, setLiveEntries] = useState<ActivityItem[]>([]);
  const { milestones: notionMilestones, isLive: notionLive } = useNotion();

  // Build Notion milestone activity entries for leadership
  const notionEntries: ActivityItem[] = [];
  if (notionLive && !isChef) {
    const completed = getRecentlyCompleted(notionMilestones).slice(0, 5);
    for (const m of completed) {
      notionEntries.push({
        id: `notion-done-${m.id}`,
        text: `${m.milestone} — completed`,
        detail: m.blocksAndDeps || (m.owner ? `Owner: ${m.owner}` : undefined),
        author: m.owner || "Notion",
        timestamp: m.division || "IK26 Path",
        category: "milestones",
        status: "done",
        chefVisible: false,
      });
    }
    const criticals = getCriticalMilestones(notionMilestones).slice(0, 3);
    for (const m of criticals) {
      const statusLabel = m.status?.includes("CRITICAL") ? "CRITICAL" : "Overdue";
      notionEntries.push({
        id: `notion-crit-${m.id}`,
        text: `${m.milestone} — ${statusLabel}`,
        detail: m.blocksAndDeps || (m.owner ? `Owner: ${m.owner}` : undefined),
        author: m.owner || "Notion",
        timestamp: m.division || "IK26 Path",
        category: "milestones",
        status: "alert",
        chefVisible: false,
      });
    }
  }

  // Listen for real-time submission updates → inject live activity entries
  useEffect(() => {
    if (isChef) return; // Only leadership sees live submission entries

    const channel = supabase.channel("ik26-chef-submissions-feed");
    channel.on("broadcast", { event: "submission-update" }, (payload) => {
      const update = payload.payload as {
        userId: string;
        displayName: string;
        submissions: Record<string, Record<string, string>>;
        updatedAt: string;
      };
      if (!update?.displayName) return;

      // Build a description of what was updated
      const sections: string[] = [];
      if (update.submissions?.concept) {
        const dishName = update.submissions.concept?.dishName?.trim();
        sections.push(dishName ? `dish concept "${dishName}"` : "dish concept");
      }
      if (update.submissions?.ingredients) {
        const hasContent = Object.values(update.submissions.ingredients).some((v) => typeof v === "string" && v.trim());
        if (hasContent) sections.push("ingredients");
      }
      if (update.submissions?.kitchen) {
        const hasContent = Object.values(update.submissions.kitchen).some((v) => typeof v === "string" && v.trim());
        if (hasContent) sections.push("kitchen needs");
      }

      const description = sections.length > 0
        ? `${update.displayName} updated ${sections.join(", ")}`
        : `${update.displayName} updated their submission`;

      const now = new Date();
      const newEntry: ActivityItem = {
        id: `live-${update.userId}-${now.getTime()}`,
        text: description,
        detail: `Submission auto-saved at ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. View full details in Menu & Courses → Submission Tracker.`,
        author: update.displayName,
        timestamp: now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        category: "menu",
        status: "done",
        chefVisible: false,
      };

      setLiveEntries((prev) => {
        // Deduplicate — only keep one live entry per chef (most recent)
        const filtered = prev.filter((e) => !e.id.startsWith(`live-${update.userId}-`));
        return [newEntry, ...filtered].slice(0, 10); // Keep max 10 live entries
      });
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isChef]);

  // Combine live entries + notion entries + static entries
  const allActivities = [...liveEntries, ...notionEntries, ...activities];

  const roleFiltered = isChef
    ? allActivities.filter((a) => a.chefVisible)
    : role === "team"
      ? allActivities.filter((a) => a.teamVisible !== false)
      : allActivities;

  const filtered = activeFilter === "all"
    ? roleFiltered
    : roleFiltered.filter((a) => a.category === activeFilter);

  const displayItems = showAll ? filtered : filtered.slice(0, 4);
  const hasMore = filtered.length > 4;

  // Categories that have items
  const activeCategories = [...new Set(roleFiltered.map((a) => a.category))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h3 className="text-foreground" style={headingFont}>
              Activity Feed
            </h3>
            <span
              className="text-[0.625rem] px-2 py-0.5 rounded-full bg-gold/10 text-gold"
              style={bodyFont}
            >
              {roleFiltered.length} updates
            </span>
            {notionLive && !isChef && notionEntries.length > 0 && (
              <span
                className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(93,160,107,0.1)", color: "#5DA06B", ...bodyFont }}
              >
                <Target className="w-2 h-2" />
                +{notionEntries.length} from Notion
              </span>
            )}
          </div>
          <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
            Last 7 days
          </span>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-[0.6875rem] transition-colors cursor-pointer shrink-0 ${
              activeFilter === "all"
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
            }`}
            style={bodyFont}
          >
            All
          </button>
          {activeCategories.map((cat) => {
            const cfg = categoryConfig[cat];
            const isActive = activeFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(isActive ? "all" : cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "border"
                    : "bg-secondary/60 text-muted-foreground border border-transparent hover:border-border"
                }`}
                style={isActive ? {
                  backgroundColor: `${cfg.color}12`,
                  borderColor: `${cfg.color}30`,
                  color: cfg.color,
                  ...bodyFont,
                } : bodyFont}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-border/40">
        {displayItems.map((item, idx) => {
          const catCfg = categoryConfig[item.category];
          const statusCfg = statusIcons[item.status];
          const StatusIcon = statusCfg.icon;
          const CatIcon = catCfg.icon;
          const isExpanded = expandedItem === item.id;
          const isLive = item.id.startsWith("live-");

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 + idx * 0.03 }}
            >
              <button
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                className="w-full text-left px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                style={isLive ? { backgroundColor: "rgba(34,197,94,0.03)" } : undefined}
              >
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 relative"
                    style={{ backgroundColor: isLive ? "rgba(34,197,94,0.1)" : `${statusCfg.color}12` }}
                  >
                    {isLive ? (
                      <Radio className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                    ) : (
                      <StatusIcon
                        className={`w-3.5 h-3.5 ${item.status === "in-progress" ? "animate-spin" : ""}`}
                        style={{ color: statusCfg.color }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-foreground text-[0.8125rem]" style={bodyFont}>
                        {item.text}
                      </span>
                      <span
                        className="text-[0.5rem] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                        style={{
                          backgroundColor: `${catCfg.color}0D`,
                          color: catCfg.color,
                          ...bodyFont,
                        }}
                      >
                        <CatIcon className="w-2.5 h-2.5" />
                        {catCfg.label}
                      </span>
                      {isLive && (
                        <span
                          className="text-[0.5rem] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                          style={{
                            backgroundColor: "rgba(34,197,94,0.08)",
                            color: "#16a34a",
                            border: "1px solid rgba(34,197,94,0.15)",
                            ...bodyFont,
                          }}
                        >
                          <Radio className="w-2 h-2" />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                      <span>{item.author}</span>
                      <span className="opacity-30">·</span>
                      <span className="opacity-70">{item.timestamp}</span>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && item.detail && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p
                            className="text-muted-foreground text-[0.75rem] mt-2 leading-relaxed"
                            style={bodyFont}
                          >
                            {item.detail}
                          </p>
                          {item.navigateTo && onNavigate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(item.navigateTo!);
                              }}
                              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-[0.6875rem] transition-colors hover:opacity-80 cursor-pointer"
                              style={{
                                backgroundColor: `${catCfg.color}0D`,
                                color: catCfg.color,
                                border: `1px solid ${catCfg.color}20`,
                                ...bodyFont,
                              }}
                            >
                              Go to {item.navigateTo}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Expand indicator */}
                  {item.detail && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-1 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Show more */}
      {hasMore && (
        <div className="px-5 py-3 border-t border-border/40">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 w-full justify-center py-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer text-muted-foreground"
          >
            <span className="text-[0.75rem]" style={bodyFont}>
              {showAll ? "Show less" : `Show ${filtered.length - 4} more updates`}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <EmptyState
          variant="activity"
          title="No updates yet"
          description={activeFilter === "all" ? "Activity will appear here as the team prepares for the event." : `No ${categoryConfig[activeFilter as ActivityCategory]?.label || ""} updates right now.`}
          action={activeFilter !== "all" ? { label: "Show all updates", onClick: () => setActiveFilter("all") } : undefined}
        />
      )}
    </motion.div>
  );
}