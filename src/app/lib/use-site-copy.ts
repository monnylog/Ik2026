// ─── IK26 Website Copy Hook ──────────────────────────────────────
// Fetches all Live copy from the Notion CMS via the Supabase Edge Function.
// Returns a typed `copy` object and a `t()` helper for safe key access.
//
// Usage:
//   const { t, isLoading } = useSiteCopy();
//   <h1>{t("hero.headline")}</h1>
//
// To update website copy: edit the "Website Copy (CMS)" database in Notion.
// Changes appear on the site within 5 minutes (cache TTL).
// To force an immediate update: call refreshCopy().

import { useState, useEffect, useCallback } from "react";
import { serverBase } from "./supabase";

export type SiteCopyMap = Record<string, string>;

// Fallback copy — shown if Notion is unreachable. Keep in sync with Notion DB.
const FALLBACK_COPY: SiteCopyMap = {
  "hero.headline": "Isang Kusina 2026",
  "hero.subheadline": "Filipino American: Exploring Identity and Migration Through the Modern Table",
  "hero.date": "May 22, 2026",
  "hero.venue": "Keep Memory Alive Event Center, Las Vegas",
  "hero.cta": "Get Your Tickets",
  "about.headline": "One Night. Seven Chefs. One Table.",
  "about.body": "Isang Kusina is a one-night culinary event that brings together Filipino American chefs from across the United States. Each chef represents a city with deep Filipino roots. Their food carries the memory of migration, adaptation, and belonging. This is not a showcase. It is a homecoming.",
  "nav.event_name": "Isang Kusina",
  "nav.tagline": "May 22, 2026 · Las Vegas",
  "chefs.headline": "The Table",
  "chefs.subheadline": "Seven chefs. Seven cities. One inheritance.",
  "tickets.headline": "Join the Table",
  "tickets.body": "Tickets include a seven-course dinner, beverage pairings, and access to the full evening program. Seating is limited.",
  "footer.tagline": "Istorya. Food as love language.",
  "footer.copyright": "2026 Istorya. All rights reserved.",
  "sponsors.headline": "Partners and Supporters",
  "meta.title": "Isang Kusina 2026 | Filipino American Culinary Event | Las Vegas",
  "meta.description": "A one-night culinary event celebrating Filipino American identity through food. Seven chefs, seven cities, one table. May 22, 2026 at Keep Memory Alive Event Center, Las Vegas.",
};

interface UseSiteCopyResult {
  copy: SiteCopyMap;
  isLoading: boolean;
  error: string | null;
  /** Safe accessor — returns fallback if key is missing */
  t: (key: string, fallback?: string) => string;
  /** Force-refresh the cache from Notion */
  refreshCopy: () => Promise<void>;
}

// In-memory cache so multiple components don't re-fetch on the same page load
let _memCache: SiteCopyMap | null = null;
let _memCacheTs = 0;
const MEM_TTL_MS = 5 * 60 * 1000; // 5 minutes — matches server cache TTL

export function useSiteCopy(): UseSiteCopyResult {
  const [copy, setCopy] = useState<SiteCopyMap>(_memCache ?? FALLBACK_COPY);
  const [isLoading, setIsLoading] = useState(!_memCache);
  const [error, setError] = useState<string | null>(null);

  const fetchCopy = useCallback(async (forceRefresh = false) => {
    // Use in-memory cache if fresh
    if (!forceRefresh && _memCache && Date.now() - _memCacheTs < MEM_TTL_MS) {
      setCopy(_memCache);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = forceRefresh
        ? `${serverBase}/ik26/copy/refresh`
        : `${serverBase}/ik26/copy`;

      const resp = await fetch(endpoint, {
        method: forceRefresh ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const json = await resp.json();
      if (!json.ok) throw new Error(json.error ?? "Unknown error");

      const merged = { ...FALLBACK_COPY, ...json.copy };
      _memCache = merged;
      _memCacheTs = Date.now();
      setCopy(merged);
    } catch (err: any) {
      console.warn("[useSiteCopy] Falling back to static copy:", err.message);
      setError(err.message);
      // Graceful degradation: use fallback copy so the site never breaks
      setCopy(FALLBACK_COPY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCopy();
  }, [fetchCopy]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return copy[key] ?? fallback ?? FALLBACK_COPY[key] ?? key;
    },
    [copy]
  );

  const refreshCopy = useCallback(async () => {
    _memCache = null;
    await fetchCopy(true);
  }, [fetchCopy]);

  return { copy, isLoading, error, t, refreshCopy };
}
