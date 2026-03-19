// ─── IK2026 Domain-Typed Notion Hooks ────────────────────────────
// Typed React hooks for chef profiles, course lineup, journey progress,
// and event schedule. All data flows through the Supabase Edge Function.
//
// Usage:
//   const { chefs, isLoading } = useChefProfiles();
//   const { courses } = useCourseLineup();
//   const { journey, summary } = useJourneyProgress();
//   const { schedule } = useEventSchedule();
//   const { syncAll } = useDomainSync();

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "./supabase";

// ─── Types (mirror of server-side domain types in notion-domain-sync.tsx) ──

export interface ChefSyncRecord {
  chefId: string;
  notionPageId: string;
  fullName: string;
  courseNumber: number | null;
  isIstoryaRoots: boolean;
  city: string;
  restaurant: string;
  bio: string;
  instagram: string;
  headshotUrl: string;
  status: "Invited" | "Confirmed" | "In R&D" | "Dish Finalized" | "Event Ready" | string;
  dishConcept: string;
  historicalAnchor: string;
  dietaryFlags: string[];
  travelNotes: string;
  milestone1: "Not started" | "In progress" | "Complete" | string;
  milestone2: "Not started" | "In progress" | "Complete" | string;
  milestone3: "Not started" | "In progress" | "Complete" | string;
  milestone4: "Not started" | "In progress" | "Complete" | string;
  lastSyncedAt: string;
  _notionLastEdited: string | null;
}

export interface CourseItem {
  courseNumber: number | null;
  chefId: string;
  chefName: string;
  dishConcept: string;
  historicalAnchor: string;
  dietaryFlags: string[];
  pairing: string;
  status: string;
  notionPageId: string;
}

export interface ScheduleEntry {
  id: string;
  time: string;
  endTime: string | null;
  activity: string;
  location: string;
  owner: string;
  category: string;
  notes: string;
  status: string;
  isKeyMoment: boolean;
}

export interface JourneyProgress {
  chefId: string;
  chefName: string;
  courseNumber: number | null;
  isIstoryaRoots: boolean;
  status: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
  milestone4: string;
  completedCount: number;
  inProgressCount: number;
  overallProgress: number;
  lastUpdated: string;
}

export interface JourneySummary {
  totalChefs: number;
  completedMilestones: number;
  totalMilestones: number;
  overallProgress: number;
  chefsEventReady: number;
  chefsDishFinalized: number;
}

export type MilestoneStatus = "Not started" | "In progress" | "Complete";
export type ChefStatus = "Invited" | "Confirmed" | "In R&D" | "Dish Finalized" | "Event Ready";

// ─── useChefProfiles ─────────────────────────────────────────────
// Fetches all 7 chef profiles from the typed sync endpoint.
// Provides pushMilestone/pushStatus for 2-way sync back to Notion.

export function useChefProfiles(opts: { enabled?: boolean } = {}) {
  const { enabled = true } = opts;
  const [chefs, setChefs] = useState<ChefSyncRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(force ? "/notion/sync/chefs?force=true" : "/notion/sync/chefs");
      if (mountedRef.current) {
        setChefs(res.chefs || []);
        setCached(!!res.cached);
        setSyncedAt(res.syncedAt || null);
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) load();
    return () => { mountedRef.current = false; };
  }, [enabled, load]);

  // Push milestone update to Notion (2-way sync)
  const pushMilestone = useCallback(async (
    chefId: string,
    milestone: 1 | 2 | 3 | 4,
    status: MilestoneStatus,
  ): Promise<boolean> => {
    try {
      await apiFetch(`/notion/sync/chef/${chefId}/milestone`, {
        method: "PUT",
        body: JSON.stringify({ milestone, status }),
      });
      await load(true); // Reload to reflect updated data
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [load]);

  // Push status update to Notion (2-way sync)
  const pushStatus = useCallback(async (
    chefId: string,
    status: ChefStatus,
  ): Promise<boolean> => {
    try {
      await apiFetch(`/notion/sync/chef/${chefId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      await load(true);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  // Convenience: get a single chef by ID
  const getChef = useCallback((chefId: string) =>
    chefs.find((c) => c.chefId === chefId) ?? null, [chefs]);

  return { chefs, isLoading, error, cached, syncedAt, refresh, pushMilestone, pushStatus, getChef };
}

// ─── useCourseLineup ─────────────────────────────────────────────
// Returns the 5 guest chef courses sorted by course number.
// Derived from chef profiles — no extra Notion calls if chefs are cached.

export function useCourseLineup(opts: { enabled?: boolean } = {}) {
  const { enabled = true } = opts;
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(force ? "/notion/sync/courses?force=true" : "/notion/sync/courses");
      if (mountedRef.current) {
        setCourses(res.courses || []);
        setCached(!!res.cached);
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) load();
    return () => { mountedRef.current = false; };
  }, [enabled, load]);

  return { courses, isLoading, error, cached, refresh: useCallback(() => load(true), [load]) };
}

// ─── useJourneyProgress ──────────────────────────────────────────
// Returns milestone progress for all chefs (or a single chef if chefId provided).
// overallProgress is 0–100 based on completed milestones.

export function useJourneyProgress(chefId?: string, opts: { enabled?: boolean } = {}) {
  const { enabled = true } = opts;
  const [journey, setJourney] = useState<JourneyProgress[]>([]);
  const [summary, setSummary] = useState<JourneySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      if (chefId) {
        const res = await apiFetch(`/notion/sync/journey/${chefId}`);
        if (mountedRef.current) {
          setJourney(res.journey ? [res.journey] : []);
          setSummary(null);
        }
      } else {
        const res = await apiFetch("/notion/sync/journey");
        if (mountedRef.current) {
          setJourney(res.journey || []);
          setSummary(res.summary || null);
        }
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [enabled, chefId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) load();
    return () => { mountedRef.current = false; };
  }, [enabled, load]);

  // Convenience: single chef record when chefId is provided
  const single = chefId ? (journey[0] ?? null) : null;

  return { journey, single, summary, isLoading, error, refresh: load };
}

// ─── useEventSchedule ────────────────────────────────────────────
// Returns typed event day schedule entries.
// Requires /notion/content/schedule/pull to have been run first.

export function useEventSchedule(opts: { enabled?: boolean } = {}) {
  const { enabled = true } = opts;
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(force ? "/notion/sync/schedule?force=true" : "/notion/sync/schedule");
      if (mountedRef.current) {
        setSchedule(res.schedule || []);
        setCached(!!res.cached);
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) load();
    return () => { mountedRef.current = false; };
  }, [enabled, load]);

  const keyMoments = schedule.filter((s) => s.isKeyMoment);

  return { schedule, keyMoments, isLoading, error, cached, refresh: useCallback(() => load(true), [load]) };
}

// ─── useDomainSync ───────────────────────────────────────────────
// Triggers a full sync of all 4 domain entity types at once.
// Call syncAll() to kick off from a sync button or admin panel.

export function useDomainSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncAll = useCallback(async (): Promise<Record<string, any> | null> => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await apiFetch("/notion/sync/domain-all", { method: "POST" });
      setLastResult(res);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { syncAll, isSyncing, lastResult, error };
}
