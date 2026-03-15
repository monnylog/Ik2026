import type { UserRole } from "./onboarding/use-auth";

// ─── Shared event data ────────────────────────────────────────────
// Single source of truth for announcements (banner) and notifications (bell panel).
// Each entry can appear in both surfaces — `surfaces` controls where it shows.

export type EventType = "info" | "celebration" | "urgent" | "reminder" | "action" | "update";
export type Surface = "banner" | "notification" | "both";

export interface EventEntry {
  id: string;
  // Banner fields
  bannerText?: string;
  bannerActionLabel?: string;
  bannerActionUrl?: string;
  bannerActionNavigate?: string;
  bannerDismissible?: boolean;
  // Notification fields
  notifTitle?: string;
  notifBody?: string;
  notifTimestamp?: string;
  notifNavigateTo?: string;
  // Shared
  type: EventType;
  chefVisible: boolean;
  teamVisible?: boolean; // if false, hidden from team view (leadership-only)
  surfaces: Surface;
}

export const eventEntries: EventEntry[] = [
  {
    id: "comms-live",
    bannerText:
      "Team Comms are live — chat with the team right inside the hub.",
    bannerActionLabel: "Open Comms",
    bannerActionNavigate: "Comms",
    bannerDismissible: true,
    notifTitle: "Team Comms channel launched",
    notifBody: "All chat rooms are now live inside the hub.",
    notifTimestamp: "2 hours ago",
    notifNavigateTo: "Comms",
    type: "celebration",
    chefVisible: true,
    surfaces: "both",
  },
  {
    id: "survey-deadline",
    bannerText:
      "Onboarding surveys are due by Mar 20. If you haven't submitted yours, please complete it today.",
    bannerDismissible: true,
    notifTitle: "Onboarding survey reminder",
    notifBody: "Survey due by Mar 20. Complete it today.",
    notifTimestamp: "5 hours ago",
    type: "reminder",
    chefVisible: true,
    surfaces: "both",
  },
  {
    id: "fb-lead-urgent",
    bannerText:
      "F&B Lead / Events Director position still unfilled — single biggest operational gap. Candidate: Mariana. Must confirm by Mar 12.",
    bannerDismissible: false,
    notifTitle: "F&B Lead — still unfilled",
    notifBody: "Melvin held this Y1+Y2. Mariana suggested. Blocks FOH staffing and service flow.",
    notifTimestamp: "3 days ago",
    type: "urgent",
    chefVisible: false,
    teamVisible: false,
    surfaces: "both",
  },
  // ── Chef-specific notifications ──
  {
    id: "chef-submission-reminder",
    notifTitle: "Submit your menu concept",
    notifBody: "Head to Submit Menu to share your dish concept, ingredients, and plating ideas.",
    notifTimestamp: "Today",
    notifNavigateTo: "Submit Menu",
    type: "action",
    chefVisible: true,
    teamVisible: false,
    surfaces: "notification",
  },
  {
    id: "kitchen-rehearsal",
    notifTitle: "Pre-event chef dinner — May 20",
    notifBody: "Family meal vibes — alignment, energy check, final coordination. All chefs in Vegas.",
    notifTimestamp: "1 day ago",
    notifNavigateTo: "Event Timeline",
    type: "update",
    chefVisible: true,
    surfaces: "notification",
  },
  {
    id: "chef-travel-confirm",
    notifTitle: "Confirm your travel details",
    notifBody: "Check Travel & Lodging to review flights and accommodation. Mark as confirmed when ready.",
    notifTimestamp: "3 days ago",
    notifNavigateTo: "Travel & Lodging",
    type: "reminder",
    chefVisible: true,
    teamVisible: false,
    surfaces: "notification",
  },
  {
    id: "chef-engagement-prompt",
    notifTitle: "New daily prompt available",
    notifBody: "Share a food memory or kitchen story with the team. Your voice matters here.",
    notifTimestamp: "Today",
    type: "info",
    chefVisible: true,
    teamVisible: false,
    surfaces: "notification",
  },
  // ── Team-specific notifications ──
  {
    id: "team-tasks-assigned",
    notifTitle: "New tasks assigned to you",
    notifBody: "Check My Tasks on your dashboard for updated assignments and deadlines.",
    notifTimestamp: "1 hour ago",
    type: "action",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  {
    id: "team-deadline-reminder",
    notifTitle: "Vendor contracts due Mar 28",
    notifBody: "AV and rental contracts need signatures by end of month. Check Links & Resources.",
    notifTimestamp: "2 days ago",
    notifNavigateTo: "Links & Resources",
    type: "reminder",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  {
    id: "team-comms-update",
    notifTitle: "New messages in #logistics",
    notifBody: "Sarah posted venue floor plan updates. Review and confirm station assignments.",
    notifTimestamp: "4 hours ago",
    notifNavigateTo: "Comms",
    type: "info",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  // ── Shared notifications ──
  {
    id: "chef-maria-confirmed",
    notifTitle: "Chef Maria confirmed attendance",
    notifBody: "Maria Santos confirmed for Course 3. Travel details submitted and hotel block reserved.",
    notifTimestamp: "30 min ago",
    notifNavigateTo: "Chef Roster",
    type: "celebration",
    chefVisible: true,
    surfaces: "notification",
  },
  {
    id: "menu-item-updated",
    notifTitle: "Menu item updated — Course 5",
    notifBody: "Chef Dio updated his dish concept with revised plating notes and ingredient substitutions.",
    notifTimestamp: "1 hour ago",
    notifNavigateTo: "Menu & Courses",
    type: "update",
    chefVisible: true,
    surfaces: "notification",
  },
  {
    id: "new-task-assigned",
    notifTitle: "New task assigned to you",
    notifBody: "\"Coordinate AV walkthrough\" has been assigned to your queue. Due Apr 2.",
    notifTimestamp: "2 hours ago",
    notifNavigateTo: "Task Board",
    type: "action",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  {
    id: "checklist-item-completed",
    notifTitle: "Checklist item completed",
    notifBody: "Ana Cruz marked \"Source calamansi (10 lbs)\" as complete in the Pre-Event Checklist.",
    notifTimestamp: "3 hours ago",
    notifNavigateTo: "Pre-Event Checklist",
    type: "update",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  {
    id: "chef-rachel-flight",
    notifTitle: "Chef Rachel's flight confirmed",
    notifBody: "LAX → LAS on May 20, arriving 2:15 PM. Ground transport arranged.",
    notifTimestamp: "Yesterday",
    notifNavigateTo: "Travel & Lodging",
    type: "info",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  {
    id: "menu-concept",
    notifTitle: "Menu concept template shared",
    notifBody: "Submit your dish concept in Comms → #kitchen or via Menu & Courses.",
    notifTimestamp: "2 days ago",
    notifNavigateTo: "Menu & Courses",
    type: "action",
    chefVisible: true,
    surfaces: "notification",
  },
  {
    id: "chef-submissions-live",
    notifTitle: "Chef Submissions are live",
    notifBody: "Chefs can now submit dish concepts, ingredients, and kitchen needs directly in the hub. Leadership tracker updates in real time.",
    notifTimestamp: "Just now",
    notifNavigateTo: "Menu & Courses",
    type: "update",
    chefVisible: true,
    surfaces: "notification",
  },
  {
    id: "brand-guidelines",
    notifTitle: "Brand guidelines v2 published",
    notifBody: "Updated logos, color palette, and typography.",
    notifTimestamp: "4 days ago",
    notifNavigateTo: "Links & Resources",
    type: "update",
    chefVisible: true,
    surfaces: "notification",
  },
  {
    id: "team-role-live",
    notifTitle: "Team member dashboard is live",
    notifBody: "Personalized My Tasks, Getting Started checklist, and streamlined navigation for team members.",
    notifTimestamp: "Just now",
    type: "celebration",
    chefVisible: false,
    teamVisible: true,
    surfaces: "notification",
  },
  // ── Leadership-only notifications ──
  {
    id: "mgr-budget-review",
    notifTitle: "Budget review needed",
    notifBody: "March spending projections ready for review. AV costs higher than estimated.",
    notifTimestamp: "1 day ago",
    notifNavigateTo: "Budget & COGS",
    type: "action",
    chefVisible: false,
    teamVisible: false,
    surfaces: "notification",
  },
  {
    id: "mgr-engagement-summary",
    notifTitle: "Weekly engagement summary",
    notifBody: "12 daily prompt responses, 47 chat messages, 6 Memory Wall entries this week.",
    notifTimestamp: "Today",
    type: "info",
    chefVisible: false,
    teamVisible: false,
    surfaces: "notification",
  },
];

// ─── Derived helpers ──────────────────────────────────────────────

export function getBannerEntries(role: UserRole) {
  return eventEntries.filter((e) => {
    if (role === "chef" && !e.chefVisible) return false;
    if (role === "team" && !e.chefVisible && e.teamVisible === false) return false;
    if (e.surfaces !== "banner" && e.surfaces !== "both") return false;
    if (!e.bannerText) return false;
    return true;
  });
}

export function getNotificationEntries(role: UserRole) {
  return eventEntries.filter((e) => {
    if (e.surfaces !== "notification" && e.surfaces !== "both") return false;
    if (!e.notifTitle) return false;
    // Chef: only sees chefVisible entries
    if (role === "chef" && !e.chefVisible) return false;
    // Team: sees chefVisible entries AND teamVisible entries, but NOT leadership-only (teamVisible === false && !chefVisible)
    if (role === "team") {
      if (!e.chefVisible && e.teamVisible === false) return false;
      // Team should not see chef-only entries (chefVisible=true, teamVisible=false)
      if (e.chefVisible && e.teamVisible === false) return false;
    }
    // Leadership: sees everything
    return true;
  });
}

// ─── Read-state persistence (dual: localStorage + KV sync) ───────
// These functions still work for initial hydration before the hook
// kicks in. The NotificationPanel now uses useUserData for the
// authoritative synced version.

const READ_KEY = "ik26-user-read-notifs";

export function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

export function getUnreadCount(role: UserRole): number {
  const entries = getNotificationEntries(role);
  const readIds = getReadIds();
  return entries.filter((e) => !readIds.has(e.id)).length;
}