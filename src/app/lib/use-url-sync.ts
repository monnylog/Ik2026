import { useEffect, useRef } from "react";

// ── URL ↔ activePage Synchronization ─────────────────────────────
// Syncs the string-based `activePage` state with the browser URL bar.
// Gives us deep linking, shareable URLs, and browser back/forward
// without a full React Router migration.

// Clean URL slugs for each page name
const PAGE_TO_SLUG: Record<string, string> = {
  Dashboard: "/",
  Settings: "/settings",
  Members: "/members",
  Community: "/community",
  Comms: "/comms",
  "Our Istoryas": "/istoryas",
  "Chef Roster": "/chef-roster",
  "Chef Journey": "/chef-journey",
  "Event Timeline": "/timeline",
  "Travel & Lodging": "/travel",
  "Menu & Courses": "/menu",
  "Team Deploy": "/team-deploy",
  "Research & Story": "/research",
  "Budget & COGS": "/budget",
  "Links & Resources": "/links",
  "Submit Menu": "/submit-menu",
  "Pre-Event Checklist": "/checklist",
  "Task Board": "/tasks",
  "Event Schedule": "/schedule",
  "Activity Log": "/activity",
  Portal: "/portal",
  "Share Invite": "/share",
  Inquiries: "/inquiries",
  "Notion Admin": "/notion-admin",
  Expenses: "/expenses",
  Finance: "/finance",
  "Forms & Agreements": "/forms",
  "Sponsors & Partners": "/sponsors",
  Reimbursements: "/reimbursements",
  "Mission Control": "/mission-control",
  "System Audit": "/system-audit",
  "Content Studio": "/content-studio",
};

// Reverse map: slug → page name
const SLUG_TO_PAGE: Record<string, string> = {};
for (const [page, slug] of Object.entries(PAGE_TO_SLUG)) {
  SLUG_TO_PAGE[slug] = page;
}

/** Given a URL pathname, return the matching activePage name (or "Dashboard") */
export function resolvePageFromPath(pathname: string): string {
  // Exact match
  if (SLUG_TO_PAGE[pathname]) return SLUG_TO_PAGE[pathname];

  // Trim trailing slash
  const trimmed = pathname.replace(/\/$/, "") || "/";
  if (SLUG_TO_PAGE[trimmed]) return SLUG_TO_PAGE[trimmed];

  // Special routes handled outside the dashboard
  if (["/welcome", "/privacy", "/terms", "/screenshots"].includes(trimmed)) {
    return "__external__";
  }

  return "Dashboard";
}

/** Get the URL slug for a page name */
export function getSlugForPage(page: string): string {
  return PAGE_TO_SLUG[page] || "/";
}

/**
 * Hook that synchronizes `activePage` state with the browser URL.
 *
 * - On mount: reads the URL and calls `onNavigate` if it maps to a page
 * - On `activePage` change: pushes the new URL to history
 * - On browser back/forward: updates activePage via `onNavigate`
 */
export function useUrlSync(
  activePage: string,
  onNavigate: (page: string) => void,
  ready: boolean
) {
  const isPopState = useRef(false);
  const lastPushedSlug = useRef<string | null>(null);

  // On mount: resolve initial page from URL
  useEffect(() => {
    if (!ready) return;
    const page = resolvePageFromPath(window.location.pathname);
    if (page !== "__external__" && page !== activePage) {
      onNavigate(page);
    }
    // Only run on mount when ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Push URL when activePage changes (unless caused by popstate)
  useEffect(() => {
    if (!ready) return;
    if (isPopState.current) {
      isPopState.current = false;
      return;
    }

    const slug = getSlugForPage(activePage);
    if (slug !== window.location.pathname && slug !== lastPushedSlug.current) {
      lastPushedSlug.current = slug;
      window.history.pushState({ page: activePage }, "", slug);

      // Update document title
      document.title =
        activePage === "Dashboard"
          ? "Isang Kusina 2026"
          : `${activePage} — IK26`;
    }
  }, [activePage, ready]);

  // Listen for browser back/forward
  useEffect(() => {
    if (!ready) return;

    const handlePopState = (e: PopStateEvent) => {
      isPopState.current = true;
      const page = e.state?.page || resolvePageFromPath(window.location.pathname);
      if (page !== "__external__") {
        onNavigate(page);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onNavigate, ready]);
}