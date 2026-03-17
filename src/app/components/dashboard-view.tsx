import { motion } from "motion/react";
import type { UserRole, ViewMode } from "./onboarding/use-auth";
import { ErrorBoundary } from "./ui/error-boundary";
import { SimplifiedViewToggle } from "./ui/simplified-view-toggle";

// Dashboard widgets
import { EventCountdown } from "./dashboard/event-countdown";
import { RoleWelcome } from "./dashboard/role-welcome";
import { AnnouncementsBanner } from "./dashboard/announcements-banner";
import { QuickActions } from "./dashboard/quick-actions";
import { KpiCards } from "./kpi-cards";
import { NotionSyncIndicator } from "./dashboard/notion-sync-indicator";
import { ActivityFeed } from "./dashboard/activity-feed";
import { DailyPrompt } from "./engagement/daily-prompt";
import { CommsHub } from "./dashboard/comms-hub";
import { EngagementSection } from "./dashboard/engagement-section";
import { OutreachPipeline } from "./dashboard/outreach-pipeline";
import { CourseLineup } from "./course-lineup";
import { LandingAnalytics } from "./dashboard/landing-analytics";
import { PlanningHub } from "./dashboard/planning-hub";
import { PerformanceWidget } from "./dashboard/performance-widget";
import { SponsorPipeline } from "./dashboard/sponsor-pipeline";

// Manager dashboard
import { ManagerWelcomeTour } from "./dashboard/manager-welcome-tour";
import { ManagerAnalytics } from "./dashboard/manager-analytics";
import { DeploymentReadiness } from "./dashboard/deployment-readiness";
import { PreLaunchChecklist } from "./dashboard/prelaunch-checklist";
import { PreflightPanel } from "./dashboard/preflight-panel";

// Team dashboard
import { TeamWelcomeTour } from "./dashboard/team-welcome-tour";
import { TeamChecklist } from "./dashboard/team-checklist";
import { MyTasks } from "./dashboard/my-tasks";

// Chef dashboard
import { ChefWelcomeTour } from "./dashboard/chef-welcome-tour";
import { ChefProgress } from "./dashboard/chef-progress";
import { ChefProfileCard } from "./dashboard/chef-profile-card";
import { ChefArrivalKit } from "./dashboard/chef-arrival-kit";
import { ChefCommandCenter } from "./dashboard/chef-command-center";
import { WhatsNew } from "./dashboard/whats-new";
import { BackendHealthIndicator } from "./dashboard/backend-health";
import { AuditTrail } from "./dashboard/audit-trail";
import { ContentStudioWidget } from "./dashboard/content-studio-widget";

import { GoldAccentLine } from "./dashboard/dashboard-layout";

/* ═══════════════════════════════════════════════════════════════════
   Staggered animation helper — consistent entrance delays
   ═══════════════════════════════════════════════════════════════════ */

const ease = [0.22, 1, 0.36, 1] as const;

function Stagger({
  delay,
  children,
  className,
  id,
  "data-tooltip-id": tooltipId,
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
  id?: string;
  "data-tooltip-id"?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease }}
      className={className}
      id={id}
      data-tooltip-id={tooltipId}
    >
      {children}
    </motion.div>
  );
}

function SideStagger({
  delay,
  children,
  className,
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease }}
      className={className || "ik26-card-hover rounded-xl"}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD VIEW
   Extracted from App.tsx — the main dashboard rendering block.
   ═══════════════════════════════════════════════════════════════════ */

interface DashboardViewProps {
  role: UserRole;
  viewMode: ViewMode;
  onNavigate: (page: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function DashboardView({
  role,
  viewMode,
  onNavigate,
  onViewModeChange,
}: DashboardViewProps) {
  const isLeadershipView = viewMode === "leadership";
  const isTeamView = viewMode === "team";
  const isChefView = viewMode === "chef";

  return (
    <div className="space-y-6">
      {/* Event Countdown Hero */}
      <ErrorBoundary section="Event Countdown">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease }}
        >
          <EventCountdown role={role} onNavigate={onNavigate} />
        </motion.div>
      </ErrorBoundary>

      {/* Role Welcome */}
      <Stagger delay={0.08}>
        <RoleWelcome viewMode={viewMode} />
      </Stagger>

      {/* Announcements */}
      <ErrorBoundary section="Announcements">
        <Stagger delay={0.11}>
          <AnnouncementsBanner role={role} onNavigate={onNavigate} />
        </Stagger>
      </ErrorBoundary>

      {/* Quick Actions */}
      <div data-tooltip-id="quick-actions">
        <ErrorBoundary section="Quick Actions">
          <Stagger delay={0.14}>
            <QuickActions role={role} onNavigate={onNavigate} />
          </Stagger>
        </ErrorBoundary>
      </div>

      {/* KPI Cards — leadership only */}
      {isLeadershipView && (
        <div data-tooltip-id="kpi-cards">
          <ErrorBoundary section="KPI Cards">
            <Stagger delay={0.17}>
              <KpiCards role={role} />
            </Stagger>
          </ErrorBoundary>
        </div>
      )}

      {/* Simplified view toggle — team only */}
      {isTeamView && (
        <Stagger delay={0.17} className="flex justify-end">
          <SimplifiedViewToggle />
        </Stagger>
      )}

      {/* Health indicators — leadership only */}
      {isLeadershipView && (
        <div className="flex items-center justify-end gap-3">
          <BackendHealthIndicator />
          <NotionSyncIndicator />
        </div>
      )}

      <GoldAccentLine />

      {/* ─── Main 3-column grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ik26-ambient-section">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leadership-specific widgets */}
          {isLeadershipView && (
            <>
              <ErrorBoundary section="Manager Welcome Tour">
                <ManagerWelcomeTour onNavigate={onNavigate} />
              </ErrorBoundary>
              <ErrorBoundary section="Manager Analytics">
                <ManagerAnalytics onNavigate={onNavigate} />
              </ErrorBoundary>
              <ErrorBoundary section="Deployment Readiness">
                <DeploymentReadiness onNavigate={onNavigate} />
              </ErrorBoundary>
              <ErrorBoundary section="Pre-flight Check">
                <PreflightPanel />
              </ErrorBoundary>
              <ErrorBoundary section="Pre-Launch Checklist">
                <PreLaunchChecklist
                  onNavigate={onNavigate}
                  onViewModeChange={onViewModeChange}
                />
              </ErrorBoundary>
            </>
          )}

          {/* Team-specific widgets */}
          {isTeamView && (
            <>
              <ErrorBoundary section="Team Welcome Tour">
                <TeamWelcomeTour onNavigate={onNavigate} />
              </ErrorBoundary>
              <ErrorBoundary section="Team Checklist">
                <TeamChecklist onNavigate={onNavigate} />
              </ErrorBoundary>
              <div id="my-tasks-section" data-tooltip-id="my-tasks">
                <ErrorBoundary section="My Tasks">
                  <MyTasks onNavigate={onNavigate} />
                </ErrorBoundary>
              </div>
            </>
          )}

          {/* Chef-specific widgets */}
          {isChefView && (
            <>
              <ErrorBoundary section="Chef Welcome Tour">
                <ChefWelcomeTour onNavigate={onNavigate} />
              </ErrorBoundary>
              <div data-tooltip-id="chef-progress">
                <ErrorBoundary section="Chef Progress">
                  <ChefProgress onNavigate={onNavigate} />
                </ErrorBoundary>
              </div>
            </>
          )}

          {/* Shared widgets */}
          <div className="ik26-divider my-1" />
          <div id="action-needed-section" data-tooltip-id="action-needed">
            <ErrorBoundary section="Comms Action Items">
              <CommsHub role={role} onNavigate={onNavigate} />
            </ErrorBoundary>
          </div>
          <div className="ik26-divider my-1" />
          <ErrorBoundary section="Activity Feed">
            <ActivityFeed role={role} onNavigate={onNavigate} />
          </ErrorBoundary>
          <div className="ik26-divider my-1" />
          <ErrorBoundary section="Course Lineup">
            <CourseLineup collapsible />
          </ErrorBoundary>

          {/* Leadership bottom widgets */}
          {isLeadershipView && (
            <>
              <ErrorBoundary section="Planning Hub">
                <PlanningHub onNavigate={onNavigate} />
              </ErrorBoundary>
              <ErrorBoundary section="Performance Widget">
                <PerformanceWidget onNavigate={onNavigate} />
              </ErrorBoundary>
            </>
          )}
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          <SideStagger delay={0.2}>
            <ErrorBoundary section="Daily Prompt">
              <DailyPrompt />
            </ErrorBoundary>
          </SideStagger>

          <SideStagger delay={0.24}>
            <ErrorBoundary section="What's New">
              <WhatsNew role={role} onNavigate={onNavigate} />
            </ErrorBoundary>
          </SideStagger>

          <SideStagger delay={0.28}>
            <ErrorBoundary section="Engagement">
              <EngagementSection onNavigate={onNavigate} />
            </ErrorBoundary>
          </SideStagger>

          {!isChefView && (
            <SideStagger delay={0.52}>
              <ErrorBoundary section="Outreach Pipeline">
                <OutreachPipeline role={role} onNavigate={onNavigate} />
              </ErrorBoundary>
            </SideStagger>
          )}

          {isLeadershipView && (
            <>
              <SideStagger delay={0.56}>
                <ErrorBoundary section="Sponsor Pipeline">
                  <SponsorPipeline onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
              <SideStagger delay={0.6}>
                <ErrorBoundary section="Landing Analytics">
                  <LandingAnalytics onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
              <SideStagger delay={0.64}>
                <ErrorBoundary section="Audit Trail">
                  <AuditTrail onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
              <SideStagger delay={0.68}>
                <ErrorBoundary section="Content Studio Widget">
                  <ContentStudioWidget onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
            </>
          )}

          {isChefView && (
            <>
              <SideStagger delay={0.2}>
                <ErrorBoundary section="Chef Profile">
                  <ChefProfileCard onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
              <SideStagger delay={0.28}>
                <ErrorBoundary section="Chef Arrival Kit">
                  <ChefArrivalKit onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
              <SideStagger delay={0.36}>
                <ErrorBoundary section="Chef Command Center">
                  <ChefCommandCenter onNavigate={onNavigate} />
                </ErrorBoundary>
              </SideStagger>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
