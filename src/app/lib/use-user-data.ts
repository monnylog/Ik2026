/**
 * Per-user data sync hook.
 *
 * Reads from localStorage immediately for snappy UX, then
 * reconciles with the KV store on mount and writes to both
 * on every change.  Falls back gracefully to localStorage-only
 * if the server is unreachable.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "./supabase";

const PROFILE_CACHE_KEY = "ik26-profile-cache";

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Syncs a piece of per-user data between localStorage and the KV store.
 *
 * @param dataType  — unique key for this data slice, e.g. "read-notifs"
 * @param fallback  — default value when nothing is stored
 */
export function useUserData<T>(dataType: string, fallback: T) {
  const localKey = `ik26-user-${dataType}`;
  const userId = getUserId();

  // ─ Initial value: try localStorage first ─────────────────────
  const readLocal = useCallback((): T => {
    try {
      const raw = localStorage.getItem(localKey);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }, [localKey, fallback]);

  const [value, setValue] = useState<T>(readLocal);
  const [synced, setSynced] = useState(false);
  const latestValue = useRef(value);
  latestValue.current = value;

  // ─ On mount: fetch authoritative value from KV ───────────────
  useEffect(() => {
    if (!userId) {
      setSynced(true);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch(`/user-data/${userId}/${dataType}`);
        if (!cancelled && res.data !== null && res.data !== undefined) {
          setValue(res.data as T);
          localStorage.setItem(localKey, JSON.stringify(res.data));
        }
      } catch {
        // Server unavailable — keep local value
      } finally {
        if (!cancelled) setSynced(true);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, dataType, localKey]);

  // ─ Setter: writes to both localStorage and KV ────────────────
  const setAndSync = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;

        // Write to localStorage immediately
        try {
          localStorage.setItem(localKey, JSON.stringify(resolved));
        } catch { /* ignore */ }

        // Async write to KV (fire-and-forget)
        if (userId) {
          apiFetch(`/user-data/${userId}/${dataType}`, {
            method: "PUT",
            body: JSON.stringify({ dataType, data: resolved }),
          }).catch((err) => {
            console.error(`Failed to sync user-data/${dataType}:`, err);
          });
        }

        return resolved;
      });
    },
    [localKey, userId, dataType]
  );

  return [value, setAndSync, synced] as const;
}
