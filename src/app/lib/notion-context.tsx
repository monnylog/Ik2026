import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { apiFetch } from "./supabase";
import { checkChanges } from "./notion-sync";

// ─── Types ──────────────────────────────────────────────────────────

export interface NotionMilestone {
  id: string;
  url: string;
  milestone: string;
  number: number | null;
  division: string | null;
  status: string | null;
  week: string | null;
  owner: string | null;
  blocksAndDeps: string | null;
  dueDate: string | null;
  dueDateEnd: string | null;
  rellaLink: string | null;
}

export interface NotionStats {
  total: number;
  done: number;
  inProgress: number;
  critical: number;
  overdue: number;
  future: number;
  completionPct: number;
}

interface NotionContextValue {
  milestones: NotionMilestone[];
  stats: NotionStats;
  isLive: boolean;
  isLoading: boolean;
  isCached: boolean;
  isStale: boolean;
  cachedAt: number | null;
  lastSyncAt: number | null;
  lastError: string | null;
  isSyncing: boolean;
  refresh: () => Promise<boolean>; // returns true on success
  hasNewData: boolean;
  changedTypes: string[];
  dismissNewData: () => void;
}

const EMPTY_STATS: NotionStats = {
  total: 0,
  done: 0,
  inProgress: 0,
  critical: 0,
  overdue: 0,
  future: 0,
  completionPct: 0,
};

const NotionContext = createContext<NotionContextValue>({
  milestones: [],
  stats: EMPTY_STATS,
  isLive: false,
  isLoading: true,
  isCached: false,
  isStale: false,
  cachedAt: null,
  lastSyncAt: null,
  lastError: null,
  isSyncing: false,
  refresh: async () => { return false; },
  hasNewData: false,
  changedTypes: [],
  dismissNewData: () => {},
});

// ─── Stats calculator ───────────────────────────────────────────────

function computeStats(milestones: NotionMilestone[]): NotionStats {
  const real = milestones.filter((m) => m.milestone && m.milestone.trim() !== "");
  const done = real.filter((m) => m.status?.includes("Done")).length;
  const inProgress = real.filter((m) => m.status?.includes("In Progress")).length;
  const critical = real.filter((m) => m.status?.includes("CRITICAL")).length;
  const overdue = real.filter((m) => m.status?.includes("Overdue")).length;
  const future = real.filter((m) => m.status?.includes("Future")).length;
  const total = real.length;
  return {
    total,
    done,
    inProgress,
    critical,
    overdue,
    future,
    completionPct: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

// ─── Provider ───────────────────────────────────────────────────────

interface NotionProviderProps {
  children: ReactNode;
  enabled: boolean; // only fetch when authenticated (any role)
}

export function NotionProvider({ children, enabled }: NotionProviderProps) {
  const [milestones, setMilestones] = useState<NotionMilestone[]>([]);
  const [stats, setStats] = useState<NotionStats>(EMPTY_STATS);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isCached, setIsCached] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [changedTypes, setChangedTypes] = useState<string[]>([]);
  const changeCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failCountRef = useRef(0);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;
    setIsLoading(true);
    setIsSyncing(true);
    setLastError(null);
    try {
      const endpoint = forceRefresh ? "/notion/ik26-path/refresh" : "/notion/ik26-path";
      const method = forceRefresh ? "POST" : "GET";
      const res = await apiFetch(endpoint, { method });

      if (res.milestones && Array.isArray(res.milestones)) {
        const ms = res.milestones as NotionMilestone[];
        setMilestones(ms);
        setStats(computeStats(ms));
        setIsLive(true);
        setIsCached(!!res.cached);
        setIsStale(!!res.stale);
        setCachedAt(res.cachedAt || null);
        setLastSyncAt(Date.now());
        failCountRef.current = 0;
        return true;
      }
    } catch (err: any) {
      console.error("NotionProvider fetch error:", err);
      setLastError(err?.message || String(err));
      failCountRef.current += 1;
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
    return false;
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 5 minutes with exponential backoff on failure
  useEffect(() => {
    if (!enabled) return;
    const getInterval = () => {
      const fails = failCountRef.current;
      if (fails === 0) return 5 * 60 * 1000; // 5 min
      if (fails === 1) return 10 * 1000;
      if (fails === 2) return 30 * 1000;
      if (fails === 3) return 60 * 1000;
      return 5 * 60 * 1000;
    };
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(async () => {
        await fetchData(false);
        schedule();
      }, getInterval());
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [enabled, fetchData]);

  // On visibility change, trigger sync if last sync > 2 min ago
  useEffect(() => {
    if (!enabled) return;
    const handler = () => {
      if (document.visibilityState === "visible") {
        const lastSync = lastSyncAt || 0;
        if (Date.now() - lastSync > 2 * 60 * 1000) {
          fetchData(false);
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [enabled, fetchData, lastSyncAt]);

  // Periodic change detection — every 2 minutes, check if Notion data has been updated
  useEffect(() => {
    if (!enabled || !isLive) return;
    const pollInterval = 2 * 60 * 1000; // 2 minutes
    const checkForUpdates = async () => {
      try {
        const changes = await checkChanges();
        const changed: string[] = [];
        for (const [type, info] of Object.entries(changes)) {
          if (info.hasChanges) changed.push(type);
        }
        if (changed.length > 0) {
          setHasNewData(true);
          setChangedTypes(changed);
        }
      } catch {
        // Silently fail — this is a background check
      }
    };
    changeCheckRef.current = setInterval(checkForUpdates, pollInterval);
    return () => {
      if (changeCheckRef.current) clearInterval(changeCheckRef.current);
    };
  }, [enabled, isLive]);

  const dismissNewData = useCallback(() => {
    setHasNewData(false);
    setChangedTypes([]);
  }, []);

  const refresh = useCallback(async () => {
    const result = await fetchData(true);
    // After a manual refresh, dismiss the new-data indicator
    setHasNewData(false);
    setChangedTypes([]);
    return !!result;
  }, [fetchData]);

  return (
    <NotionContext.Provider
      value={{
        milestones,
        stats,
        isLive,
        isLoading,
        isCached,
        isStale,
        cachedAt,
        lastSyncAt,
        lastError,
        isSyncing,
        refresh,
        hasNewData,
        changedTypes,
        dismissNewData,
      }}
    >
      {children}
    </NotionContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useNotion() {
  return useContext(NotionContext);
}

// ─── Derived selectors (for convenience) ────────────────────────────

export function getCriticalMilestones(milestones: NotionMilestone[]) {
  return milestones.filter(
    (m) =>
      m.milestone?.trim() &&
      (m.status?.includes("CRITICAL") || m.status?.includes("Overdue"))
  );
}

export function getInProgressMilestones(milestones: NotionMilestone[]) {
  return milestones.filter(
    (m) => m.milestone?.trim() && m.status?.includes("In Progress")
  );
}

export function getRecentlyCompleted(milestones: NotionMilestone[]) {
  return milestones.filter(
    (m) => m.milestone?.trim() && m.status?.includes("Done")
  );
}

export function getUpcomingThisWeek(milestones: NotionMilestone[], todayStr = new Date().toISOString().split("T")[0]) {
  const weekAhead = new Date(todayStr + "T00:00:00");
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekStr = weekAhead.toISOString().split("T")[0];
  return milestones.filter(
    (m) =>
      m.milestone?.trim() &&
      m.status?.includes("Future") &&
      m.dueDate &&
      m.dueDate >= todayStr &&
      m.dueDate <= weekStr
  );
}