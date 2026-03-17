import type React from "react";
import {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";
/* Notion integration v3.1 — IK26 single source of truth */
import {
  Eye,
  Shield,
  UsersRound,
  ChefHat,
  ChevronDown,
  ArrowLeftRight,
} from "lucide-react";

import {
  ProfileProvider,
  useProfile,
} from "./lib/profile-context";
import {
  SimplifiedViewProvider,
  useSimplifiedView,
} from "./lib/simplified-view-context";
import { SimplifiedViewToggle } from "./components/ui/simplified-view-toggle";
import type {
  UserRole,
  ViewMode,
} from "./components/onboarding/use-auth";
import {
  getSession,
  saveSession,
  clearSession,
  completeOnboarding,
  leadershipOnlyPages,
  teamHiddenPages,
} from "./components/onboarding/use-auth";
import {
  applyTheme,
  getSavedTheme,
} from "./components/onboarding/use-theme";
import { clearDraft } from "./components/onboarding/use-draft";
import { NotionProvider } from "./lib/notion-context";
import { usePrefetchPages } from "./lib/use-prefetch";
import { bodyFont, headingFont } from "./lib/fonts";
import { useUrlSync } from "./lib/use-url-sync";

import { PasswordGate } from "./components/onboarding/password-gate"; // v3.0.1 fixed imports
import { OnboardingModal } from "./components/onboarding/onboarding-modal";
import { SidebarNav } from "./components/sidebar-nav";
import { TopBar } from "./components/top-bar";
import { MobileBottomNav } from "./components/mobile-bottom-nav";
import { PageWrapper } from "./components/page-wrapper";
import { ProfileSettings } from "./components/profile-settings";

// UX Polish
import { ErrorBoundary } from "./components/ui/error-boundary";
import { TooltipWalkthroughProvider } from "./components/ui/feature-tooltip";
import {
  DashboardSkeleton,
  EventTimelineSkeleton,
  EventScheduleSkeleton,
  TaskBoardSkeleton,
  ChecklistSkeleton,
  CommsSkeleton,
  ChefRosterSkeleton,
  PageSkeleton,
} from "./components/ui/skeleton-loaders";
import {
  KeyboardShortcuts,
  useKeyboardShortcuts,
} from "./components/ui/keyboard-shortcuts";
import { SignOutDialog } from "./components/ui/sign-out-dialog";
import {
  PageProgressBar,
  usePageTransition,
} from "./components/ui/page-progress-bar";
import { useRecentPages } from "./components/ui/recent-pages";
import { useFavorites } from "./components/ui/favorites";
import { useInquiryBadge } from "./components/ui/use-inquiry-badge";
import { NetworkStatusBanner } from "./components/ui/network-status";
import { ScrollToTop } from "./components/ui/scroll-to-top";
import { FloatingShareButton } from "./components/share-invite";
import { SessionTimeout } from "./components/ui/session-timeout";
import { SplashScreen } from "./components/ui/splash-screen";
import {
  usePWAManifest,
  PWAInstallBanner,
} from "./components/ui/pwa-install";
import { useServiceWorker } from "./components/ui/pwa-install";
import {
  GuidedTour,
  useGuidedTour,
} from "./components/ui/guided-tour";
import { AppErrorBoundary } from "./components/ui/app-error-boundary";
import { SWUpdateToast } from "./components/ui/sw-update-toast";
import { ModuleLoadError } from "./components/ui/module-load-error";
import { moduleRetryToast } from "./lib/api-toast";

import { LandingPage } from "./components/landing/landing-page";

// Legal pages
import { PrivacyPolicy } from "./components/legal/privacy-policy";
import { TermsOfService } from "./components/legal/terms-of-service";

// App Store screenshots
import { AppStoreScreenshots } from "./components/app-store-screenshots";
import { FormsAgreements } from "./components/forms-agreements";
import { Reimbursements } from "./components/reimbursements";

// Dashboard widgets
import { EventCountdown } from "./components/dashboard/event-countdown";
import { RoleWelcome } from "./components/dashboard/role-welcome";
import { AnnouncementsBanner } from "./components/dashboard/announcements-banner";
import { QuickActions } from "./components/dashboard/quick-actions";
import { KpiCards } from "./components/kpi-cards";
import { NotionSyncIndicator } from "./components/dashboard/notion-sync-indicator";
import { ActionNeeded } from "./components/action-needed";
import { ActivityFeed } from "./components/dashboard/activity-feed";
import { DailyPrompt } from "./components/engagement/daily-prompt";
import { CommsHub } from "./components/dashboard/comms-hub";
import { EngagementSection } from "./components/dashboard/engagement-section";
import { OutreachPipeline } from "./components/dashboard/outreach-pipeline";
import { CourseLineup } from "./components/course-lineup";
import { LandingAnalytics } from "./components/dashboard/landing-analytics";
import { PlanningHub } from "./components/dashboard/planning-hub";
import { PerformanceWidget } from "./components/dashboard/performance-widget";
import { SponsorPipeline } from "./components/dashboard/sponsor-pipeline";

// Manager dashboard
import { ManagerWelcomeTour } from "./components/dashboard/manager-welcome-tour";
import { ManagerAnalytics } from "./components/dashboard/manager-analytics";
import { DeploymentReadiness } from "./components/dashboard/deployment-readiness";
import { PreLaunchChecklist } from "./components/dashboard/prelaunch-checklist";
import { PreflightPanel } from "./components/dashboard/preflight-panel";

// Team dashboard
import { TeamWelcomeTour } from "./components/dashboard/team-welcome-tour";
import { TeamChecklist } from "./components/dashboard/team-checklist";
import { MyTasks } from "./components/dashboard/my-tasks";

// Chef dashboard
import { ChefWelcomeTour } from "./components/dashboard/chef-welcome-tour";
import { ChefProgress } from "./components/dashboard/chef-progress";
import { ChefProfileCard } from "./components/dashboard/chef-profile-card";
import { ChefArrivalKit } from "./components/dashboard/chef-arrival-kit";
import { ChefCommandCenter } from "./components/dashboard/chef-command-center";
import { WhatsNew } from "./components/dashboard/whats-new";
import { BackendHealthIndicator } from "./components/dashboard/backend-health";
import { AuditTrail } from "./components/dashboard/audit-trail";
import { ContentStudioWidget } from "./components/dashboard/content-studio-widget";

// Dashboard layout helpers
import { StaggeredWidget, SectionDivider, GoldAccentLine } from "./components/dashboard/dashboard-layout";
import { MilestoneCelebration, useCelebration } from "./components/ui/milestone-celebration";

// Full pages — lazy loaded for code splitting
// Retry wrapper: handles transient "Failed to fetch dynamically imported module" errors
function lazyRetry<T extends Record<string, any>>(
  factory: () => Promise<T>,
  namedExport: keyof T,
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(() =>
    factory()
      .then((m) => ({ default: m[namedExport] as React.ComponentType<any> }))
      .catch((err: unknown) => {
        console.warn("[LazyRetry] Module fetch failed, retrying…", err);
        return new Promise<{ default: React.ComponentType<any> }>((resolve) =>
          setTimeout(
            () =>
              factory()
                .then((m) => {
                  moduleRetryToast(String(namedExport));
                  resolve({ default: m[namedExport] as React.ComponentType<any> });
                })
                .catch((retryErr: unknown) => {
                  console.error("[LazyRetry] Module fetch failed after retry:", retryErr);
                  // Show graceful error UI instead of hard-reloading
                  resolve({
                    default: (() => (
                      <ModuleLoadError
                        moduleName={String(namedExport)}
                        onRetry={() => window.location.reload()}
                      />
                    )) as unknown as React.ComponentType<any>,
                  });
                }),
            1500,
          ),
        );
      }),
  );
}

const CommunityPage = lazyRetry(() => import("./components/community-page"), "CommunityPage");
const CommsChat = lazyRetry(() => import("./components/comms-chat"), "CommsChat");
const OurIstoryas = lazyRetry(() => import("./components/engagement/our-istoryas"), "OurIstoryas");
const ChefRoster = lazyRetry(() => import("./components/chef-roster"), "ChefRoster");
const EventTimeline = lazyRetry(() => import("./components/event-timeline"), "EventTimeline");
const TravelLodging = lazyRetry(() => import("./components/travel-lodging"), "TravelLodging");
const MenuCourses = lazyRetry(() => import("./components/menu-courses"), "MenuCourses");
const TeamDeploy = lazyRetry(() => import("./components/team-deploy"), "TeamDeploy");
const ResearchStory = lazyRetry(() => import("./components/research-story"), "ResearchStory");
const BudgetCogs = lazyRetry(() => import("./components/budget-cogs"), "BudgetCogs");
const LinksResources = lazyRetry(() => import("./components/links-resources"), "LinksResources");
const ChefSubmissionWizard = lazyRetry(() => import("./components/chef-submission-wizard"), "ChefSubmissionWizard");
const UserManagement = lazyRetry(() => import("./components/user-management"), "UserManagement");
const PreEventChecklist = lazyRetry(() => import("./components/pre-event-checklist"), "PreEventChecklist");
const TaskBoard = lazyRetry(() => import("./components/task-board"), "TaskBoard");
const EventSchedule = lazyRetry(() => import("./components/event-schedule"), "EventSchedule");
const ActivityLog = lazyRetry(() => import("./components/activity-log"), "ActivityLog");
const PortalPage = lazyRetry(() => import("./components/portal-page"), "PortalPage");
const ShareInvite = lazyRetry(() => import("./components/share-invite"), "ShareInvite");
const PortalInquiries = lazyRetry(() => import("./components/portal-inquiries"), "PortalInquiries");
const NotionAdmin = lazyRetry(() => import("./components/notion-admin"), "NotionAdmin");
const SponsorsPartners = lazyRetry(() => import("./components/sponsors-partners"), "SponsorsPartners");
const ExpenseTracker = lazyRetry(() => import("./components/expense-tracker"), "ExpenseTracker");
const FinanceDashboard = lazyRetry(() => import("./components/finance-dashboard"), "FinanceDashboard");
const MissionControlPage = lazyRetry(() => import("./components/mission-control"), "MissionControl");
const AuditLogPage = lazyRetry(() => import("./components/audit-log-page"), "AuditLogPage");
const ContentStudio = lazyRetry(() => import("./components/content-studio"), "ContentStudio");

type AppState = "password" | "onboarding" | "dashboard";

// AppInner must be rendered inside ProfileProvider
function AppInner() {
  const {
    profile,
    signOut,
    loading: profileLoading,
    updateProfile,
  } = useProfile();
  const [appState, setAppState] =
    useState<AppState>("password");
  const [role, setRole] = useState<UserRole | null>(null);
  const [activePage, setActivePage] = useState("Dashboard");
  const [dashboardReady, setDashboardReady] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);
  const [viewMode, setViewMode] =
    useState<ViewMode>("leadership");
  const [previewDropdownOpen, setPreviewDropdownOpen] =
    useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [signOutDialogOpen, setSignOutDialogOpen] =
    useState(false);
  const [splashDone, setSplashDone] = useState(false);

  // Page transition progress bar
  const { isTransitioning, startTransition, endTransition } =
    usePageTransition();

  // Recent pages tracking
  const { recentPages, trackPage } = useRecentPages();

  // Favorites tracking
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    reorderFavorites,
  } = useFavorites();

  // Inquiry badge for sidebar
  const { newCount: inquiryNewCount } = useInquiryBadge(
    dashboardReady && viewMode === "leadership",
  );
  const badgeCounts =
    inquiryNewCount > 0 ? { Inquiries: inquiryNewCount } : {};

  // Prefetch popular page modules on idle
  usePrefetchPages(dashboardReady);

  // PWA manifest injection
  usePWAManifest();

  // Service worker registration
  useServiceWorker();

  // Accessibility: set lang, meta description, OG image
  useEffect(() => {
    document.documentElement.lang = "en";

    // Generate OG image as data URL (1200x630) for link previews
    const generateOGImage = (): string | null => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#2E4F52";
        ctx.fillRect(0, 0, 1200, 630);
        const glow = ctx.createRadialGradient(
          600,
          280,
          0,
          600,
          280,
          500,
        );
        glow.addColorStop(0, "rgba(78,130,130,0.15)");
        glow.addColorStop(1, "rgba(46,79,82,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 1200, 630);
        ctx.font = "bold 140px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const tg = ctx.createLinearGradient(480, 220, 720, 340);
        tg.addColorStop(0, "#CBA47A");
        tg.addColorStop(1, "#C08E7E");
        ctx.fillStyle = tg;
        ctx.fillText("IK", 600, 260);
        ctx.font = "300 36px sans-serif";
        ctx.fillStyle = "rgba(203,164,122,0.5)";
        ctx.fillText("2026", 600, 340);
        ctx.font = "400 22px sans-serif";
        ctx.fillStyle = "rgba(159,176,212,0.55)";
        ctx.fillText(
          "A Filipino Chefs Collaboration Dinner",
          600,
          410,
        );
        ctx.font = "300 16px sans-serif";
        ctx.fillStyle = "rgba(159,176,212,0.3)";
        ctx.fillText("May 22, 2026 \u00b7 Las Vegas", 600, 450);
        ctx.beginPath();
        ctx.moveTo(400, 175);
        ctx.lineTo(800, 175);
        ctx.strokeStyle = "rgba(203,164,122,0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
        return canvas.toDataURL("image/png");
      } catch {
        return null;
      }
    };
    const ogImageDataUrl = generateOGImage();

    // Ensure meta description exists
    let metaDesc = document.querySelector(
      'meta[name="description"]',
    );
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Isang Kusina 2026 — Operational command center for the Filipino chefs collaboration dinner, May 22, 2026 at Keep Memory Alive Event Center, Las Vegas.",
    );
    // Ensure meta theme-color exists
    let metaTheme = document.querySelector(
      'meta[name="theme-color"]',
    );
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.setAttribute("name", "theme-color");
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute("content", "#2E4F52");

    // Open Graph meta tags for social sharing
    const ogTags: Record<string, string> = {
      "og:title": "Isang Kusina 2026",
      "og:description":
        "Filipino chefs collaboration dinner coordination hub — May 22, 2026 at Keep Memory Alive Event Center, Las Vegas.",
      "og:type": "website",
      "og:url": "https://isangkusina.com",
      "og:site_name": "Isang Kusina 2026",
      "og:locale": "en_US",
      "og:image":
        ogImageDataUrl ||
        "https://isangkusina.com/og-image.svg",
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:alt":
        "Isang Kusina 2026 — A Filipino Chefs Collaboration Dinner, May 22, 2026, Las Vegas",
      "twitter:card": "summary_large_image",
      "twitter:title": "Isang Kusina 2026",
      "twitter:description":
        "Filipino chefs collaboration dinner coordination hub — May 22, 2026, Las Vegas.",
      "twitter:image":
        ogImageDataUrl ||
        "https://isangkusina.com/og-image.svg",
    };
    Object.entries(ogTags).forEach(([property, content]) => {
      const attr = property.startsWith("twitter:")
        ? "name"
        : "property";
      let tag = document.querySelector(
        `meta[${attr}="${property}"]`,
      );
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    // Favicon — SVG for modern browsers, fallback data URI
    if (
      !document.querySelector(
        'link[rel="icon"][type="image/svg+xml"]',
      )
    ) {
      const svgFavicon = document.createElement("link");
      svgFavicon.rel = "icon";
      svgFavicon.type = "image/svg+xml";
      svgFavicon.href =
        "data:image/svg+xml," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%232E4F52'/><text x='16' y='22' text-anchor='middle' font-size='18' font-family='serif' fill='%23CBA47A'>IK</text></svg>",
        );
      document.head.appendChild(svgFavicon);
    }

    // Apple touch icon (data URI SVG rendered as 180x180)
    if (
      !document.querySelector('link[rel="apple-touch-icon"]')
    ) {
      const appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.setAttribute("sizes", "180x180");
      appleIcon.href =
        "data:image/svg+xml," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'><rect width='180' height='180' rx='36' fill='%232E4F52'/><text x='90' y='120' text-anchor='middle' font-size='90' font-family='serif' fill='%23CBA47A'>IK</text></svg>",
        );
      document.head.appendChild(appleIcon);
    }
  }, []);

  // Guided tour
  const { showTour, completeTour } = useGuidedTour();

  // Milestone celebrations
  const { celebration, celebrate, dismiss: dismissCelebration } = useCelebration();

  // URL ↔ activePage synchronization for deep linking & browser nav
  useUrlSync(activePage, (page) => {
    if (page !== activePage) {
      trackPage(page);
      setActivePage(page);
    }
  }, dashboardReady);

  // Wrapped page navigation with progress bar + recent tracking
  const handleNavigate = (page: string) => {
    if (page === activePage) return;
    startTransition();
    trackPage(page);
    setActivePage(page);
    // Scroll main content to top on navigation
    if (mainRef.current) mainRef.current.scrollTop = 0;
    // End transition after animation settles
    setTimeout(() => endTransition(), 350);
  };

  // Keyboard shortcuts
  const { shortcutsOpen, setShortcutsOpen } =
    useKeyboardShortcuts(
      dashboardReady ? handleNavigate : undefined,
    );

  // Scroll main content to top on page change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [activePage]);

  // Update document title based on active page
  useEffect(() => {
    const base = "Isang Kusina 2026";
    document.title =
      activePage === "Dashboard"
        ? base
        : `${activePage} — ${base}`;
  }, [activePage]);

  // Escape key closes mobile sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        setPreviewDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Sync viewMode to role on initial auth
  useEffect(() => {
    if (role) {
      if (role === "leadership") setViewMode("leadership");
      else if (role === "team") setViewMode("team");
      else setViewMode("chef");
    }
  }, [role]);

  // When switching views, redirect away from pages hidden in that view
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (
      mode === "chef" &&
      leadershipOnlyPages.includes(activePage)
    ) {
      setActivePage("Dashboard");
    } else if (
      mode === "team" &&
      teamHiddenPages.includes(activePage)
    ) {
      setActivePage("Dashboard");
    }
  };

  // Apply saved theme on mount, or from profile
  useEffect(() => {
    if (profile?.themePreference) {
      applyTheme(profile.themePreference);
    } else {
      const savedTheme = getSavedTheme();
      if (savedTheme !== "ik26") {
        applyTheme(savedTheme);
      }
    }
  }, [profile?.themePreference]);

  // On mount, check for existing session (profile-based or legacy)
  useEffect(() => {
    if (profileLoading) return;

    // Never bounce back to password if user is already past the gate
    if (appState === "dashboard" || appState === "onboarding")
      return;

    if (profile) {
      setRole(profile.role as UserRole);
      if (profile.onboardingCompleted) {
        setAppState("dashboard");
        setDashboardReady(true);
      } else if (
        profile.role === "leadership" ||
        profile.role === "team"
      ) {
        setAppState("dashboard");
        setDashboardReady(true);
        updateProfile({ onboardingCompleted: true });
      } else {
        const session = getSession();
        if (session.onboardingComplete) {
          updateProfile({ onboardingCompleted: true });
          setAppState("dashboard");
          setDashboardReady(true);
        } else {
          setAppState("password");
        }
      }
      return;
    }

    const session = getSession();
    if (session.role) {
      setRole(session.role);
      if (session.onboardingComplete) {
        setAppState("dashboard");
        setDashboardReady(true);
      } else if (session.rememberMe) {
        // Has session but onboarding not done — show password gate to resume
        setAppState("password");
      } else {
        setAppState("password");
      }
    }
  }, [profileLoading, profile]);

  const handlePasswordAuth = (
    authRole: UserRole,
    rememberMe: boolean,
  ) => {
    setRole(authRole);
    saveSession(authRole, rememberMe);

    if (authRole === "leadership" || authRole === "team") {
      completeOnboarding();
      if (profile) updateProfile({ onboardingCompleted: true });
      setAppState("dashboard");
      setDashboardReady(true);
      return;
    }

    if (profile?.onboardingCompleted) {
      completeOnboarding();
      setAppState("dashboard");
      setDashboardReady(true);
      return;
    }

    const session = getSession();
    if (session.onboardingComplete) {
      setAppState("dashboard");
      setDashboardReady(true);
    } else {
      setAppState("onboarding");
    }
  };

  const handleOnboardingComplete = () => {
    completeOnboarding();
    clearDraft();
    if (profile) updateProfile({ onboardingCompleted: true });
    setAppState("dashboard");
    setDashboardReady(true);
  };

  const resetOnboarding = async () => {
    await signOut();
    clearSession();
    applyTheme("ik26");
    setDashboardReady(false);
    setRole(null);
    setActivePage("Dashboard");
    setAppState("password");
  };

  // Show splash screen during initial load
  if (profileLoading && !splashDone) {
    return (
      <SplashScreen
        onComplete={() => setSplashDone(true)}
        minDuration={2200}
      />
    );
  }

  // If profile is still loading but splash completed, show a subtle loader
  if (profileLoading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "#F0F4F6" }}
        role="status"
        aria-label="Loading application"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: "2px solid rgba(206,180,122,0.15)",
                borderTopColor: "rgba(206,180,122,0.6)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: "rgba(206,180,122,0.4)",
                }}
              />
            </div>
          </div>
          <span
            className="text-[0.75rem] tracking-wider uppercase"
            style={{
              ...bodyFont,
              color: "#6E8185",
              letterSpacing: "0.15em",
            }}
          >
            Loading
          </span>
        </div>
      </div>
    );
  }

  if (appState === "password") {
    return (
      <PasswordGate onAuthenticated={handlePasswordAuth} />
    );
  }

  const currentRole = role || "chef";
  const effectiveRole: UserRole =
    viewMode === "chef"
      ? "chef"
      : viewMode === "team"
        ? "team"
        : currentRole;
  const isChefView = viewMode === "chef";
  const isTeamView = viewMode === "team";
  const isLeadershipView = viewMode === "leadership";

  // Shared page transition variants (slide + fade + subtle scale for native feel)
  const pageTransition = {
    initial: { opacity: 0, y: 14, scale: 0.997 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.999 },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <NotionProvider enabled={!!role}>
      <TooltipWalkthroughProvider
        role={effectiveRole}
        enabled={dashboardReady && activePage === "Dashboard"}
      >
        <div className="flex h-screen w-full bg-background font-sans overflow-hidden app-shell">
          {/* Skip to main content — accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-[0.875rem] focus:outline-none focus:shadow-lg skip-to-main"
            style={{
              fontFamily: "'Civil', 'Inter', sans-serif",
              backgroundColor: "#CBA47A",
              color: "#FFFDF5",
            }}
          >
            Skip to main content
          </a>

          {/* Screen reader page change announcements */}
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {activePage} page loaded
          </div>

          {/* Onboarding overlay */}
          <AnimatePresence>
            {appState === "onboarding" && role && (
              <OnboardingModal
                role={role}
                onComplete={handleOnboardingComplete}
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          {role && (
            <>
              <div className="hidden lg:block">
                <SidebarNav
                  role={role}
                  activePage={activePage}
                  onNavigate={handleNavigate}
                  displayName={profile?.displayName}
                  avatarId={profile?.avatarId}
                  viewMode={viewMode}
                  onViewModeChange={
                    role === "leadership"
                      ? handleViewModeChange
                      : undefined
                  }
                  recentPages={recentPages}
                  favorites={favorites}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  onReorderFavorites={reorderFavorites}
                  badgeCounts={badgeCounts}
                />
              </div>

              <AnimatePresence>
                {mobileSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close sidebar"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setMobileSidebarOpen(false);
                    }}
                  >
                    <motion.div
                      initial={{ x: -280 }}
                      animate={{ x: 0 }}
                      exit={{ x: -280 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                      className="h-full w-60"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SidebarNav
                        role={role}
                        activePage={activePage}
                        onNavigate={(page) => {
                          handleNavigate(page);
                          setMobileSidebarOpen(false);
                        }}
                        displayName={profile?.displayName}
                        avatarId={profile?.avatarId}
                        viewMode={viewMode}
                        onViewModeChange={
                          role === "leadership"
                            ? handleViewModeChange
                            : undefined
                        }
                        recentPages={recentPages}
                        favorites={favorites}
                        isFavorite={isFavorite}
                        onToggleFavorite={toggleFavorite}
                        onReorderFavorites={reorderFavorites}
                        badgeCounts={badgeCounts}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Network status banner */}
            <NetworkStatusBanner />

            {/* Page transition progress bar */}
            <PageProgressBar
              isTransitioning={isTransitioning}
            />

            <TopBar
              onResetOnboarding={() =>
                setSignOutDialogOpen(true)
              }
              onMobileMenuToggle={() =>
                setMobileSidebarOpen(!mobileSidebarOpen)
              }
              role={role}
              onNavigate={handleNavigate}
              displayName={profile?.displayName}
              avatarId={profile?.avatarId}
              viewMode={viewMode}
              onViewModeChange={
                role === "leadership"
                  ? handleViewModeChange
                  : undefined
              }
            />

            <main
              id="main-content"
              className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 pb-20 lg:pb-6 scroll-smooth main-content-area"
              ref={mainRef}
              role="main"
              aria-label={activePage}
              tabIndex={-1}
            >
              {/* Preview mode banner */}
              <AnimatePresence>
                {role === "leadership" &&
                  viewMode !== "leadership" &&
                  dashboardReady && (
                    <motion.div
                      key={`preview-${viewMode}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.25,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="mb-4 flex items-center justify-between px-3 sm:px-4 py-2.5 rounded-xl"
                      style={{
                        backgroundColor:
                          viewMode === "team"
                            ? "rgba(74,127,181,0.08)"
                            : "rgba(126,158,120,0.08)",
                        border:
                          viewMode === "team"
                            ? "1px solid rgba(74,127,181,0.2)"
                            : "1px solid rgba(126,158,120,0.2)",
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <Eye
                          className="w-4 h-4 shrink-0"
                          style={{
                            color:
                              viewMode === "team"
                                ? "#4A7FB5"
                                : "#7E9E78",
                          }}
                        />
                        <span
                          className="text-[0.75rem] sm:text-[0.8125rem]"
                          style={{
                            color:
                              viewMode === "team"
                                ? "#4A7FB5"
                                : "#7E9E78",
                            ...bodyFont,
                          }}
                        >
                          <span className="hidden sm:inline">
                            Previewing as{" "}
                          </span>
                          <strong>
                            {viewMode === "team"
                              ? "Team View"
                              : "Chef View"}
                          </strong>
                          <span className="hidden sm:inline">
                            {" "}
                            &mdash; seeing what{" "}
                            {viewMode === "team"
                              ? "team members"
                              : "chefs"}{" "}
                            see
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setPreviewDropdownOpen(
                                !previewDropdownOpen,
                              )
                            }
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
                            style={{
                              backgroundColor:
                                "rgba(212,170,124,0.1)",
                              color: "#D4AA7C",
                              border:
                                "1px solid rgba(212,170,124,0.2)",
                              ...bodyFont,
                            }}
                            aria-label="Switch view mode"
                            aria-expanded={previewDropdownOpen}
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              Switch
                            </span>
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${previewDropdownOpen ? "rotate-180" : ""}`}
                            />
                          </button>
                          <AnimatePresence>
                            {previewDropdownOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() =>
                                    setPreviewDropdownOpen(
                                      false,
                                    )
                                  }
                                  aria-hidden="true"
                                />
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    y: -4,
                                    scale: 0.95,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    y: -4,
                                    scale: 0.95,
                                  }}
                                  transition={{
                                    duration: 0.15,
                                  }}
                                  className="absolute right-0 top-full mt-1.5 w-44 bg-card rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                                  style={{
                                    border:
                                      "1px solid var(--border)",
                                  }}
                                  role="menu"
                                >
                                  {[
                                    {
                                      mode: "leadership" as ViewMode,
                                      label: "Manager View",
                                      icon: Shield,
                                      color: "#D4AA7C",
                                    },
                                    {
                                      mode: "team" as ViewMode,
                                      label: "Team View",
                                      icon: UsersRound,
                                      color: "#4A7FB5",
                                    },
                                    {
                                      mode: "chef" as ViewMode,
                                      label: "Chef View",
                                      icon: ChefHat,
                                      color: "#7E9E78",
                                    },
                                  ].map((item) => {
                                    const ItemIcon = item.icon;
                                    const isActive =
                                      viewMode === item.mode;
                                    return (
                                      <button
                                        key={item.mode}
                                        onClick={() => {
                                          handleViewModeChange(
                                            item.mode,
                                          );
                                          setPreviewDropdownOpen(
                                            false,
                                          );
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer transition-colors ${isActive ? "bg-secondary/60" : "hover:bg-secondary/40"}`}
                                        role="menuitem"
                                        aria-current={
                                          isActive
                                            ? "true"
                                            : undefined
                                        }
                                      >
                                        <ItemIcon
                                          className="w-3.5 h-3.5 shrink-0"
                                          style={{
                                            color: item.color,
                                          }}
                                        />
                                        <span
                                          className="text-[0.75rem] flex-1"
                                          style={{
                                            color: isActive
                                              ? item.color
                                              : undefined,
                                            ...bodyFont,
                                            fontWeight: isActive
                                              ? 600
                                              : 400,
                                          }}
                                        >
                                          {item.label}
                                        </span>
                                        {isActive && (
                                          <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{
                                              backgroundColor:
                                                item.color,
                                            }}
                                          />
                                        )}
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() =>
                            handleViewModeChange("leadership")
                          }
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                          style={{
                            backgroundColor:
                              viewMode === "team"
                                ? "rgba(74,127,181,0.12)"
                                : "rgba(126,158,120,0.12)",
                            color:
                              viewMode === "team"
                                ? "#4A7FB5"
                                : "#7E9E78",
                            border:
                              viewMode === "team"
                                ? "1px solid rgba(74,127,181,0.2)"
                                : "1px solid rgba(126,158,120,0.2)",
                            ...bodyFont,
                          }}
                          aria-label="Switch back to Manager view"
                        >
                          <Shield className="w-3 h-3" />
                          Back to Manager
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* Show skeleton while dashboard not ready */}
              {appState === "dashboard" && !dashboardReady && (
                <DashboardSkeleton />
              )}

              <AnimatePresence>
                {/* ===== PROFILE SETTINGS ===== */}
                {dashboardReady &&
                  activePage === "Settings" && (
                    <motion.div
                      key="settings"
                      {...pageTransition}
                    >
                      <ErrorBoundary section="Profile Settings">
                        <ProfileSettings
                          onBack={() =>
                            handleNavigate("Dashboard")
                          }
                          onSignOut={() =>
                            setSignOutDialogOpen(true)
                          }
                        />
                      </ErrorBoundary>
                    </motion.div>
                  )}

                {/* ===== DASHBOARD ===== */}
                {dashboardReady &&
                  activePage === "Dashboard" && (
                    <motion.div
                      key={`dashboard-${viewMode}`}
                      {...pageTransition}
                      className="space-y-6"
                    >
                      <ErrorBoundary section="Event Countdown">
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.05,
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <EventCountdown
                            role={effectiveRole}
                            onNavigate={handleNavigate}
                          />
                        </motion.div>
                      </ErrorBoundary>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.08,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <RoleWelcome viewMode={viewMode} />
                      </motion.div>
                      <ErrorBoundary section="Announcements">
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.11,
                            duration: 0.4,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <AnnouncementsBanner
                            role={effectiveRole}
                            onNavigate={handleNavigate}
                          />
                        </motion.div>
                      </ErrorBoundary>
                      <div data-tooltip-id="quick-actions">
                        <ErrorBoundary section="Quick Actions">
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.14,
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            <QuickActions
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </motion.div>
                        </ErrorBoundary>
                      </div>
                      {isLeadershipView && (
                        <div data-tooltip-id="kpi-cards">
                          <ErrorBoundary section="KPI Cards">
                            <motion.div
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.17,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                            >
                              <KpiCards role={effectiveRole} />
                            </motion.div>
                          </ErrorBoundary>
                        </div>
                      )}
                      {isTeamView && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.17,
                            duration: 0.4,
                          }}
                          className="flex justify-end"
                        >
                          <SimplifiedViewToggle />
                        </motion.div>
                      )}
                      {isLeadershipView && (
                        <div className="flex items-center justify-end gap-3">
                          <BackendHealthIndicator />
                          <NotionSyncIndicator />
                        </div>
                      )}

                      <GoldAccentLine />

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ik26-ambient-section">
                        <div className="lg:col-span-2 space-y-6">
                          {isLeadershipView && (
                            <>
                              <ErrorBoundary section="Manager Welcome Tour">
                                <ManagerWelcomeTour
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <ErrorBoundary section="Manager Analytics">
                                <ManagerAnalytics
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <ErrorBoundary section="Deployment Readiness">
                                <DeploymentReadiness
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <ErrorBoundary section="Pre-flight Check">
                                <PreflightPanel />
                              </ErrorBoundary>
                              <ErrorBoundary section="Pre-Launch Checklist">
                                <PreLaunchChecklist
                                  onNavigate={handleNavigate}
                                  onViewModeChange={setViewMode}
                                />
                              </ErrorBoundary>
                            </>
                          )}
                          {isTeamView && (
                            <>
                              <ErrorBoundary section="Team Welcome Tour">
                                <TeamWelcomeTour
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <ErrorBoundary section="Team Checklist">
                                <TeamChecklist
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <div
                                id="my-tasks-section"
                                data-tooltip-id="my-tasks"
                              >
                                <ErrorBoundary section="My Tasks">
                                  <MyTasks
                                    onNavigate={handleNavigate}
                                  />
                                </ErrorBoundary>
                              </div>
                            </>
                          )}
                          {isChefView && (
                            <>
                              <ErrorBoundary section="Chef Welcome Tour">
                                <ChefWelcomeTour
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <div data-tooltip-id="chef-progress">
                                <ErrorBoundary section="Chef Progress">
                                  <ChefProgress
                                    onNavigate={handleNavigate}
                                  />
                                </ErrorBoundary>
                              </div>
                            </>
                          )}
                          {/* Section divider */}
                          <div className="ik26-divider my-1" />
                          <div
                            id="action-needed-section"
                            data-tooltip-id="action-needed"
                          >
                            <ErrorBoundary section="Comms Action Items">
                              <CommsHub
                                role={effectiveRole}
                                onNavigate={handleNavigate}
                              />
                            </ErrorBoundary>
                          </div>
                          {/* Section divider */}
                          <div className="ik26-divider my-1" />
                          <ErrorBoundary section="Activity Feed">
                            <ActivityFeed
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </ErrorBoundary>
                          {/* Section divider */}
                          <div className="ik26-divider my-1" />
                          <ErrorBoundary section="Course Lineup">
                            <CourseLineup collapsible />
                          </ErrorBoundary>
                          {isLeadershipView && (
                            <>
                              <ErrorBoundary section="Planning Hub">
                                <PlanningHub
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                              <ErrorBoundary section="Performance Widget">
                                <PerformanceWidget
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </>
                          )}
                        </div>
                        <div className="space-y-6">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.2,
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="ik26-card-hover rounded-xl"
                          >
                            <ErrorBoundary section="Daily Prompt">
                              <DailyPrompt />
                            </ErrorBoundary>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.24,
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="ik26-card-hover rounded-xl"
                          >
                            <ErrorBoundary section="What's New">
                              <WhatsNew
                                role={effectiveRole}
                                onNavigate={handleNavigate}
                              />
                            </ErrorBoundary>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.28,
                              duration: 0.4,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="ik26-card-hover rounded-xl"
                          >
                            <ErrorBoundary section="Engagement">
                              <EngagementSection
                                onNavigate={handleNavigate}
                              />
                            </ErrorBoundary>
                          </motion.div>
                          {!isChefView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.52,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Outreach Pipeline">
                                <OutreachPipeline
                                  role={effectiveRole}
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isLeadershipView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.56,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Sponsor Pipeline">
                                <SponsorPipeline
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isLeadershipView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.6,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Landing Analytics">
                                <LandingAnalytics
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isLeadershipView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.64,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Audit Trail">
                                <AuditTrail onNavigate={handleNavigate} />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isLeadershipView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.68,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Content Studio Widget">
                                <ContentStudioWidget onNavigate={handleNavigate} />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isChefView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.2,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Chef Profile">
                                <ChefProfileCard
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isChefView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.28,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Chef Arrival Kit">
                                <ChefArrivalKit
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                          {isChefView && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: 0.36,
                                duration: 0.4,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="ik26-card-hover rounded-xl"
                            >
                              <ErrorBoundary section="Chef Command Center">
                                <ChefCommandCenter
                                  onNavigate={handleNavigate}
                                />
                              </ErrorBoundary>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                {/* ===== OTHER PAGES ===== */}
                {dashboardReady &&
                  activePage === "Community" &&
                  role && (
                    <motion.div
                      key="community"
                      {...pageTransition}
                    >
                      <ErrorBoundary section="Community">
                        <Suspense fallback={<PageSkeleton />}>
                          <CommunityPage
                            role={effectiveRole}
                            viewMode={viewMode}
                            onBack={() =>
                              handleNavigate("Dashboard")
                            }
                            onNavigate={handleNavigate}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </motion.div>
                  )}
                {dashboardReady && activePage === "Comms" && (
                  <motion.div key="comms" {...pageTransition}>
                    <ErrorBoundary section="Communications">
                      <Suspense fallback={<CommsSkeleton />}>
                        <CommsChat
                          role={effectiveRole}
                          onBack={() =>
                            handleNavigate("Dashboard")
                          }
                          onNavigate={handleNavigate}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {dashboardReady &&
                  activePage === "Our Istoryas" && (
                    <motion.div
                      key="our-istoryas"
                      {...pageTransition}
                    >
                      <ErrorBoundary section="Our Istoryas">
                        <Suspense fallback={<PageSkeleton />}>
                          <OurIstoryas
                            onBack={() =>
                              handleNavigate("Dashboard")
                            }
                            onNavigate={handleNavigate}
                          />
                        </Suspense>
                      </ErrorBoundary>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Chef Roster" &&
                  role && (
                    <motion.div
                      key="chef-roster"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Chef Roster"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Chef Roster">
                          <Suspense
                            fallback={<ChefRosterSkeleton />}
                          >
                            <ChefRoster
                              role={effectiveRole}
                              viewMode={viewMode}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Event Timeline" && (
                    <motion.div
                      key="event-timeline"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Event Timeline"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Event Timeline">
                          <Suspense
                            fallback={<EventTimelineSkeleton />}
                          >
                            <EventTimeline
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Travel & Lodging" && (
                    <motion.div
                      key="travel-lodging"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Travel & Lodging"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Travel & Lodging">
                          <Suspense fallback={<PageSkeleton />}>
                            <TravelLodging
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Menu & Courses" && (
                    <motion.div
                      key="menu-courses"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Menu & Courses"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Menu & Courses">
                          <Suspense fallback={<PageSkeleton />}>
                            <MenuCourses
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Team Deploy" &&
                  (viewMode === "leadership" ||
                    viewMode === "team") && (
                    <motion.div
                      key="team-deploy"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Team Deploy"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Team Deploy">
                          <Suspense fallback={<PageSkeleton />}>
                            <TeamDeploy
                              viewMode={viewMode}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Research & Story" &&
                  (viewMode === "leadership" ||
                    viewMode === "team") && (
                    <motion.div
                      key="research-story"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Research & Story"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Research & Story">
                          <Suspense fallback={<PageSkeleton />}>
                            <ResearchStory
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Budget & COGS" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="budget-cogs"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Budget & COGS"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Budget & COGS">
                          <Suspense fallback={<PageSkeleton />}>
                            <BudgetCogs
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Sponsors & Partners" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="sponsors-partners"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Sponsors & Partners"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Sponsors & Partners">
                          <Suspense fallback={<PageSkeleton />}>
                            <SponsorsPartners
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Links & Resources" && (
                    <motion.div
                      key="links-resources"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Links & Resources"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Links & Resources">
                          <Suspense fallback={<PageSkeleton />}>
                            <LinksResources
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Submit Menu" && (
                    <motion.div
                      key="submit-menu"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Submit Menu"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Chef Submission">
                          <Suspense fallback={<PageSkeleton />}>
                            <ChefSubmissionWizard
                              onNavigate={handleNavigate}
                              onClose={() =>
                                handleNavigate("Dashboard")
                              }
                              onCelebrate={celebrate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Members" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="members"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Members"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="User Management">
                          <Suspense fallback={<PageSkeleton />}>
                            <UserManagement />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Pre-Event Checklist" && (
                    <motion.div
                      key="pre-event-checklist"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Pre-Event Checklist"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Pre-Event Checklist">
                          <Suspense
                            fallback={<ChecklistSkeleton />}
                          >
                            <PreEventChecklist
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Task Board" && (
                    <motion.div
                      key="task-board"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Task Board"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Task Board">
                          <Suspense
                            fallback={<TaskBoardSkeleton />}
                          >
                            <TaskBoard
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Event Schedule" && (
                    <motion.div
                      key="event-schedule"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Event Schedule"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Event Schedule">
                          <Suspense
                            fallback={<EventScheduleSkeleton />}
                          >
                            <EventSchedule
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Activity Log" && (
                    <motion.div
                      key="activity-log"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Activity Log"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Activity Log">
                          <Suspense fallback={<PageSkeleton />}>
                            <ActivityLog
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady && activePage === "Portal" && (
                  <motion.div
                    key="portal"
                    {...pageTransition}
                    className="-m-3 sm:-m-4 md:-m-6 -mb-20 lg:-mb-6"
                  >
                    <ErrorBoundary section="Portal">
                      <Suspense fallback={<PageSkeleton />}>
                        <PortalPage
                          onNavigate={handleNavigate}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  </motion.div>
                )}
                {dashboardReady &&
                  activePage === "Share Invite" && (
                    <motion.div
                      key="share-invite"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Share & Invite"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Share Invite">
                          <Suspense fallback={<PageSkeleton />}>
                            <ShareInvite
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Inquiries" && (
                    <motion.div
                      key="inquiries"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Portal Inquiries"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Portal Inquiries">
                          <Suspense fallback={<PageSkeleton />}>
                            <PortalInquiries />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Notion Admin" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="notion-admin"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Notion Admin"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Notion Admin">
                          <Suspense fallback={<PageSkeleton />}>
                            <NotionAdmin />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Expenses" && (
                    <motion.div
                      key="expenses"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Expenses"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Expense Tracker">
                          <Suspense fallback={<PageSkeleton />}>
                            <ExpenseTracker
                              role={effectiveRole}
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Finance" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="finance"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Finance Dashboard"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Finance Dashboard">
                          <Suspense fallback={<PageSkeleton />}>
                            <FinanceDashboard
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Forms & Agreements" && (
                    <motion.div
                      key="forms-agreements"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Forms & Agreements"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Forms & Agreements">
                          <Suspense fallback={<PageSkeleton />}>
                            <FormsAgreements
                              onNavigate={handleNavigate}
                              role={effectiveRole}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Reimbursements" && (
                    <motion.div
                      key="reimbursements"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Reimbursements"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Reimbursements">
                          <Suspense fallback={<PageSkeleton />}>
                            <Reimbursements
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Mission Control" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="mission-control"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Mission Control"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Mission Control">
                          <Suspense fallback={<PageSkeleton />}>
                            <MissionControlPage
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "System Audit" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="system-audit"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="System Audit"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="System Audit">
                          <Suspense fallback={<PageSkeleton />}>
                            <AuditLogPage
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  activePage === "Content Studio" &&
                  role === "leadership" &&
                  viewMode === "leadership" && (
                    <motion.div
                      key="content-studio"
                      {...pageTransition}
                    >
                      <PageWrapper
                        title="Content Studio"
                        onBack={() =>
                          handleNavigate("Dashboard")
                        }
                      >
                        <ErrorBoundary section="Content Studio">
                          <Suspense fallback={<PageSkeleton />}>
                            <ContentStudio
                              onNavigate={handleNavigate}
                            />
                          </Suspense>
                        </ErrorBoundary>
                      </PageWrapper>
                    </motion.div>
                  )}
                {dashboardReady &&
                  ![
                    "Dashboard",
                    "Settings",
                    "Members",
                    "Community",
                    "Comms",
                    "Our Istoryas",
                    "Chef Roster",
                    "Event Timeline",
                    "Travel & Lodging",
                    "Menu & Courses",
                    "Team Deploy",
                    "Research & Story",
                    "Budget & COGS",
                    "Links & Resources",
                    "Submit Menu",
                    "Pre-Event Checklist",
                    "Task Board",
                    "Event Schedule",
                    "Activity Log",
                    "Portal",
                    "Share Invite",
                    "Inquiries",
                    "Notion Admin",
                    "Expenses",
                    "Finance",
                    "Forms & Agreements",
                    "Sponsors & Partners",
                    "Reimbursements",
                    "Mission Control",
                    "System Audit",
                    "Content Studio",
                  ].includes(activePage) && (
                    <motion.div
                      key={activePage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center h-64 text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                        <span
                          className="text-gold text-[1.25rem]"
                          style={headingFont}
                        >
                          {activePage.charAt(0)}
                        </span>
                      </div>
                      <h3
                        className="text-foreground mb-1"
                        style={headingFont}
                      >
                        {activePage}
                      </h3>
                      <p
                        className="text-muted-foreground text-[0.875rem]"
                        style={bodyFont}
                      >
                        This page isn't available in your current view.
                      </p>
                      <button
                        onClick={() => handleNavigate("Dashboard")}
                        className="mt-3 px-4 py-2 rounded-xl text-[0.8125rem] cursor-pointer transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: "rgba(201,169,110,0.1)",
                          color: "#C9A96E",
                          border: "1px solid rgba(201,169,110,0.2)",
                          ...bodyFont,
                        }}
                      >
                        Back to Dashboard
                      </button>
                    </motion.div>
                  )}
              </AnimatePresence>
            </main>
          </div>

          {/* Mobile bottom navigation */}
          {dashboardReady && role && (
            <MobileBottomNav
              activePage={activePage}
              onNavigate={handleNavigate}
              viewMode={viewMode}
            />
          )}

          {/* Keyboard shortcuts dialog */}
          <KeyboardShortcuts
            open={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          {/* Sign-out confirmation dialog */}
          <SignOutDialog
            open={signOutDialogOpen}
            onConfirm={() => {
              setSignOutDialogOpen(false);
              resetOnboarding();
            }}
            onCancel={() => setSignOutDialogOpen(false)}
            displayName={profile?.displayName}
          />

          {/* Global scroll-to-top FAB */}
          {dashboardReady && (
            <ScrollToTop scrollRef={mainRef} />
          )}

          {/* Floating share button — accessible from any page */}
          {dashboardReady && activePage !== "Share Invite" && (
            <FloatingShareButton onNavigate={handleNavigate} />
          )}

          {/* Session timeout warning */}
          {dashboardReady && (
            <SessionTimeout onSignOut={resetOnboarding} />
          )}

          {/* PWA install banner */}
          {dashboardReady && <PWAInstallBanner />}

          {/* Guided tour for first-time users */}
          {dashboardReady && activePage === "Dashboard" && (
            <GuidedTour
              open={showTour}
              onComplete={completeTour}
              viewMode={viewMode}
            />
          )}

          {/* Milestone celebration overlay */}
          {celebration && (
            <MilestoneCelebration
              show={true}
              title={celebration.title}
              subtitle={celebration.subtitle}
              duration={celebration.duration}
              onComplete={dismissCelebration}
            />
          )}
        </div>
      </TooltipWalkthroughProvider>
    </NotionProvider>
  );
}

export default function App() {
  // Path-based routing: "/welcome" shows the public landing page,
  // "/privacy" and "/terms" show legal pages,
  // everything else (including "/") shows the coordination portal.
  const [routePath] = useState(() => window.location.pathname);

  if (routePath === "/welcome") {
    return <LandingPage />;
  }

  if (routePath === "/privacy") {
    return <PrivacyPolicy />;
  }

  if (routePath === "/terms") {
    return <TermsOfService />;
  }

  if (routePath === "/screenshots") {
    return <AppStoreScreenshots />;
  }

  return (
    <AppErrorBoundary>
      <ProfileProvider>
        <SimplifiedViewProvider>
          <AppInner />
        </SimplifiedViewProvider>
        <Toaster
          position="bottom-right"
          gap={8}
          offset={
            typeof window !== "undefined" &&
            window.innerWidth < 1024
              ? 80
              : 16
          }
          toastOptions={{
            style: {
              fontFamily: "'Civil', 'DM Sans', 'Inter', sans-serif",
              fontSize: "0.8125rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(140,165,135,0.1)",
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
            },
          }}
        />
        <SWUpdateToast />
      </ProfileProvider>
    </AppErrorBoundary>
  );
}