// ─── Notion Sync Service ─────────────────────────────────────────
// Centralized sync manager that maintains a registry of all content types
// mapped to Notion database IDs, polls for changes, and broadcasts updates.

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "./supabase";

// ─── Types ──────────────────────────────────────────────────────

export const ALL_CONTENT_TYPES = [
  "roster", "courses", "team", "comms", "milestones",
  "budget", "sponsors", "announcements", "schedule", "decisions", "warroom",
] as const;

export type NotionContentType = typeof ALL_CONTENT_TYPES[number];

export const CONTENT_TYPE_LABELS: Record<NotionContentType, string> = {
  roster: "Chef Roster",
  courses: "Menu / Courses",
  team: "Team Members",
  comms: "Comms Tracker",
  milestones: "Milestones / Timeline",
  budget: "Budget / COGS",
  sponsors: "Sponsors",
  announcements: "Announcements",
  schedule: "Event Schedule",
  decisions: "Decisions / Risk",
  warroom: "Mission Control",
};

export const CONTENT_TYPE_DESCRIPTIONS: Record<NotionContentType, string> = {
  roster: "Chef profiles, bios, cities, signature dishes, accolades, travel status",
  courses: "Course lineup, pairings, chef assignments per course",
  team: "Team members, roles, departments, access levels",
  comms: "IK26 Comms Tracker — contacts, follow-ups, status, priorities, owners",
  milestones: "Event milestones, due dates, status, owners",
  budget: "Budget line items, actuals, projections (💰 Money workstream)",
  sponsors: "Sponsor contacts, tier, estimated value, status",
  announcements: "Team announcements, updates",
  schedule: "Day-of schedule, activations, timing (📋 Event Day & FOH)",
  decisions: "Open decisions, blockers, proposed/confirmed status (⚠️ Risk Register)",
  warroom: "Critical alerts, blockers, escalations (🔥 Mission Control)",
};

// ─── Default Configuration ──────────────────────────────────────
// Pre-populated with REAL IK26 Notion workspace page/database IDs.
// These are the actual IDs from the 'IK26 — Monica's Ops Center' page.
// Some are page IDs (subpages), some are inline database IDs on the main page.

export const DEFAULT_NOTION_CONFIG: Record<NotionContentType, { databaseId: string; label: string; isPageId?: boolean }> = {
  roster: { databaseId: "924024e2b82048ed8d6923c2199abf2d", label: "🍽️ Chefs, Menu & Beverage", isPageId: true },
  courses: { databaseId: "924024e2b82048ed8d6923c2199abf2d", label: "🍽️ Chefs, Menu & Beverage (Courses view)", isPageId: true },
  team: { databaseId: "ada2715ee86b4980a35d46450292b855", label: "👥 Team Deploy", isPageId: true },
  // Direct IK26 Comms Tracker database ID
  comms: { databaseId: "320dc6047d2d80e0a635c01824b82ab2", label: "IK26 Comms Tracker", isPageId: false },
  // IK26 Path milestones — embedded in Ops Center page, traverse to find milestones DB
  milestones: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Milestones (inline DB)", isPageId: true },
  budget: { databaseId: "964857d01c6647669a134a0375f6bcd2", label: "💰 Money", isPageId: true },
  // Filtered from comms — filter by Communication Type: Sponsorship Outreach
  sponsors: { databaseId: "320dc6047d2d80e0a635c01824b82ab2", label: "Sponsors (from Comms Tracker)", isPageId: false },
  // Uses same source page — filter by type: Announcement
  announcements: { databaseId: "320dc6047d2d80e0a635c01824b82ab2", label: "IK26 Announcements", isPageId: true },
  schedule: { databaseId: "89f4bb096f6e40229f7cd100cee489c7", label: "📋 Event Day & FOH", isPageId: true },
  decisions: { databaseId: "dd700843bbe140ebbc43acb01b081dd6", label: "⚠️ Risk Register & Decision Log", isPageId: true },
  warroom: { databaseId: "c039a9bd04984885a1b96da9af7523dc", label: "🔥 Mission Control", isPageId: true },
};

// Page IDs of workstream subpages for reference
export const IK26_WORKSTREAM_PAGES = {
  warRoom: "c039a9bd04984885a1b96da9af7523dc",
  money: "964857d01c6647669a134a0375f6bcd2",
  riskRegister: "dd700843bbe140ebbc43acb01b081dd6",
  chefsMenu: "924024e2b82048ed8d6923c2199abf2d",
  venueKMA: "47e50f8eea3544b39bbafc5ba9579dc9",
  eventDayFOH: "89f4bb096f6e40229f7cd100cee489c7",
  teamDeploy: "ada2715ee86b4980a35d46450292b855",
  marketingContent: "6f29bc201e594a6a835bc056d394b868",
  postEvent: "b6b238e2410544f78fe2018aeb26e8b8",
  referenceVault: "30c2aa00dc24489f806095583700ae5f",
  mainPage: "b60f493a780e4c5ca053f14b3ca5ad23",
} as const;

export interface ContentSourceStatus {
  configured: boolean;
  databaseId: string | null;
  label: string | null;
  configuredAt?: string;
  lastPulled: number | null;
  itemCount: number;
  isStale: boolean;
}

export interface SyncLogEntry {
  type: string;
  action: string;
  itemCount?: number;
  error?: string;
  timestamp: string;
}

export interface NotionSyncState {
  sources: Record<NotionContentType, ContentSourceStatus> | null;
  isSyncing: boolean;
  syncingTypes: Set<NotionContentType>;
  lastGlobalSync: number | null;
  syncLog: SyncLogEntry[];
  errors: Record<string, string>;
}

export interface NotionSyncActions {
  // Load all source statuses
  loadSources: () => Promise<void>;
  // Sync a single content type
  syncType: (type: NotionContentType) => Promise<any[]>;
  // Sync all configured types
  syncAll: () => Promise<void>;
  // Configure a database ID for a type
  configureType: (type: NotionContentType, databaseId: string, label?: string) => Promise<boolean>;
  // Remove a type configuration
  removeType: (type: NotionContentType) => Promise<void>;
  // Check for changes across all types
  checkForChanges: () => Promise<Record<string, { hasChanges: boolean; latestEdit: string | null }>>;
  // Load sync log
  loadSyncLog: () => Promise<void>;
  // Push an update to Notion
  pushUpdate: (type: NotionContentType, pageId: string, properties: Record<string, any>) => Promise<boolean>;
  // Get cached items for a type (from last pull)
  getCachedItems: (type: NotionContentType) => any[];
}

// ─── Content Data Cache (in-memory) ─────────────────────────────

const contentCache = new Map<NotionContentType, any[]>();
const contentListeners = new Map<NotionContentType, Set<(items: any[]) => void>>();

export function subscribeToContent(type: NotionContentType, listener: (items: any[]) => void): () => void {
  if (!contentListeners.has(type)) {
    contentListeners.set(type, new Set());
  }
  contentListeners.get(type)!.add(listener);

  // Immediately emit cached data if available
  const cached = contentCache.get(type);
  if (cached) {
    listener(cached);
  }

  return () => {
    contentListeners.get(type)?.delete(listener);
  };
}

function broadcastContent(type: NotionContentType, items: any[]) {
  contentCache.set(type, items);
  contentListeners.get(type)?.forEach((listener) => listener(items));
}

// ─── Sync Manager (singleton-like, used by the provider) ────────

export async function fetchSources(): Promise<Record<NotionContentType, ContentSourceStatus>> {
  const res = await apiFetch("/notion/content/sources");
  return res.sources;
}

export async function pullContent(type: NotionContentType, force = false): Promise<any[]> {
  const url = force ? `/notion/content/${type}/pull?force=true` : `/notion/content/${type}/pull`;
  const res = await apiFetch(url);
  const items = res.items || [];
  broadcastContent(type, items);
  return items;
}

export async function syncAllContent(): Promise<Record<string, any>> {
  const res = await apiFetch("/notion/content/sync-all", { method: "POST" });
  // After sync-all, pull fresh data for each type that succeeded
  if (res.results) {
    for (const [type, result] of Object.entries(res.results)) {
      if ((result as any).success) {
        // Pull to populate cache
        try {
          await pullContent(type as NotionContentType);
        } catch { /* ignore — sync-all already cached it server-side */ }
      }
    }
  }
  return res.results;
}

export async function configureContentType(
  type: NotionContentType,
  databaseId: string,
  label?: string
): Promise<{ configured: boolean; properties?: string[]; error?: string }> {
  const res = await apiFetch(`/notion/content/${type}/configure`, {
    method: "POST",
    body: JSON.stringify({ databaseId, label }),
  });
  return res;
}

export async function removeContentType(type: NotionContentType): Promise<void> {
  await apiFetch(`/notion/content/${type}/configure`, { method: "DELETE" });
  contentCache.delete(type);
  contentListeners.get(type)?.forEach((listener) => listener([]));
}

export async function checkChanges(): Promise<Record<string, { hasChanges: boolean; latestEdit: string | null }>> {
  const res = await apiFetch("/notion/content/check-changes");
  return res.changes;
}

export async function fetchSyncLog(): Promise<SyncLogEntry[]> {
  const res = await apiFetch("/notion/content/sync-log");
  return res.log || [];
}

export async function pushToNotion(
  type: NotionContentType,
  pageId: string,
  properties: Record<string, any>
): Promise<boolean> {
  try {
    await apiFetch(`/notion/content/${type}/push/${pageId}`, {
      method: "PUT",
      body: JSON.stringify({ properties }),
    });
    return true;
  } catch (err) {
    console.error(`Push to Notion failed (${type}/${pageId}):`, err);
    return false;
  }
}

// ─── Hooks ──────────────────────────────────────────────────────

/**
 * useNotionDatabase — subscribe to a specific content type and auto-fetch
 */
export function useNotionDatabase(type: NotionContentType, enabled = true) {
  const [items, setItems] = useState<any[]>(() => contentCache.get(type) || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPulled, setLastPulled] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to broadcasts
  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribeToContent(type, (newItems) => {
      if (mountedRef.current) {
        setItems(newItems);
      }
    });
    return () => {
      unsub();
    };
  }, [type, enabled]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;

    const fetchData = async () => {
      // If we already have cached data, don't show loading state
      if (!contentCache.has(type)) {
        setIsLoading(true);
      }
      try {
        const result = await pullContent(type);
        if (mountedRef.current) {
          setItems(result);
          setLastPulled(Date.now());
          setError(null);
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.message);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [type, enabled]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!enabled) return;

    pollingRef.current = setInterval(async () => {
      try {
        const result = await pullContent(type);
        if (mountedRef.current) {
          setItems(result);
          setLastPulled(Date.now());
          setError(null);
        }
      } catch (err: any) {
        console.error(`[notion-sync] Polling error for ${type}:`, err);
      }
    }, 60000); // 60 seconds

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [type, enabled]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await pullContent(type, true);
      setItems(result);
      setLastPulled(Date.now());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  const push = useCallback(async (pageId: string, properties: Record<string, any>) => {
    return pushToNotion(type, pageId, properties);
  }, [type]);

  return {
    items,
    isLoading,
    error,
    lastPulled,
    refresh,
    push,
    isConfigured: items.length > 0 || contentCache.has(type),
  };
}