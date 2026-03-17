import type { UserRole } from "./onboarding/use-auth";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Link2,
  ExternalLink,
  FileText,
  FolderOpen,
  BookOpen,
  Layout,
  MessageSquare,
  Calendar,
  ClipboardList,
  Video,
  Image,
  Globe,
  Clock,
  ArrowRight,
} from "lucide-react";
import { getVisibleNavItems } from "./onboarding/use-auth";

import { bodyFont, headingFont } from "../lib/fonts";

interface ResourceLink {
  title: string;
  description: string;
  url: string;
  icon: typeof FileText;
  category: string;
  pinned?: boolean;
  internalNav?: string; // if set, navigates to this in-app page instead of opening url
}

const resources: ResourceLink[] = [
  {
    title: "Event Overview Deck",
    description: "Master presentation — vision, lineup, timeline, and logistics.",
    url: "https://www.canva.com/design/DAHDbuedjDg/5FyH2zp979AW7sdKx5BN_w/view?utm_content=DAHDbuedjDg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h376297da25",
    icon: FileText,
    category: "Planning",
    pinned: true,
  },
  {
    title: "IK26 Master Notion Workspace",
    description: "Central hub — all project docs, meeting notes, and task boards.",
    url: "",
    icon: Layout,
    category: "Workspace",
    pinned: true,
    internalNav: "Notion Admin",
  },
  {
    title: "Event Production Timeline",
    description: "All milestones, deadlines, and dependencies to event night.",
    url: "",
    icon: Calendar,
    category: "Planning",
    pinned: true,
    internalNav: "Event Timeline",
  },
  {
    title: "Chef Onboarding Responses",
    description: "Survey responses — dietary, ingredients, contact info.",
    url: "",
    icon: ClipboardList,
    category: "Onboarding",
    pinned: true,
    internalNav: "Chef Roster",
  },
  {
    title: "Menu Development Doc",
    description: "All 8 courses — concepts, ingredients, plating notes.",
    url: "",
    icon: FileText,
    category: "Menu",
    internalNav: "Menu & Courses",
  },
  {
    title: "Historical Research Library",
    description: "Research per region — articles, books, archival references.",
    url: "",
    icon: BookOpen,
    category: "Research",
    internalNav: "Research & Story",
  },
  {
    title: "Brand & Visual Identity Guide",
    description: "Logo files, color palette, typography, and usage guidelines.",
    url: "#",
    icon: Image,
    category: "Creative",
  },
  {
    title: "Team Communication Channel",
    description: "Real-time team chat — #general, #kitchen, #logistics, and more.",
    url: "",
    icon: MessageSquare,
    category: "Communication",
    internalNav: "Comms",
  },
  {
    title: "IK26 Discord Server",
    description: "Join the Isang Kusina community on Discord for real-time voice, text, and updates.",
    url: "https://discord.gg/eQyaK4Pd",
    icon: MessageSquare,
    category: "Communication",
    pinned: true,
  },
  {
    title: "Budget Tracking Spreadsheet",
    description: "Live budget lines, purchase orders, receipts, and projections.",
    url: "",
    icon: ClipboardList,
    category: "Finance",
    internalNav: "Budget & COGS",
  },
  {
    title: "Venue Floor Plan & Kitchen Layout",
    description: "Event space drawings — dining room, kitchen stations, service flow.",
    url: "#",
    icon: FolderOpen,
    category: "Venue",
  },
  {
    title: "Content & Media Folder",
    description: "Photos, videos, social assets, and press materials.",
    url: "#",
    icon: Video,
    category: "Creative",
  },
  {
    title: "Guest List & RSVP Tracker",
    description: "Guest list with RSVP status, dietary restrictions, table assignments.",
    url: "#",
    icon: ClipboardList,
    category: "Guest Management",
  },
  {
    title: "Vendor Contacts & Contracts",
    description: "All vendor agreements — AV, rentals, florals, printing.",
    url: "#",
    icon: FileText,
    category: "Vendors",
  },
  {
    title: "IK26 Public Website",
    description: "Event page — tickets, chef profiles, event details.",
    url: "https://isangkusina.com",
    icon: Globe,
    category: "Public",
  },
  {
    title: "Team Deployment & Roles",
    description: "Team assignments, responsibilities, and day-of roles.",
    url: "",
    icon: ClipboardList,
    category: "Team",
    internalNav: "Team Deploy",
  },
  {
    title: "Team Task Board",
    description: "Assigned tasks, deadlines, and progress at a glance.",
    url: "",
    icon: ClipboardList,
    category: "Team",
    internalNav: "Dashboard",
  },
];

// Chef-visible categories
const chefCategories = ["Menu", "Creative", "Research", "Public", "Communication"];

// Team-visible categories (team sees everything except Finance and Guest Management which are leadership-only)
const teamCategories = ["Workspace", "Planning", "Onboarding", "Menu", "Research", "Creative", "Communication", "Venue", "Public", "Team"];

// Primary filter categories (the ones that matter most)
const filterCategories = ["Menu", "Research", "Creative", "Communication", "Finance", "Venue", "Team"];

// Get all unique categories from non-pinned resources
const allCategories = [...new Set(resources.filter((r) => !r.pinned).map((r) => r.category))];

interface LinksResourcesProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function LinksResources({ role, onNavigate }: LinksResourcesProps) {
  const isChef = role === "chef";
  const isTeam = role === "team";
  const isLeadership = role === "leadership";
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Get list of accessible pages for this role
  const allPageLabels = resources.filter((r) => r.internalNav).map((r) => r.internalNav!);
  const visiblePages = new Set(getVisibleNavItems(role, allPageLabels));
  // Always allow Dashboard
  visiblePages.add("Dashboard");

  // Filter resources based on role
  // For soft launch: hide URL-pending items (#) from non-leadership roles
  // Also hide items whose internalNav targets pages hidden from this role
  const roleFilteredResources = isChef
    ? resources.filter((r) => chefCategories.includes(r.category) && (
        (r.internalNav && visiblePages.has(r.internalNav)) || (!r.internalNav && r.url && r.url !== "#")
      ))
    : isTeam
      ? resources.filter((r) => teamCategories.includes(r.category) && (
          (r.internalNav && visiblePages.has(r.internalNav)) || (!r.internalNav && r.url && r.url !== "#")
        ))
      : resources;

  const pinned = roleFilteredResources.filter((r) => r.pinned);
  const unpinned = roleFilteredResources.filter((r) => !r.pinned);

  // Role-aware filter categories
  const availableFilterCategories = isChef
    ? filterCategories.filter((c) => chefCategories.includes(c))
    : isTeam
      ? filterCategories.filter((c) => teamCategories.includes(c))
      : filterCategories;
  const availableAllCategories = [...new Set(unpinned.map((r) => r.category))];

  // Filtered resources
  const filteredResources = activeFilter === "all"
    ? unpinned
    : unpinned.filter((r) => r.category === activeFilter);

  // Group by category for display
  const groupedResources: Record<string, ResourceLink[]> = {};
  filteredResources.forEach((r) => {
    if (!groupedResources[r.category]) groupedResources[r.category] = [];
    groupedResources[r.category].push(r);
  });
  const categoryOrder = Object.keys(groupedResources).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-5 h-5 text-gold" />
          <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
            Links & Resources
          </h2>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          All working docs, references, and key links in one place.
        </p>
      </motion.div>

      {/* Pinned — only show if there are pinned items for this role */}
      {pinned.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="bg-card rounded-xl p-5"
          style={{ border: "1px solid rgba(205,168,138,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h3 className="text-foreground" style={headingFont}>Pinned</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pinned.map((link, idx) => {
              const Icon = link.icon;
              const isInternal = !!link.internalNav;
              const isPending = !isInternal && (!link.url || link.url === "#");
              return (
                <motion.div
                  key={link.title}
                  onClick={() => {
                    if (!isPending) {
                      if (isInternal && onNavigate) {
                        onNavigate(link.internalNav!);
                      } else if (!isInternal) {
                        window.open(link.url, "_blank", "noopener,noreferrer");
                      }
                    }
                  }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  whileHover={isPending ? {} : { y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(205,168,138,0.2)" }}
                  className={`group p-4 rounded-xl ${isPending ? "cursor-default" : "cursor-pointer"}`}
                  style={{ border: "1px solid rgba(205,168,138,0.15)", backgroundColor: "rgba(205,168,138,0.05)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gold" />
                    </div>
                    {isPending ? (
                      <span
                        className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(107,127,142,0.08)", color: "#6B7F8E", ...bodyFont }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        URL pending
                      </span>
                    ) : isInternal ? (
                      <span
                        className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: "rgba(26,92,56,0.08)", color: "#1A5C38", ...bodyFont }}
                      >
                        <ArrowRight className="w-2.5 h-2.5" />
                        Open
                      </span>
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 text-gold/40 group-hover:text-gold transition-colors" />
                    )}
                  </div>
                  <h4 className="text-foreground text-[0.875rem] mb-1" style={headingFont}>
                    {link.title}
                  </h4>
                  <p className="text-muted-foreground text-[0.75rem] leading-relaxed" style={bodyFont}>
                    {link.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filter buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="flex flex-wrap gap-2"
      >
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 rounded-lg text-[0.8125rem] transition-colors cursor-pointer ${
            activeFilter === "all"
              ? "bg-gold/15 text-gold border border-gold/30"
              : "bg-secondary text-muted-foreground border border-border hover:border-gold/20"
          }`}
          style={bodyFont}
        >
          All
        </button>
        {availableFilterCategories.map((cat) => {
          // Only show the filter if at least one unpinned resource has this category
          const hasResources = unpinned.some((r) => r.category === cat);
          if (!hasResources) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(activeFilter === cat ? "all" : cat)}
              className={`px-4 py-2 rounded-lg text-[0.8125rem] transition-colors cursor-pointer ${
                activeFilter === cat
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-secondary text-muted-foreground border border-border hover:border-gold/20"
              }`}
              style={bodyFont}
            >
              {cat}
            </button>
          );
        })}
        {/* Show remaining categories not in the primary filter list */}
        {availableAllCategories
          .filter((c) => !availableFilterCategories.includes(c))
          .map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(activeFilter === cat ? "all" : cat)}
              className={`px-4 py-2 rounded-lg text-[0.8125rem] transition-colors cursor-pointer ${
                activeFilter === cat
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "bg-secondary text-muted-foreground border border-border hover:border-gold/20"
              }`}
              style={bodyFont}
            >
              {cat}
            </button>
          ))}
      </motion.div>

      {/* Grouped resources */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="space-y-5"
      >
        {categoryOrder.map((category) => {
          const items = groupedResources[category];
          return (
            <div key={category} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-gold/60" />
                <h4 className="text-foreground text-[0.875rem]" style={headingFont}>{category}</h4>
                <span className="text-muted-foreground text-[0.6875rem] ml-auto" style={bodyFont}>
                  {items.length} {items.length === 1 ? "link" : "links"}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((link, idx) => {
                  const Icon = link.icon;
                  const isInternal = !!link.internalNav;
                  const isPending = !isInternal && (!link.url || link.url === "#");
                  return (
                    <motion.div
                      key={link.title}
                      onClick={() => {
                        if (!isPending) {
                          if (isInternal && onNavigate) {
                            onNavigate(link.internalNav!);
                          } else if (!isInternal) {
                            window.open(link.url, "_blank", "noopener,noreferrer");
                          }
                        }
                      }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.03 }}
                      whileHover={isPending ? {} : { x: 2 }}
                      className={`group flex items-center gap-4 py-3 px-4 rounded-lg ${isPending ? "cursor-default" : "cursor-pointer hover:bg-secondary/50"}`}
                      style={{ backgroundColor: "rgba(221,207,195,0.3)" }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/15 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-foreground text-[0.8125rem] truncate" style={bodyFont}>
                          {link.title}
                        </h4>
                        <p className="text-muted-foreground text-[0.75rem] truncate" style={bodyFont}>
                          {link.description}
                        </p>
                      </div>
                      {isPending ? (
                        <span
                          className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                          style={{ backgroundColor: "rgba(107,127,142,0.08)", color: "#6B7F8E", ...bodyFont }}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          Pending
                        </span>
                      ) : isInternal ? (
                        <span
                          className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                          style={{ backgroundColor: "rgba(26,92,56,0.08)", color: "#1A5C38", ...bodyFont }}
                        >
                          <ArrowRight className="w-2.5 h-2.5" />
                          Open
                        </span>
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-gold transition-colors shrink-0" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredResources.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
              No resources match this filter.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}