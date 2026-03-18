import { motion, AnimatePresence } from "motion/react";
import { useState, useCallback, useEffect } from "react";
import { Bell, CalendarDays, RotateCcw, Palette, Check, Menu, Shield, ChefHat, Settings, ArrowLeftRight, RefreshCw, UsersRound, ChevronDown, Sun, Moon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { themes, applyTheme, getSavedTheme, type ThemeId } from "./onboarding/use-theme";
import { type UserRole, type ViewMode } from "./onboarding/use-auth";
import { NotificationPanel } from "./notification-panel";
import { getUnreadCount } from "./notification-data";
import { getAvatar } from "./engagement/avatars";
import { GlobalSearch } from "./global-search";
import { useNotion } from "../lib/notion-context";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
const istoryaLogo = "/istorya-logo.png";
import { bodyFont, headingFont } from "../lib/fonts";

interface TopBarProps {
  onResetOnboarding?: () => void;
  onMobileMenuToggle?: () => void;
  role?: UserRole | null;
  onNavigate?: (page: string) => void;
  displayName?: string;
  avatarId?: string;
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function TopBar({ onResetOnboarding, onMobileMenuToggle, role, onNavigate, displayName, avatarId, viewMode, onViewModeChange }: TopBarProps) {
  // Compute effective role based on viewMode for child components
  const effectiveRole: UserRole = viewMode === "chef" ? "chef" : viewMode === "team" ? "team" : (role || "chef");
  
  const [themePanelOpen, setThemePanelOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getSavedTheme());
  const [viewSwitchOpen, setViewSwitchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(() => getUnreadCount(effectiveRole));
  const [isSyncing, setIsSyncing] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isLive: notionLive, stats: notionStats, isLoading: notionLoading, refresh: notionRefresh, cachedAt, lastSyncAt, lastError, isSyncing: notionSyncing } = useNotion();

  // Listen for keyboard shortcut event to toggle notifications
  useEffect(() => {
    const handler = () => setNotificationsOpen((prev) => !prev);
    window.addEventListener("ik26-toggle-notifications", handler);
    return () => window.removeEventListener("ik26-toggle-notifications", handler);
  }, []);

  // Escape key closes open panels
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setThemePanelOpen(false);
        setNotificationsOpen(false);
        setViewSwitchOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Track scroll position for shadow depth effect
  useEffect(() => {
    const main = document.querySelector(".main-content-area");
    if (!main) return;
    const handler = () => setScrolled(main.scrollTop > 8);
    main.addEventListener("scroll", handler, { passive: true });
    handler(); // check initial
    return () => main.removeEventListener("scroll", handler);
  }, []);

  const handleThemeChange = (id: ThemeId) => {
    // When switching away from dark, remember the light theme
    if (currentTheme !== "dark" && id === "dark") {
      localStorage.setItem("ik26-prev-light-theme", currentTheme);
    }
    applyTheme(id);
    setCurrentTheme(id);
  };

  const avatar = avatarId ? getAvatar(avatarId) : null;

  return (
    <header role="banner" aria-label="Top navigation bar" className="relative flex items-center justify-between h-14 px-3 sm:px-6 border-b overflow-visible top-bar" style={{ borderColor: "rgba(140,165,135,0.08)", boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)" : "none", transition: "box-shadow 0.3s ease" }}>
      {/* Warm gradient background with glassmorphism */}
      <div
        className="absolute inset-0 pointer-events-none backdrop-blur-md"
        style={{
          background:
            "linear-gradient(135deg, rgba(138,173,132,0.03) 0%, rgba(255,255,255,0.98) 35%, rgba(248,244,238,0.95) 100%)",
        }}
      />

      {/* Left */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Mobile hamburger */}
        {onMobileMenuToggle && (
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.15)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onMobileMenuToggle}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer -ml-1 mr-1"
            style={{ backgroundColor: "rgba(0,0,0,0)" }}
            aria-label="Toggle mobile navigation menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </motion.button>
        )}
        <button
          onClick={() => onNavigate?.("Dashboard")}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          title="Go to Dashboard"
        >
          <h2
            className="text-foreground text-[0.875rem] sm:text-base shrink-0"
            style={headingFont}
          >
            Event Hub
          </h2>
          <span className="text-muted-foreground/30 text-[0.8125rem] hidden sm:inline">/</span>
          <span
            className="text-muted-foreground text-[0.8125rem] hidden md:inline truncate"
            style={bodyFont}
          >
            A Filipino Chefs Collaboration Dinner
          </span>
        </button>

        {/* Role badge */}
        {role && (
          <>
            <span className="text-muted-foreground/30 text-[0.8125rem] hidden sm:inline">/</span>
            <span
              className="hidden sm:flex items-center gap-1.5 text-[0.6875rem] px-2.5 py-1 rounded-full shrink-0"
              style={{
                backgroundColor:
                  viewMode === "leadership"
                    ? "rgba(96,108,56,0.08)"
                    : viewMode === "team"
                      ? "rgba(74,127,181,0.08)"
                      : "rgba(96,108,56,0.06)",
                color:
                  viewMode === "leadership"
                    ? "#606C38"
                    : viewMode === "team"
                      ? "#4A7FB5"
                      : "#606C38",
                border:
                  viewMode === "leadership"
                    ? "1px solid rgba(96,108,56,0.2)"
                    : viewMode === "team"
                      ? "1px solid rgba(74,127,181,0.2)"
                      : "1px solid rgba(96,108,56,0.15)",
                ...bodyFont,
              }}
            >
              {viewMode === "leadership" ? (
                <Shield className="w-3 h-3" />
              ) : viewMode === "team" ? (
                <UsersRound className="w-3 h-3" />
              ) : (
                <ChefHat className="w-3 h-3" />
              )}
              {viewMode === "leadership"
                ? "Manager"
                : viewMode === "team"
                  ? "Team"
                  : "Chef View"}
            </span>

            {/* View-mode toggle for leadership — dropdown */}
            {role === "leadership" && onViewModeChange && (
              <div className="relative hidden sm:block">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.12)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewSwitchOpen(!viewSwitchOpen)}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[0.625rem] text-muted-foreground hover:text-foreground border border-border hover:border-gold/30 transition-[color,border-color] cursor-pointer"
                  style={{ ...bodyFont, backgroundColor: "rgba(0,0,0,0)" }}
                  title={`Switch view (currently ${viewMode})`}
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span className="hidden md:inline">
                    {viewMode === "leadership"
                      ? "Switch View"
                      : viewMode === "team"
                        ? "Team View"
                        : "Chef View"}
                  </span>
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${viewSwitchOpen ? "rotate-180" : ""}`} />
                </motion.button>
                <AnimatePresence>
                  {viewSwitchOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setViewSwitchOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1.5 w-44 bg-card rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}
                      >
                        {([
                          { mode: "leadership" as ViewMode, label: "Manager View", icon: Shield, color: "#D4AA7C" },
                          { mode: "team" as ViewMode, label: "Team View", icon: UsersRound, color: "#4A7FB5" },
                          { mode: "chef" as ViewMode, label: "Chef View", icon: ChefHat, color: "#7E9E78" },
                        ]).map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = viewMode === item.mode;
                          return (
                            <button
                              key={item.mode}
                              onClick={() => {
                                onViewModeChange(item.mode);
                                setViewSwitchOpen(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors ${
                                isActive ? "bg-secondary/60" : "hover:bg-secondary/40"
                              }`}
                            >
                              <ItemIcon className="w-3.5 h-3.5 shrink-0" style={{ color: item.color }} />
                              <span
                                className="text-[0.75rem] flex-1"
                                style={{
                                  color: isActive ? item.color : undefined,
                                  ...bodyFont,
                                  fontWeight: isActive ? 600 : 400,
                                }}
                              >
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-3 relative z-10">
        <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground text-[0.8125rem]">
          <CalendarDays className="w-3.5 h-3.5" />
          <span style={bodyFont}>May 22, 2026</span>
        </div>

        <div className="hidden sm:block w-px h-5 bg-border mx-1" />

        {/* Search */}
        <GlobalSearch role={effectiveRole} onNavigate={onNavigate || (() => {})} viewMode={viewMode} />

        {/* Reset Onboarding */}
        {onResetOnboarding && (
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(126,158,120,0.05)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onResetOnboarding}
            className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-[0.75rem] text-muted-foreground hover:text-gold border border-border hover:border-gold/30 transition-[color,border-color] cursor-pointer"
            style={{ ...bodyFont, backgroundColor: "rgba(0,0,0,0)" }}
            title="Re-run onboarding"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Onboarding</span>
          </motion.button>
        )}

        {/* Tour re-trigger */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.15)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            window.dispatchEvent(new Event("ik26-restart-tour"));
            onNavigate?.("Dashboard");
            toast.success("Welcome tour restarted!", { description: "Return to your Dashboard to see it.", duration: 3000 });
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0)" }}
          title="Replay welcome tour"
          aria-label="Replay welcome tour"
        >
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Dark mode quick toggle */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.15)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const prevLight = (localStorage.getItem("ik26-prev-light-theme") as ThemeId) || "ik26";
            const newTheme = currentTheme === "dark" ? prevLight : "dark";
            handleThemeChange(newTheme);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0)" }}
          title={currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {currentTheme === "dark" ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </motion.button>

        {/* Theme switcher */}
        <div className="relative hidden sm:block">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.15)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setThemePanelOpen(!themePanelOpen)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0)" }}
            title="Change theme"
          >
            <Palette className="w-4 h-4 text-muted-foreground" />
          </motion.button>

          {themePanelOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setThemePanelOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-xl z-50 p-3 space-y-1"
                style={{ border: "1px solid var(--border)" }}
              >
                <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-[0.15em] px-2 pb-1.5" style={bodyFont}>
                  Chapter Palette
                </p>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-0 shrink-0">
                      {theme.swatches.slice(0, 4).map((color, si) => (
                        <div
                          key={si}
                          style={{
                            width: 14,
                            height: 14,
                            backgroundColor: color,
                            borderRadius: "50%",
                            marginLeft: si === 0 ? 0 : -4,
                            zIndex: 5 - si,
                            border: "1.5px solid rgba(255,255,255,0.6)",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="text-foreground text-[0.8125rem] block truncate" style={headingFont}>
                        {theme.name}
                      </span>
                      <span className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
                        {theme.chapter}
                      </span>
                    </div>
                    {currentTheme === theme.id && (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notion Sync — leadership only */}
        {role === "leadership" && viewMode === "leadership" && (
          <NotionSyncBadge
            isLive={notionLive}
            lastSyncAt={lastSyncAt}
            hasError={!!lastError}
            isRefreshing={notionSyncing || isSyncing}
            onRefresh={async () => {
              setIsSyncing(true);
              const success = await notionRefresh();
              if (success) {
                toast.success("Notion synced", {
                  description: `Milestones refreshed from Ops Center`,
                  duration: 3000,
                });
              } else {
                toast.error("Sync failed", {
                  description: "Could not reach Notion — using cached data",
                  duration: 4000,
                });
              }
              setIsSyncing(false);
            }}
            compact
          />
        )}

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.15)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0)" }}
            aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[0.5625rem] font-semibold px-1"
                style={{ backgroundColor: "#C9A96E", ...bodyFont }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <NotificationPanel
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            role={effectiveRole}
            onNavigate={onNavigate || (() => {})}
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>

        {/* Settings gear */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(221,161,94,0.15)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate?.("Settings")}
          className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0)" }}
          title="Profile settings"
          aria-label="Open profile settings"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Avatar — clicks to settings */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => onNavigate?.("Settings")}
          className="w-8 h-8 rounded-full overflow-hidden cursor-pointer flex items-center justify-center shrink-0"
          style={avatar ? { backgroundColor: avatar.bg } : undefined}
          title={displayName || "Profile"}
          aria-label={`Profile — ${displayName || "Open settings"}`}
        >
          {avatar ? (
            <span className="text-base leading-none">{avatar.emoji}</span>
          ) : (
            <img src={istoryaLogo} alt="Istorya" className="w-8 h-8" width={32} height={32} />
          )}
        </motion.button>
      </div>
    </header>
  );
}