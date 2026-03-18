// PageRouter — data-driven routing for all non-dashboard pages
// Extracted from App.tsx to reduce monolith size
import type React from "react";
import { Suspense, lazy } from "react";
import { motion } from "motion/react";
import type { UserRole, ViewMode } from "./onboarding/use-auth";
import { ErrorBoundary } from "./ui/error-boundary";
import { PageWrapper } from "./page-wrapper";
import {
  PageSkeleton,
  EventTimelineSkeleton,
  EventScheduleSkeleton,
  TaskBoardSkeleton,
  ChecklistSkeleton,
  CommsSkeleton,
  ChefRosterSkeleton,
} from "./ui/skeleton-loaders";
import { bodyFont, headingFont } from "../lib/fonts";
import { ModuleLoadError } from "./ui/module-load-error";
import { moduleRetryToast } from "../lib/api-toast";

// ── Lazy retry wrapper (duplicated from App.tsx to avoid circular deps) ──
function lazyRetry<T extends Record<string, any>>(
  factory: () => Promise<T>,
  namedExport: keyof T,
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(() =>
    factory()
      .then((m) => ({ default: m[namedExport] as React.ComponentType<any> }))
      .catch(
        () =>
          new Promise<{ default: React.ComponentType<any> }>((resolve) =>
            setTimeout(
              () =>
                factory()
                  .then((m) => {
                    moduleRetryToast(String(namedExport));
                    resolve({ default: m[namedExport] as React.ComponentType<any> });
                  })
                  .catch((retryErr: unknown) => {
                    console.error("[LazyRetry] Module fetch failed after retry:", retryErr);
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
          ),
      ),
  );
}

// ── Lazy page components ─────────────────────────────────────────
const CommsChat = lazyRetry(() => import("./comms-chat"), "CommsChat");
const OurIstoryas = lazyRetry(() => import("./engagement/our-istoryas"), "OurIstoryas");
const ChefRoster = lazyRetry(() => import("./chef-roster"), "ChefRoster");
const ChefJourney = lazyRetry(() => import("./chef-journey"), "ChefJourney");
const EventTimeline = lazyRetry(() => import("./event-timeline"), "EventTimeline");
const TravelLodging = lazyRetry(() => import("./travel-lodging"), "TravelLodging");
const MenuCourses = lazyRetry(() => import("./menu-courses"), "MenuCourses");
const TeamDeploy = lazyRetry(() => import("./team-deploy"), "TeamDeploy");
const ResearchStory = lazyRetry(() => import("./research-story"), "ResearchStory");
const BudgetCogs = lazyRetry(() => import("./budget-cogs"), "BudgetCogs");
const LinksResources = lazyRetry(() => import("./links-resources"), "LinksResources");
const ChefSubmissionWizard = lazyRetry(() => import("./chef-submission-wizard"), "ChefSubmissionWizard");
const UserManagement = lazyRetry(() => import("./user-management"), "UserManagement");
const PreEventChecklist = lazyRetry(() => import("./pre-event-checklist"), "PreEventChecklist");
const TaskBoard = lazyRetry(() => import("./task-board"), "TaskBoard");
const EventSchedule = lazyRetry(() => import("./event-schedule"), "EventSchedule");
const ActivityLog = lazyRetry(() => import("./activity-log"), "ActivityLog");
const PortalPage = lazyRetry(() => import("./portal-page"), "PortalPage");
const ShareInvite = lazyRetry(() => import("./share-invite"), "ShareInvite");
const PortalInquiries = lazyRetry(() => import("./portal-inquiries"), "PortalInquiries");
const NotionAdmin = lazyRetry(() => import("./notion-admin"), "NotionAdmin");
const SponsorsPartners = lazyRetry(() => import("./sponsors-partners"), "SponsorsPartners");
const ExpenseTracker = lazyRetry(() => import("./expense-tracker"), "ExpenseTracker");
const FinanceDashboard = lazyRetry(() => import("./finance-dashboard"), "FinanceDashboard");
const MissionControlPage = lazyRetry(() => import("./mission-control"), "MissionControl");
const ContentStudio = lazyRetry(() => import("./content-studio"), "ContentStudio");

// ── Types ────────────────────────────────────────────────────────

interface PageRouterProps {
  activePage: string;
  role: UserRole;
  viewMode: ViewMode;
  onNavigate: (page: string) => void;
  onCelebrate: () => void;
  pageTransition: Record<string, any>;
}

// ── Known pages list (for fallback detection) ────────────────────

const KNOWN_PAGES = [
  "Dashboard", "Settings", "Comms", "Our Istoryas",
  "Chef Roster", "Chef Journey", "Event Timeline", "Travel & Lodging",
  "Menu & Courses", "Team Deploy", "Research & Story", "Budget & COGS",
  "Sponsors & Partners", "Links & Resources", "Submit Menu", "Members",
  "Pre-Event Checklist", "Task Board", "Event Schedule", "Activity Log",
  "Portal", "Share Invite", "Inquiries", "Notion Admin", "Expenses",
  "Finance", "Mission Control", "Content Studio",
];

// ══════════════════════════════════════════════════════════════════
//  PAGE ROUTER
// ══════════════════════════════════════════════════════════════════

export function PageRouter({
  activePage,
  role,
  viewMode,
  onNavigate,
  onCelebrate,
  pageTransition,
}: PageRouterProps) {
  const effectiveRole = role;
  const isLeadership = role === "leadership" && viewMode === "leadership";
  const isLeadershipOrTeam = viewMode === "leadership" || viewMode === "team";
  const goBack = () => onNavigate("Dashboard");

  // Helper: wrap in PageWrapper with consistent structure
  function wrap(
    key: string,
    title: string,
    skeleton: React.ReactNode,
    content: React.ReactNode,
    section?: string,
  ) {
    return (
      <motion.div key={key} {...pageTransition}>
        <PageWrapper title={title} onBack={goBack}>
          <ErrorBoundary section={section || title}>
            <Suspense fallback={skeleton}>{content}</Suspense>
          </ErrorBoundary>
        </PageWrapper>
      </motion.div>
    );
  }

  // Helper: wrap without PageWrapper (full-bleed pages)
  function wrapBare(
    key: string,
    skeleton: React.ReactNode,
    content: React.ReactNode,
    section: string,
    className?: string,
  ) {
    return (
      <motion.div key={key} {...pageTransition} className={className}>
        <ErrorBoundary section={section}>
          <Suspense fallback={skeleton}>{content}</Suspense>
        </ErrorBoundary>
      </motion.div>
    );
  }

  switch (activePage) {
    // ── Custom layout pages ──────────────────────────────────
    case "Comms":
      return wrapBare("comms", <CommsSkeleton />,
        <CommsChat role={effectiveRole} onBack={goBack} onNavigate={onNavigate} />,
        "Communications",
      );

    case "Our Istoryas":
      return wrapBare("our-istoryas", <PageSkeleton />,
        <OurIstoryas onBack={goBack} onNavigate={onNavigate} />,
        "Our Istoryas",
      );

    case "Portal":
      return wrapBare("portal", <PageSkeleton />,
        <PortalPage onNavigate={onNavigate} />,
        "Portal",
        "-m-3 sm:-m-4 md:-m-6 -mb-20 lg:-mb-6",
      );

    // ── Standard PageWrapper pages ──────────────────────────
    case "Chef Roster":
      if (!role) return null;
      return wrap("chef-roster", "Chef Roster", <ChefRosterSkeleton />,
        <ChefRoster role={effectiveRole} viewMode={viewMode} onNavigate={onNavigate} />,
      );

    case "Chef Journey":
      return wrap("chef-journey", "Chef Journey", <PageSkeleton />,
        <ChefJourney viewMode={viewMode} onNavigate={onNavigate} />,
      );

    case "Event Timeline":
      return wrap("event-timeline", "Event Timeline", <EventTimelineSkeleton />,
        <EventTimeline role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Travel & Lodging":
      return wrap("travel-lodging", "Travel & Lodging", <PageSkeleton />,
        <TravelLodging role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Menu & Courses":
      return wrap("menu-courses", "Menu & Courses", <PageSkeleton />,
        <MenuCourses role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Links & Resources":
      return wrap("links-resources", "Links & Resources", <PageSkeleton />,
        <LinksResources role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Submit Menu":
      return wrap("submit-menu", "Submit Menu", <PageSkeleton />,
        <ChefSubmissionWizard onNavigate={onNavigate} onClose={goBack} onCelebrate={onCelebrate} />,
        "Chef Submission",
      );

    case "Pre-Event Checklist":
      return wrap("pre-event-checklist", "Pre-Event Checklist", <ChecklistSkeleton />,
        <PreEventChecklist role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Task Board":
      return wrap("task-board", "Task Board", <TaskBoardSkeleton />,
        <TaskBoard role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Event Schedule":
      return wrap("event-schedule", "Event Schedule", <EventScheduleSkeleton />,
        <EventSchedule role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Activity Log":
      return wrap("activity-log", "Activity Log", <PageSkeleton />,
        <ActivityLog role={effectiveRole} onNavigate={onNavigate} />,
      );

    case "Share Invite":
      return wrap("share-invite", "Share & Invite", <PageSkeleton />,
        <ShareInvite onNavigate={onNavigate} />,
      );

    case "Inquiries":
      return wrap("inquiries", "Portal Inquiries", <PageSkeleton />,
        <PortalInquiries />,
        "Portal Inquiries",
      );

    case "Expenses":
      return wrap("expenses", "Expenses", <PageSkeleton />,
        <ExpenseTracker role={effectiveRole} onNavigate={onNavigate} />,
        "Expense Tracker",
      );

    // ── View-mode gated pages ───────────────────────────────
    case "Team Deploy":
      if (!isLeadershipOrTeam) return null;
      return wrap("team-deploy", "Team Deploy", <PageSkeleton />,
        <TeamDeploy viewMode={viewMode} onNavigate={onNavigate} />,
      );

    case "Research & Story":
      if (!isLeadershipOrTeam) return null;
      return wrap("research-story", "Research & Story", <PageSkeleton />,
        <ResearchStory onNavigate={onNavigate} />,
      );

    // ── Leadership-only pages ───────────────────────────────
    case "Budget & COGS":
      if (!isLeadership) return null;
      return wrap("budget-cogs", "Budget & COGS", <PageSkeleton />,
        <BudgetCogs onNavigate={onNavigate} />,
      );

    case "Sponsors & Partners":
      if (!isLeadership) return null;
      return wrap("sponsors-partners", "Sponsors & Partners", <PageSkeleton />,
        <SponsorsPartners onNavigate={onNavigate} />,
      );

    case "Members":
      if (!isLeadership) return null;
      return wrap("members", "Members", <PageSkeleton />,
        <UserManagement />,
        "User Management",
      );

    case "Notion Admin":
      if (!isLeadership) return null;
      return wrap("notion-admin", "Notion Admin", <PageSkeleton />,
        <NotionAdmin />,
      );

    case "Finance":
      if (!isLeadership) return null;
      return wrap("finance", "Finance Dashboard", <PageSkeleton />,
        <FinanceDashboard onNavigate={onNavigate} />,
      );

    case "Mission Control":
      if (!isLeadership) return null;
      return wrap("mission-control", "Mission Control", <PageSkeleton />,
        <MissionControlPage onNavigate={onNavigate} />,
      );

    case "Content Studio":
      if (!isLeadership) return null;
      return wrap("content-studio", "Content Studio", <PageSkeleton />,
        <ContentStudio onNavigate={onNavigate} />,
      );

    default:
      // Unknown page fallback
      if (!KNOWN_PAGES.includes(activePage)) {
        return (
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center h-64 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
              <span className="text-gold text-[1.25rem]" style={headingFont}>
                {activePage.charAt(0)}
              </span>
            </div>
            <h3 className="text-foreground mb-1" style={headingFont}>
              {activePage}
            </h3>
            <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
              This page isn't available in your current view.
            </p>
            <button
              onClick={goBack}
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
        );
      }
      return null;
  }
}