import { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronDown,
  Sparkles,
  ArrowRight,
  Zap,
  Users,
  MessageCircle,
  UtensilsCrossed,
  Shield,
  Palette,
  Globe,
  ClipboardList,
  Rocket,
  RefreshCw,
  Activity,
  Plane,
  ScrollText,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";
import { useUserData } from "../../lib/use-user-data";
import { bodyFont, headingFont } from "../../lib/fonts";

interface UpdateItem {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  audience: "all" | "leadership" | "chef" | "team";
  navigateTo?: string;
}

const updates: UpdateItem[] = [
  {
    id: "u-10",
    date: "Mar 17",
    title: "v3.3.0 Experience Polish",
    description:
      "Immersive visual refresh: proper web fonts (DM Sans + Cormorant Garamond fallbacks), milestone celebration animations with confetti, enriched Chef Command Center with card grid layout, ambient dashboard sections, gold accent lines, and consistent typography across all views.",
    icon: Palette,
    color: "#CBA47A",
    audience: "all",
  },
  {
    id: "u-9",
    date: "Mar 16",
    title: "System Audit Full Page",
    description:
      "Full-page System Audit log with rich filtering (category, severity, date range), search, CSV export, cleanup controls, stats dashboard with category distribution bar, and clickable entry detail panels.",
    icon: ScrollText,
    color: "#C9A96E",
    audience: "leadership",
    navigateTo: "System Audit",
  },
  {
    id: "u-8",
    date: "Mar 16",
    title: "Modularization + Audit Trail",
    description:
      "Server split: engagement routes → engagement-routes.tsx, expense routes → expense-routes.tsx. New audit-routes.tsx with GET/POST /audit/log and /audit/summary. AuditTrail dashboard widget shows 10 most recent system actions.",
    icon: Shield,
    color: "#8B7EC8",
    audience: "leadership",
  },
  {
    id: "u-7",
    date: "Mar 16",
    title: "Config, Discord & Import",
    description:
      "Form URLs now server-configurable via KV. Discord webhook sends Notion sync summaries to #bot-alerts. New /import/restore endpoint for backup restoration with merge/dry-run modes.",
    icon: Sparkles,
    color: "#C9A96E",
    audience: "leadership",
  },
  {
    id: "u-6",
    date: "Mar 16",
    title: "Travel & Itinerary Personalization",
    description:
      "Chefs see a personal itinerary with flight/lodging/transport details, Las Vegas guide, key dates, and emergency contacts. Leadership/team see the full manager view with inline forms and 6 new /travel/* API routes.",
    icon: Plane,
    color: "#4A7FB5",
    audience: "all",
    navigateTo: "Travel & Lodging",
  },
  {
    id: "u-5",
    date: "Mar 15",
    title: "Deployment API Integration",
    description:
      "Pre-flight checker validates all services. Clearbit logo proxy with KV cache. Google Calendar deep links. Notion key validation. Full data export. Sonner toasts for all API operations.",
    icon: Rocket,
    color: "#4A7FB5",
    audience: "leadership",
  },
  {
    id: "u-4",
    date: "Mar 15",
    title: "Reliability & Recovery",
    description:
      "Graceful module-load error page, backend health indicator with latency monitoring, and idle-time prefetching of 6 most-visited pages for instant navigation.",
    icon: Activity,
    color: "#7E9E78",
    audience: "all",
  },
  {
    id: "u-3",
    date: "Mar 15",
    title: "Lazy-Load Resilience",
    description:
      "All 25 lazy-loaded page components now auto-retry on failed dynamic imports — no more 'Failed to fetch dynamically imported module' errors on flaky connections.",
    icon: RefreshCw,
    color: "#7E9E78",
    audience: "all",
  },
  {
    id: "u-2",
    date: "Mar 15",
    title: "Pre-Launch Readiness + Version Badge",
    description:
      "Sidebar now shows the current build version. Deployment Readiness widget flags placeholder Form URLs as a blocker. New pre-launch testing checklist helps leadership verify all 3 role views before distributing access codes.",
    icon: Rocket,
    color: "#7E9E78",
    audience: "leadership",
  },
  {
    id: "u-1",
    date: "Mar 15",
    title: "What's New Widget + FORM_URLS Config",
    description:
      "Dashboard widget now shows latest 2 updates with 'Show all' toggle. All Google Form & Doc URLs centralized in a FORM_URLS config object with production-swap TODOs.",
    icon: Zap,
    color: "#C9A96E",
    audience: "all",
    navigateTo: "Forms & Agreements",
  },
  {
    id: "u00",
    date: "Mar 11",
    title: "Data Polish & Splash Screen",
    description:
      "All dashboard widgets now loaded with rich sample data — chef submissions, budget line items, activity feed. Plus a branded Istorya splash screen and form validation with inline feedback.",
    icon: Sparkles,
    color: "#C9A96E",
    audience: "all",
  },
  {
    id: "u0",
    date: "Mar 11",
    title: "3-Tier Role-Based Dashboard",
    description:
      "New team member view with personalized My Tasks, Getting Started checklist, and streamlined navigation. Managers can preview all three role views.",
    icon: Users,
    color: "#4A7FB5",
    audience: "all",
  },
  {
    id: "u1",
    date: "Mar 11",
    title: "Chef Submission Pipeline Live",
    description:
      "Chefs can now submit dish concepts, ingredient lists, and kitchen needs directly from Menu & Courses. Leadership sees real-time updates in the Activity Feed.",
    icon: UtensilsCrossed,
    color: "#C9A96E",
    audience: "all",
    navigateTo: "Menu & Courses",
  },
  {
    id: "u2",
    date: "Mar 11",
    title: "Deployment Readiness Dashboard",
    description:
      "New system checklist showing profile registrations, Notion sync status, and share-access tools for team onboarding.",
    icon: Shield,
    color: "#7E9E78",
    audience: "leadership",
  },
  {
    id: "u3",
    date: "Mar 11",
    title: "Chef Progress Tracker Added",
    description:
      "Personal milestone tracker showing profile setup, submissions, research partner connection, and travel status — all in one widget.",
    icon: Sparkles,
    color: "#C9A96E",
    audience: "chef",
  },
  {
    id: "u4",
    date: "Mar 10",
    title: "Allure Palette Complete",
    description:
      "Full visual redesign with the Allure 2023 color system: Dark Slate Gray, Fern Green, Antique Brass, and Laurel Green across all 16+ components.",
    icon: Palette,
    color: "#7E9E78",
    audience: "all",
  },
  {
    id: "u5",
    date: "Mar 9",
    title: "Real-Time Comms Upgraded",
    description:
      "Encrypted messaging with 6 topic channels, typing indicators, read receipts, and direct-to-SMS emergency fallback.",
    icon: MessageCircle,
    color: "#1A5C38",
    audience: "all",
    navigateTo: "Comms",
  },
  {
    id: "u6",
    date: "Mar 8",
    title: "Notion Ops Center Integration",
    description:
      "Action items and milestones now sync live from the Notion Ops Center database. Critical items surface automatically.",
    icon: Globe,
    color: "#5DA06B",
    audience: "leadership",
  },
  {
    id: "u7",
    date: "Mar 7",
    title: "Profile System & Auth",
    description:
      "Persistent profiles with avatar selection, role-based access, and Remember Me for seamless returns.",
    icon: Users,
    color: "#4A7FB5",
    audience: "all",
  },
];

interface WhatsNewProps {
  role: UserRole;
  onNavigate: (page: string) => void;
}

export function WhatsNew({ role, onNavigate }: WhatsNewProps) {
  const [showAll, setShowAll] = useState(false);
  const [seenUpdates, setSeenUpdates] = useUserData<string[]>("seen-updates", []);

  const visibleUpdates = updates.filter(
    (u) => u.audience === "all" || u.audience === role
  );

  const unseenCount = visibleUpdates.filter(
    (u) => !seenUpdates.includes(u.id)
  ).length;

  const COLLAPSED_COUNT = 2;
  const displayUpdates = showAll ? visibleUpdates : visibleUpdates.slice(0, COLLAPSED_COUNT);
  const hasMore = visibleUpdates.length > COLLAPSED_COUNT;

  const markAllSeen = () => {
    setSeenUpdates(visibleUpdates.map((u) => u.id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(206,180,122,0.08)" }}
    >
      {/* Header */}
      <div
        className="w-full px-5 py-4 flex items-center gap-2"
        style={{
          background:
            "linear-gradient(135deg, rgba(206,180,122,0.03) 0%, rgba(212,184,150,0.02) 100%)",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(206,180,122,0.08)" }}
        >
          <Zap className="w-3.5 h-3.5" style={{ color: "#CEB47A" }} />
        </div>
        <h3 className="text-foreground flex-1 text-left" style={headingFont}>
          What's New
        </h3>
        {unseenCount > 0 && (
          <button
            onClick={markAllSeen}
            className="text-[0.5625rem] px-2 py-0.5 rounded-full cursor-pointer"
            style={{
              backgroundColor: "rgba(201,169,110,0.15)",
              color: "#C9A96E",
              ...bodyFont,
            }}
            aria-label="Mark all updates as seen"
          >
            {unseenCount} new
          </button>
        )}
      </div>

      {/* Always-visible entries */}
      <div className="px-3 pb-1 space-y-1">
        {displayUpdates.map((update, idx) => {
          const Icon = update.icon;
          const isSeen = seenUpdates.includes(update.id);
          const hasLink = !!update.navigateTo;

          return (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + idx * 0.03 }}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                hasLink
                  ? "hover:bg-secondary/30 cursor-pointer"
                  : ""
              }`}
              onClick={() => {
                if (hasLink) onNavigate(update.navigateTo!);
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${update.color}10` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: update.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-foreground text-[0.8125rem]"
                    style={bodyFont}
                  >
                    {update.title}
                  </span>
                  {!isSeen && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "#C9A96E" }}
                    />
                  )}
                </div>
                <p
                  className="text-muted-foreground text-[0.6875rem] leading-relaxed"
                  style={bodyFont}
                >
                  {update.description}
                </p>
                <span
                  className="text-muted-foreground/40 text-[0.5625rem] mt-0.5 block"
                  style={bodyFont}
                >
                  {update.date}
                </span>
              </div>
              {hasLink && (
                <ArrowRight className="w-3 h-3 text-muted-foreground/20 shrink-0 mt-1" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Show all / Show less toggle */}
      {hasMore && (
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={() => {
              setShowAll(!showAll);
              if (!showAll) markAllSeen();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg cursor-pointer hover:bg-secondary/20 transition-colors"
            style={bodyFont}
          >
            <span className="text-muted-foreground/60 text-[0.6875rem]">
              {showAll ? "Show less" : `Show all ${visibleUpdates.length} updates`}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground/40 transition-transform duration-200 ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </motion.div>
  );
}