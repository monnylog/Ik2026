import { motion } from "motion/react";
import type { UserRole, ViewMode } from "./onboarding/use-auth";
import { ErrorBoundary } from "./ui/error-boundary";

import { EventCountdown } from "./dashboard/event-countdown";
import { RoleWelcome } from "./dashboard/role-welcome";
import { AnnouncementsBanner } from "./dashboard/announcements-banner";
import { QuickActions } from "./dashboard/quick-actions";
import { KpiCards } from "./kpi-cards";
import { NotionSyncIndicator } from "./dashboard/notion-sync-indicator";
import { CommsHub } from "./dashboard/comms-hub";
import { OutreachPipeline } from "./dashboard/outreach-pipeline";
import { CourseLineup } from "./course-lineup";
import { DeploymentReadiness } from "./dashboard/deployment-readiness";
import { MyTasks } from "./dashboard/my-tasks";
import { VitalSigns } from "./dashboard/vital-signs";
import { OpenDecisions } from "./dashboard/open-decisions";
import { ChefProgress } from "./dashboard/chef-progress";
import { ChefProfileCard } from "./dashboard/chef-profile-card";
import { ChefArrivalKit } from "./dashboard/chef-arrival-kit";
import { ChefCommandCenter } from "./dashboard/chef-command-center";

const ease = [0.22, 1, 0.36, 1] as const;

function Stagger({ delay, children, className, id }: {
  delay: number; children: React.ReactNode; className?: string; id?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease }}
      className={className}
      id={id}
    >
      {children}
    </motion.div>
  );
}

interface DashboardViewProps {
  role: UserRole;
  viewMode: ViewMode;
  onNavigate: (page: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
}

export function DashboardView({ role, viewMode, onNavigate }: DashboardViewProps) {
  const isLeadershipView = viewMode === "leadership";
  const isTeamView = viewMode === "team";
  const isChefView = viewMode === "chef";

  return (
    <div className="space-y-6">
      {/* Hero — every role sees the countdown */}
      <ErrorBoundary section="Event Countdown">
        <Stagger delay={0.05}>
          <EventCountdown role={role} onNavigate={onNavigate} />
        </Stagger>
      </ErrorBoundary>

      <Stagger delay={0.08}>
        <RoleWelcome viewMode={viewMode} />
      </Stagger>

      <ErrorBoundary section="Announcements">
        <Stagger delay={0.11}>
          <AnnouncementsBanner role={role} onNavigate={onNavigate} />
        </Stagger>
      </ErrorBoundary>

      <ErrorBoundary section="Quick Actions">
        <Stagger delay={0.14}>
          <QuickActions role={role} onNavigate={onNavigate} />
        </Stagger>
      </ErrorBoundary>

      {isLeadershipView && (
        <ErrorBoundary section="KPI Cards">
          <Stagger delay={0.17}>
            <KpiCards role={role} />
          </Stagger>
        </ErrorBoundary>
      )}

      {isLeadershipView && (
        <div className="flex items-center justify-end gap-3">
          <NotionSyncIndicator />
        </div>
      )}

      <div className="h-px bg-border/30 my-2" />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary column */}
        <div className="lg:col-span-2 space-y-6">
          {isLeadershipView && (
            <ErrorBoundary section="Deployment Readiness">
              <DeploymentReadiness onNavigate={onNavigate} />
            </ErrorBoundary>
          )}

          {isTeamView && (
            <ErrorBoundary section="My Tasks">
              <MyTasks onNavigate={onNavigate} />
            </ErrorBoundary>
          )}

          {isChefView && (
            <ErrorBoundary section="Chef Progress">
              <ChefProgress onNavigate={onNavigate} />
            </ErrorBoundary>
          )}

          <ErrorBoundary section="Comms">
            <CommsHub role={role} onNavigate={onNavigate} />
          </ErrorBoundary>

          <ErrorBoundary section="Course Lineup">
            <CourseLineup collapsible />
          </ErrorBoundary>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {isLeadershipView && (
            <>
              <Stagger delay={0.2}>
                <ErrorBoundary section="Vital Signs">
                  <VitalSigns />
                </ErrorBoundary>
              </Stagger>
              <Stagger delay={0.24}>
                <ErrorBoundary section="Open Decisions">
                  <OpenDecisions onNavigate={onNavigate} />
                </ErrorBoundary>
              </Stagger>
              <Stagger delay={0.28}>
                <ErrorBoundary section="Outreach Pipeline">
                  <OutreachPipeline role={role} onNavigate={onNavigate} />
                </ErrorBoundary>
              </Stagger>
            </>
          )}

          {isTeamView && (
            <Stagger delay={0.2}>
              <ErrorBoundary section="Outreach Pipeline">
                <OutreachPipeline role={role} onNavigate={onNavigate} />
              </ErrorBoundary>
            </Stagger>
          )}

          {isChefView && (
            <>
              <Stagger delay={0.2}>
                <ErrorBoundary section="Chef Profile">
                  <ChefProfileCard onNavigate={onNavigate} />
                </ErrorBoundary>
              </Stagger>
              <Stagger delay={0.24}>
                <ErrorBoundary section="Chef Arrival Kit">
                  <ChefArrivalKit onNavigate={onNavigate} />
                </ErrorBoundary>
              </Stagger>
              <Stagger delay={0.28}>
                <ErrorBoundary section="Chef Command Center">
                  <ChefCommandCenter onNavigate={onNavigate} />
                </ErrorBoundary>
              </Stagger>
            </>
          )}
        </div>
      </div>
    </div>
  );
}