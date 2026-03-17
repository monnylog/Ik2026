import { useState, useEffect, useCallback } from "react";
import { serverBase } from "./supabase";
import { publicAnonKey } from "/utils/supabase/info";

export type HealthStatus = "checking" | "healthy" | "degraded" | "offline";

interface HealthCheckResult {
  status: HealthStatus;
  latencyMs: number | null;
  lastChecked: Date | null;
  error: string | null;
  recheck: () => void;
}

/**
 * Pings the server health endpoint on mount and exposes status + latency.
 * Re-checks every 5 minutes while the tab is visible.
 */
export function useHealthCheck(enabled = true): HealthCheckResult {
  const [status, setStatus] = useState<HealthStatus>("checking");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!enabled) return;
    setStatus("checking");
    const start = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${serverBase}/health`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });
      clearTimeout(timeoutId);
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setLastChecked(new Date());

      if (res.ok) {
        const data = await res.json();
        if (data?.status === "ok") {
          setStatus(elapsed > 3000 ? "degraded" : "healthy");
          setError(null);
        } else {
          setStatus("degraded");
          setError("Unexpected response from server");
        }
      } else {
        setStatus("degraded");
        setError(`Server returned ${res.status}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setStatus("offline");
      setLatencyMs(null);
      setLastChecked(new Date());
      setError(err?.name === "AbortError" ? "Request timed out" : (err?.message || "Server unreachable"));
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [check, enabled]);

  return { status, latencyMs, lastChecked, error, recheck: check };
}
