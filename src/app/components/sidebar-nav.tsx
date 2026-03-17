import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Plane,
  UtensilsCrossed,
  UserCheck,
  BookOpen,
  DollarSign,
  Link2,
  Heart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  ChefHat,
  MessageCircle,
  Mic,
  Settings,
  UsersRound,
  Clock,
  Star,
  GripVertical,
  ListChecks,
  Tag,
  CalendarClock,
  ClipboardList,
  Sparkles,
  Share2,
  Inbox,
  Database,
  Handshake,
  Receipt,
  BarChart3,
  FileText,
  Wallet,
  Flame,
  ScrollText,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { getVisibleNavItemsForView, type ViewMode } from "./onboarding/use-auth";
import { getAvatar } from "./engagement/avatars";
import istoryaLogo from "figma:asset/b55bcac066687e563f77685fc31f20ef43e81d5d.png";
import { type RecentPage, getPageIcon, formatRecentTime } from "./ui/recent-pages";
import type { FavoritePage } from "./ui/favorites";
import { APP_VERSION } from "../lib/version";

const allNavItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: MessageCircle, label: "Comms" },
  { icon: Mic, label: "Our Istoryas" },
  { icon: CalendarDays, label: "Event Timeline" },
  { icon: Users, label: "Chef Roster" },
  { icon: UserCheck, label: "Team Deploy" },
  { icon: Heart, label: "Community" },
  { icon: Shield, label: "Members" },
  { icon: Plane, label: "Travel & Lodging", shortLabel: "Travel" },
  { icon: UtensilsCrossed, label: "Menu & Courses", shortLabel: "Menu" },
  { icon: DollarSign, label: "Budget & COGS" },
  { icon: Receipt, label: "Expenses" },
  { icon: BarChart3, label: "Finance" },
  { icon: BookOpen, label: "Research & Story", shortLabel: "Research" },
  { icon: Link2, label: "Links & Resources" },
  { icon: ListChecks, label: "Pre-Event Checklist", shortLabel: "Pre-Event" },
  { icon: Tag, label: "Task Board" },
  { icon: CalendarClock, label: "Event Schedule" },
  { icon: ClipboardList, label: "Activity Log" },
  { icon: Sparkles, label: "Portal" },
  { icon: Share2, label: "Share Invite" },
  { icon: Inbox, label: "Inquiries" },
  { icon: Database, label: "Notion Admin" },
  { icon: Handshake, label: "Sponsors & Partners", shortLabel: "Sponsors" },
  { icon: FileText, label: "Forms & Agreements", shortLabel: "Forms" },
  { icon: Wallet, label: "Reimbursements" },
  { icon: Flame, label: "Mission Control" },
  { icon: ScrollText, label: "System Audit" },
];

interface NavSection {
  label: string;
  items: string[];
}

const navSections: NavSection[] = [
  { label: "Overview", items: ["Dashboard", "Comms", "Our Istoryas", "Event Timeline", "Mission Control"] },
  { label: "People", items: ["Chef Roster", "Team Deploy", "Community", "Members"] },
  { label: "Operations", items: ["Travel & Lodging", "Menu & Courses", "Budget & COGS", "Reimbursements", "Expenses", "Finance", "Sponsors & Partners", "Research & Story"] },
  { label: "Planning", items: ["Pre-Event Checklist", "Task Board", "Event Schedule"] },
  { label: "Insights", items: ["Activity Log"] },
  { label: "Reference", items: ["Links & Resources", "Forms & Agreements"] },
  { label: "Showcase", items: ["Portal", "Share Invite", "Inquiries"] },
  { label: "Admin", items: ["Notion Admin", "System Audit"] },
];

const bodyFont = { fontFamily: "'Inter', sans-serif" };

interface SidebarNavProps {
  role: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
  displayName?: string;
  avatarId?: string;
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  recentPages?: RecentPage[];
  favorites?: FavoritePage[];
  isFavorite?: (page: string) => boolean;
  onToggleFavorite?: (page: string) => void;
  onReorderFavorites?: (fromIndex: number, toIndex: number) => void;
  badgeCounts?: Record<string, number>;
}

export function SidebarNav({ role, activePage, onNavigate, displayName, avatarId, viewMode, onViewModeChange, recentPages = [], favorites = [], isFavorite, onToggleFavorite, onReorderFavorites, badgeCounts = {} }: SidebarNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const visibleLabels = getVisibleNavItemsForView(
    viewMode,
    allNavItems.map((i) => i.label)
  );
  const navItemMap = Object.fromEntries(allNavItems.map((i) => [i.label, i]));

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isSectionCollapsed = (label: string) => {
    // default: open if it contains the active page, or if it's "Overview"
    if (collapsedSections[label] !== undefined) return collapsedSections[label];
    return false;
  };

  return (
    <div
      className={`relative flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="px-4 pt-6 pb-5 border-b border-sidebar-border">
        {!collapsed ? (
          <button
            onClick={() => onNavigate("Dashboard")}
            className="flex items-start gap-3 w-full text-left cursor-pointer hover:opacity-80 transition-opacity"
            title="Go to Dashboard"
          >
            <img src={istoryaLogo} alt="Istorya" className="w-10 h-10 rounded-lg shrink-0 mt-0.5" width={40} height={40} />
            <div>
              <h1
                className="text-sidebar-primary tracking-tight leading-tight"
                style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif", fontSize: "1.25rem" }}
              >
                Isang Kusina
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-sidebar-foreground/80 text-[0.75rem] tracking-widest uppercase"
                  style={bodyFont}
                >
                  2026
                </span>
              </div>
              <p className="text-sidebar-foreground/40 text-[0.6rem] mt-1.5 tracking-wider uppercase" style={bodyFont}>
                isangkusina.com
              </p>
            </div>
          </button>
        ) : (
          <button
            onClick={() => onNavigate("Dashboard")}
            className="flex justify-center w-full cursor-pointer hover:opacity-80 transition-opacity"
            title="Go to Dashboard"
          >
            <img src={istoryaLogo} alt="Istorya" className="w-9 h-9" width={36} height={36} />
          </button>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto" aria-label="Main navigation">
        {/* Favorites section */}
        {!collapsed && favorites.length > 0 && (
          <div className="mb-2">
            <div className="px-3 py-1.5 mb-0.5">
              <span
                className="text-[0.625rem] tracking-[0.1em] uppercase text-sidebar-foreground/35 flex items-center gap-1.5"
                style={bodyFont}
              >
                <Star className="w-3 h-3" style={{ color: "#C9A96E" }} />
                Favorites
              </span>
            </div>
            <div className="space-y-0.5">
              {favorites
                .filter((f) => visibleLabels.includes(f.page) || f.page === "Dashboard")
                .map((fav, idx) => {
                  const navItem = navItemMap[fav.page];
                  if (!navItem) return null;
                  const Icon = navItem.icon;
                  const isActive = activePage === fav.page;
                  const isDragging = dragIndex === idx;
                  const isDragOver = dragOverIndex === idx && dragIndex !== idx;
                  return (
                    <div
                      key={fav.page}
                      className={`group/fav relative flex items-center transition-all duration-150 ${isDragging ? "opacity-40" : ""}`}
                      draggable={!!onReorderFavorites}
                      onDragStart={(e) => {
                        setDragIndex(idx);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(idx));
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setDragOverIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverIndex === idx) setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = dragIndex;
                        if (from !== null && from !== idx && onReorderFavorites) {
                          onReorderFavorites(from, idx);
                        }
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDragIndex(null);
                        setDragOverIndex(null);
                      }}
                      style={isDragOver ? { borderTop: "2px solid rgba(201,169,110,0.5)", borderRadius: "8px" } : undefined}
                    >
                      {/* Drag handle */}
                      {onReorderFavorites && (
                        <div className="w-4 flex items-center justify-center opacity-0 group-hover/fav:opacity-40 cursor-grab active:cursor-grabbing shrink-0 ml-0.5">
                          <GripVertical className="w-3 h-3" />
                        </div>
                      )}
                      <button
                        onClick={() => onNavigate(fav.page)}
                        className={`flex items-center gap-3 w-full ${onReorderFavorites ? "px-1" : "px-3"} py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/50 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/80"
                        }`}
                      >
                        <Icon className="w-[15px] h-[15px] shrink-0" />
                        <span className="truncate text-[0.75rem] flex-1" style={bodyFont}>
                          {fav.page}
                        </span>
                      </button>
                      {onToggleFavorite && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleFavorite(fav.page); }}
                          className="absolute right-2 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/fav:opacity-100 hover:bg-sidebar-accent/50 transition-all cursor-pointer"
                          title="Unpin"
                        >
                          <Star className="w-3 h-3" style={{ color: "#C9A96E", fill: "#C9A96E" }} />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {navSections.map((section) => {
          // Filter to only visible items in this section
          const sectionItems = section.items
            .filter((label) => visibleLabels.includes(label))
            .map((label) => navItemMap[label])
            .filter(Boolean);

          if (sectionItems.length === 0) return null;

          const isCollapsed = isSectionCollapsed(section.label);

          const sectionHasActive = sectionItems.some((item) => activePage === item.label);

          return (
            <div key={section.label} className="mb-1">
              {/* Section header */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center justify-between w-full px-3 py-1.5 mb-0.5 cursor-pointer group"
                >
                  <span
                    className={`flex items-center gap-1.5 text-[0.625rem] tracking-[0.1em] uppercase group-hover:text-sidebar-foreground/55 transition-colors ${!sectionHasActive ? "text-sidebar-foreground/35" : ""}`}
                    style={{
                      ...bodyFont,
                      color: sectionHasActive ? "rgba(221,161,94,0.55)" : undefined,
                    }}
                  >
                    {sectionHasActive && (
                      <span className="w-0.5 h-3 rounded-full" style={{ backgroundColor: "rgba(221,161,94,0.5)" }} />
                    )}
                    {section.label}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-sidebar-foreground/25 group-hover:text-sidebar-foreground/45 transition-all duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}

              {/* Section items */}
              <AnimatePresence initial={false}>
                {(!isCollapsed || collapsed) && (
                  <motion.div
                    initial={false}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-0.5"
                  >
                    {sectionItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activePage === item.label;
                      return (
                        <div
                          key={item.label}
                          onClick={() => onNavigate(item.label)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(item.label); } }}
                          role="button"
                          tabIndex={0}
                          className={`group relative flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "text-sidebar-primary ik26-sidebar-active-glow"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          }`}
                          title={collapsed ? item.label : undefined}
                        >
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                layoutId="sidebar-active"
                                className="absolute inset-0 rounded-lg"
                                style={{ backgroundColor: "rgba(221,161,94,0.15)" }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                              />
                            )}
                          </AnimatePresence>

                          <Icon className="w-[18px] h-[18px] shrink-0 relative z-10" />
                          {!collapsed && (
                            <span className="truncate text-[0.8125rem] relative z-10 flex-1" style={bodyFont}>
                              {(item as any).shortLabel || item.label}
                            </span>
                          )}
                          {/* Badge count */}
                          {!collapsed && badgeCounts[item.label] > 0 && (
                            <span
                              className="relative z-10 px-1.5 py-0.5 rounded-full text-[0.5625rem] font-semibold leading-none"
                              style={{
                                backgroundColor: "rgba(201,169,110,0.15)",
                                color: "#C9A96E",
                                border: "1px solid rgba(201,169,110,0.25)",
                                minWidth: "18px",
                                textAlign: "center",
                              }}
                            >
                              {badgeCounts[item.label]}
                            </span>
                          )}
                          {collapsed && badgeCounts[item.label] > 0 && (
                            <span
                              className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full z-10"
                              style={{ backgroundColor: "#C9A96E" }}
                            />
                          )}
                          {/* Favorite star — show on hover */}
                          {!collapsed && onToggleFavorite && item.label !== "Dashboard" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.label); }}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer relative z-10 ${
                                isFavorite?.(item.label)
                                  ? "opacity-100"
                                  : "opacity-0 group-hover:opacity-60 hover:!opacity-100"
                              }`}
                              title={isFavorite?.(item.label) ? "Unpin from favorites" : "Pin to favorites"}
                            >
                              <Star
                                className="w-3 h-3"
                                style={
                                  isFavorite?.(item.label)
                                    ? { color: "#C9A96E", fill: "#C9A96E" }
                                    : { color: "currentColor" }
                                }
                              />
                            </button>
                          )}
                          {isActive && !collapsed && !isFavorite?.(item.label) && (
                            <motion.div
                              layoutId="sidebar-dot"
                              className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary relative z-10"
                              transition={{ type: "spring", stiffness: 350, damping: 30 }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Recent Pages — only when expanded and has items */}
      {!collapsed && recentPages.length > 0 && (
        <div className="px-2 pb-2 border-t border-sidebar-border/50">
          <div className="px-3 pt-2.5 pb-1.5">
            <span
              className="text-[0.625rem] tracking-[0.1em] uppercase text-sidebar-foreground/35 flex items-center gap-1.5"
              style={bodyFont}
            >
              <Clock className="w-3 h-3" />
              Recent
            </span>
          </div>
          <div className="space-y-0.5">
            {recentPages.slice(0, 3).map((rp) => {
              const Icon = getPageIcon(rp.page);
              const isActive = activePage === rp.page;
              return (
                <button
                  key={rp.page}
                  onClick={() => onNavigate(rp.page)}
                  className={`flex items-center gap-3 w-full px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/40 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/70"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate text-[0.75rem] flex-1" style={bodyFont}>
                    {rp.page}
                  </span>
                  <span
                    className="text-[0.5625rem] text-sidebar-foreground/25 shrink-0"
                    style={bodyFont}
                  >
                    {formatRecentTime(rp.timestamp)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-sidebar flex items-center justify-center z-10 cursor-pointer"
        style={{ border: "1px solid rgba(221,161,94,0.35)", color: "rgba(221,161,94,0.7)" }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </motion.button>

      {/* Bottom */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        {!collapsed ? (
          <div className="space-y-2">
            {/* User profile */}
            {displayName && (
              <div className="flex items-center gap-2.5 px-1 mb-2">
                {avatarId ? (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: getAvatar(avatarId).bg }}
                  >
                    {getAvatar(avatarId).emoji}
                  </div>
                ) : null}
                <span
                  className="text-sidebar-foreground/80 text-[0.8125rem] truncate flex-1"
                  style={bodyFont}
                >
                  {displayName}
                </span>
                <button
                  onClick={() => onNavigate("Settings")}
                  className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors cursor-pointer shrink-0"
                  title="Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-sidebar-foreground/40" />
                </button>
              </div>
            )}
            {/* Role badge + View switcher */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{
                backgroundColor:
                  viewMode === "leadership"
                    ? "rgba(221,161,94,0.12)"
                    : viewMode === "team"
                      ? "rgba(74,127,181,0.12)"
                      : "rgba(145,167,93,0.12)",
                border:
                  viewMode === "leadership"
                    ? "1px solid rgba(221,161,94,0.25)"
                    : viewMode === "team"
                      ? "1px solid rgba(74,127,181,0.25)"
                      : "1px solid rgba(145,167,93,0.25)",
              }}
            >
              {viewMode === "leadership" ? (
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "#D4AA7C" }} />
              ) : viewMode === "team" ? (
                <UsersRound className="w-3.5 h-3.5 shrink-0" style={{ color: "#4A7FB5" }} />
              ) : (
                <ChefHat className="w-3.5 h-3.5 shrink-0" style={{ color: "#D4DCBA" }} />
              )}
              <span
                className="text-[0.6875rem] tracking-wide flex-1"
                style={{
                  color:
                    viewMode === "leadership"
                      ? "#D4AA7C"
                      : viewMode === "team"
                        ? "#4A7FB5"
                        : "#D4DCBA",
                  ...bodyFont,
                }}
              >
                {viewMode === "leadership"
                  ? "Manager View"
                  : viewMode === "team"
                    ? "Team View"
                    : "Chef View"}
              </span>
            </div>

            {/* View mode toggle removed — now in top bar dropdown */}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {viewMode === "leadership" ? (
              <Shield className="w-3.5 h-3.5" style={{ color: "#D4AA7C" }} />
            ) : viewMode === "team" ? (
              <UsersRound className="w-3.5 h-3.5" style={{ color: "#4A7FB5" }} />
            ) : (
              <ChefHat className="w-3.5 h-3.5" style={{ color: "#D4DCBA" }} />
            )}
            <button
              onClick={() => onNavigate("Settings")}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-3 h-3 text-sidebar-foreground/40" />
            </button>
          </div>
        )}
        {/* Version badge */}
        {!collapsed && (
          <div className="mt-2 px-2.5">
            <span
              className="text-[0.5625rem] text-sidebar-foreground/25 tracking-wider"
              style={bodyFont}
            >
              v{APP_VERSION}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}