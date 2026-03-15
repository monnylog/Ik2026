import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  MessageCircle,
  CalendarDays,
  Users,
  Settings,
  MoreHorizontal,
  X,
  Heart,
  Plane,
  UtensilsCrossed,
  DollarSign,
  BookOpen,
  Link2,
  UserCheck,
  Shield,
  Mic,
  ListChecks,
  Tag,
  CalendarClock,
  ClipboardList,
  Share2,
  Clock,
  Receipt,
  BarChart3,
  FileText,
  Wallet,
  Flame,
  Handshake,
  Sparkles,
  Inbox,
  Database,
} from "lucide-react";
import type { ViewMode } from "./onboarding/use-auth";
import { getUnreadCount } from "./notification-data";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface MobileBottomNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
  viewMode: ViewMode;
}

const primaryNavItems = [
  { icon: LayoutDashboard, label: "Home", page: "Dashboard" },
  { icon: MessageCircle, label: "Comms", page: "Comms", hasBadge: true },
  { icon: CalendarDays, label: "Timeline", page: "Event Timeline" },
  { icon: Users, label: "Roster", page: "Chef Roster" },
];

interface MoreNavItem {
  icon: typeof LayoutDashboard;
  label: string;
  page: string;
  color: string;
  leadershipOnly?: boolean;
  teamAndUp?: boolean;
}

const moreNavItems: MoreNavItem[] = [
  { icon: Mic, label: "Our Istoryas", page: "Our Istoryas", color: "#C9A96E" },
  { icon: Heart, label: "Community", page: "Community", color: "#CDA88A" },
  { icon: Plane, label: "Travel & Lodging", page: "Travel & Lodging", color: "#4A7FB5" },
  { icon: UtensilsCrossed, label: "Menu & Courses", page: "Menu & Courses", color: "#7E9E78" },
  { icon: ListChecks, label: "Pre-Event Checklist", page: "Pre-Event Checklist", color: "#C9A96E" },
  { icon: Tag, label: "Task Board", page: "Task Board", color: "#4A7FB5" },
  { icon: CalendarClock, label: "Event Schedule", page: "Event Schedule", color: "#6B7F8E" },
  { icon: ClipboardList, label: "Activity Log", page: "Activity Log", color: "#C9A96E" },
  { icon: UserCheck, label: "Team Deploy", page: "Team Deploy", color: "#4A7FB5", teamAndUp: true },
  { icon: BookOpen, label: "Research & Story", page: "Research & Story", color: "#6B7F8E", teamAndUp: true },
  { icon: DollarSign, label: "Budget & COGS", page: "Budget & COGS", color: "#CDA88A", leadershipOnly: true },
  { icon: Wallet, label: "Reimbursements", page: "Reimbursements", color: "#7E9E78" },
  { icon: Receipt, label: "Expenses", page: "Expenses", color: "#C9A96E" },
  { icon: BarChart3, label: "Finance", page: "Finance", color: "#5DA06B", leadershipOnly: true },
  { icon: Handshake, label: "Sponsors & Partners", page: "Sponsors & Partners", color: "#C9A96E", leadershipOnly: true },
  { icon: Flame, label: "Mission Control", page: "Mission Control", color: "#C85050", leadershipOnly: true },
  { icon: Link2, label: "Links & Resources", page: "Links & Resources", color: "#3B6298" },
  { icon: FileText, label: "Forms & Agreements", page: "Forms & Agreements", color: "#C9A96E" },
  { icon: Shield, label: "Members", page: "Members", color: "#D4AA7C", leadershipOnly: true },
  { icon: Share2, label: "Share Invite", page: "Share Invite", color: "#C49370" },
  { icon: Sparkles, label: "Portal", page: "Portal", color: "#7E9E78" },
  { icon: Inbox, label: "Inquiries", page: "Inquiries", color: "#CDA88A", leadershipOnly: true },
  { icon: Database, label: "Notion Admin", page: "Notion Admin", color: "#6B7F8E", leadershipOnly: true },
  { icon: Settings, label: "Settings", page: "Settings", color: "#6B7F8E" },
];

// Map pages to their icons for recent-pages display
const pageIconMap: Record<string, typeof LayoutDashboard> = {};
moreNavItems.forEach((item) => { pageIconMap[item.page] = item.icon; });
primaryNavItems.forEach((item) => { pageIconMap[item.page] = item.icon; });

export function MobileBottomNav({ activePage, onNavigate, viewMode }: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastHomeTapRef = useRef<number>(0);
  const [tappedItem, setTappedItem] = useState<string | null>(null);

  // Compute unread notification count for the badge
  const effectiveRole = viewMode === "chef" ? "chef" : viewMode === "team" ? "team" : "leadership";
  const unreadCount = getUnreadCount(effectiveRole as any);

  // Double-tap home to scroll to top
  const handleNavTap = useCallback((page: string) => {
    if (page === "Dashboard" && activePage === "Dashboard") {
      const now = Date.now();
      if (now - lastHomeTapRef.current < 400) {
        // Double-tap: scroll to top
        const main = document.querySelector(".main-content-area");
        if (main) main.scrollTo({ top: 0, behavior: "smooth" });
        lastHomeTapRef.current = 0;
        return;
      }
      lastHomeTapRef.current = now;
      return; // Already on dashboard, don't navigate again
    }
    lastHomeTapRef.current = 0;
    // Haptic-style tap feedback
    setTappedItem(page);
    setTimeout(() => setTappedItem(null), 150);
    onNavigate(page);
  }, [activePage, onNavigate]);

  // Close panel on escape
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moreOpen]);

  // Close on outside tap
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [moreOpen]);

  // Filter "more" items by viewMode
  const visibleMoreItems = moreNavItems.filter((item) => {
    if (item.leadershipOnly && viewMode !== "leadership") return false;
    if (item.teamAndUp && viewMode === "chef") return false;
    return true;
  });

  // Check if current page is in "more" menu
  const isMoreActive = visibleMoreItems.some((i) => i.page === activePage);

  // Get recent pages for "More" panel (filter out primary nav & current page, limit 3)
  const primaryPages = new Set(primaryNavItems.map((i) => i.page));
  const recentPagesFromStorage: string[] = (() => {
    try {
      const raw = localStorage.getItem("ik26_recent_pages");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // The hook stores {page, timestamp}[] objects
      const pages: string[] = Array.isArray(parsed)
        ? parsed.map((p: any) => typeof p === "string" ? p : p?.page).filter(Boolean)
        : [];
      return pages.filter((p: string) => !primaryPages.has(p) && p !== activePage).slice(0, 3);
    } catch { return []; }
  })();

  return (
    <>
      {/* More panel overlay */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              ref={panelRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--card)",
                borderTop: "1px solid var(--border)",
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                maxHeight: "70vh",
              }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--border)" }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <h3
                  className="text-foreground text-[0.9375rem]"
                  style={headingFont}
                >
                  More Pages
                </h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                  aria-label="Close more pages panel"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 80px)" }}>
                {/* Recent pages section */}
                {recentPagesFromStorage.length > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <Clock className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-[0.5625rem] uppercase tracking-wider text-muted-foreground/60" style={bodyFont}>
                        Recent
                      </span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {recentPagesFromStorage.map((page) => {
                        const matchedItem = moreNavItems.find((i) => i.page === page);
                        const PageIcon = pageIconMap[page] || LayoutDashboard;
                        const color = matchedItem?.color || "#6B7F8E";
                        return (
                          <button
                            key={page}
                            onClick={() => { onNavigate(page); setMoreOpen(false); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg shrink-0 cursor-pointer"
                            style={{
                              backgroundColor: `${color}10`,
                              border: `1px solid ${color}20`,
                            }}
                          >
                            <PageIcon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                            <span className="text-[0.6875rem] whitespace-nowrap" style={{ color, ...bodyFont, fontWeight: 500 }}>
                              {page}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Divider if recent pages shown */}
                {recentPagesFromStorage.length > 0 && (
                  <div className="mx-4 mb-3" style={{ borderBottom: "1px solid var(--border)" }} />
                )}

                {/* Grid of pages */}
                <div className="grid grid-cols-4 gap-1.5 px-4 pb-4">
                  {visibleMoreItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.page;
                    return (
                      <motion.button
                        key={item.page}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => {
                          onNavigate(item.page);
                          setMoreOpen(false);
                        }}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl cursor-pointer active:scale-95"
                        style={{
                          backgroundColor: isActive ? "rgba(92,114,86,0.1)" : "rgba(0,0,0,0)",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: isActive
                              ? `${item.color}20`
                              : "var(--secondary)",
                          }}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: isActive ? item.color : "var(--muted-foreground)" }}
                          />
                        </div>
                        <span
                          className="text-[0.625rem] leading-tight text-center px-1"
                          style={{
                            ...bodyFont,
                            color: isActive ? item.color : "var(--muted-foreground)",
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around px-1 py-1.5 mobile-bottom-nav"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderTop: "1px solid rgba(140,165,135,0.08)",
          paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        aria-label="Mobile navigation"
        role="navigation"
      >
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.page;
          const isTapped = tappedItem === item.page;

          return (
            <button
              key={item.page}
              onClick={() => handleNavTap(item.page)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer min-w-0"
              style={{
                color: isActive ? "var(--gold)" : "var(--muted-foreground)",
                transform: isTapped ? "scale(0.92)" : "scale(1)",
                transition: "transform 0.1s ease",
                WebkitTapHighlightColor: "transparent",
              }}
              aria-label={item.label + (item.page === "Dashboard" && isActive ? " (double-tap to scroll to top)" : "")}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Animated active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ backgroundColor: "rgba(92,114,86,0.08)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              {/* Active top dot */}
              {isActive && (
                <motion.span
                  layoutId="bottomNavDot"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: "var(--gold)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              {/* Notification badge */}
              {item.hasBadge && unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0.5 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[0.5rem] font-bold text-white z-20"
                  style={{ backgroundColor: "#C49370", fontFamily: "'Inter', sans-serif" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
              <span
                className="text-[0.5625rem] leading-tight truncate max-w-[48px] relative z-10"
                style={{ ...bodyFont, fontWeight: isActive ? 600 : 400 }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl cursor-pointer min-w-0"
          style={{
            color: isMoreActive ? "var(--gold)" : "var(--muted-foreground)",
            WebkitTapHighlightColor: "transparent",
          }}
          aria-label="More pages"
        >
          {isMoreActive && (
            <motion.div
              layoutId="bottomNavIndicator"
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: "rgba(92,114,86,0.1)" }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            />
          )}
          <MoreHorizontal className="w-5 h-5 relative z-10" />
          {/* Dot when on a "more" page */}
          {isMoreActive && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0.5 right-2 w-2 h-2 rounded-full z-20"
              style={{ backgroundColor: "var(--gold)" }}
            />
          )}
          <span
            className="text-[0.5625rem] leading-tight truncate max-w-[48px] relative z-10"
            style={{ ...bodyFont, fontWeight: isMoreActive ? 600 : 400 }}
          >
            More
          </span>
        </button>
      </nav>
    </>
  );
}