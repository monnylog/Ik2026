import { useState } from "react";
import { RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

interface NotionSyncBadgeProps {
  /** Whether data is currently sourced from Notion */
  isLive: boolean;
  /** Timestamp of last successful sync (ms) */
  lastSyncAt?: number | null;
  /** Optional: number of items synced */
  itemCount?: number;
  /** Optional: label override */
  label?: string;
  /** Optional: show refresh button */
  onRefresh?: () => void;
  /** Optional: is currently refreshing */
  isRefreshing?: boolean;
  /** Whether there was a sync error */
  hasError?: boolean;
  /** Compact mode — just the dot and text */
  compact?: boolean;
}

type SyncTier = "live" | "recent" | "stale" | "error";

function getSyncTier(lastSyncAt: number | null | undefined, hasError?: boolean): SyncTier {
  if (hasError) return "error";
  if (!lastSyncAt) return "stale";
  const ageMs = Date.now() - lastSyncAt;
  const ageMin = ageMs / 60_000;
  if (ageMin < 5) return "live";
  if (ageMin <= 30) return "recent";
  return "stale";
}

function getSyncLabel(tier: SyncTier, lastSyncAt: number | null | undefined): string {
  if (tier === "error") return "Notion Error";
  if (tier === "stale" || !lastSyncAt) return "Notion Stale";
  if (tier === "live") return "Notion Live";
  // recent — show minutes ago
  const mins = Math.round((Date.now() - lastSyncAt) / 60_000);
  return `Notion (${mins}m ago)`;
}

const tierStyles: Record<SyncTier, { color: string; bg: string; border: string; dot: string }> = {
  live: {
    color: "rgba(93,160,107,0.85)",
    bg: "rgba(93,160,107,0.06)",
    border: "rgba(93,160,107,0.15)",
    dot: "#5DA06B",
  },
  recent: {
    color: "rgba(201,169,110,0.9)",
    bg: "rgba(201,169,110,0.06)",
    border: "rgba(201,169,110,0.2)",
    dot: "#C9A96E",
  },
  stale: {
    color: "rgba(200,80,80,0.85)",
    bg: "rgba(200,80,80,0.06)",
    border: "rgba(200,80,80,0.18)",
    dot: "#C85050",
  },
  error: {
    color: "rgba(200,80,80,0.85)",
    bg: "rgba(200,80,80,0.06)",
    border: "rgba(200,80,80,0.18)",
    dot: "#C85050",
  },
};

export function NotionSyncBadge({
  isLive,
  lastSyncAt,
  itemCount,
  label,
  onRefresh,
  isRefreshing = false,
  hasError = false,
  compact = false,
}: NotionSyncBadgeProps) {
  if (!isLive && !hasError) return null;

  const tier = getSyncTier(lastSyncAt, hasError);
  const style = tierStyles[tier];
  const displayLabel = label || getSyncLabel(tier, lastSyncAt);

  if (compact) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRefresh?.();
        }}
        className="inline-flex items-center gap-1.5 text-[0.625rem] tracking-wide uppercase cursor-pointer hover:opacity-80 transition-opacity"
        style={{ color: style.color, ...bodyFont, letterSpacing: "0.06em", background: "none", border: "none", padding: 0 }}
        title={`${displayLabel}${onRefresh ? " — click to sync now" : ""}`}
      >
        {isRefreshing ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
        ) : (
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: style.dot,
              boxShadow: tier === "live" ? `0 0 4px ${style.dot}50` : undefined,
              animation: tier === "live" ? "pulse 2s ease-in-out infinite" : undefined,
            }}
          />
        )}
        {displayLabel.replace("Notion ", "")}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRefresh?.();
      }}
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
      }}
      title={`${displayLabel}${onRefresh ? " — click to sync now" : ""}`}
    >
      <span className="flex items-center gap-1.5">
        {isRefreshing ? (
          <Loader2 className="w-3 h-3 animate-spin shrink-0" style={{ color: style.color }} />
        ) : tier === "stale" || tier === "error" ? (
          <WifiOff className="w-3 h-3 shrink-0" style={{ color: style.color }} />
        ) : (
          <Wifi className="w-3 h-3 shrink-0" style={{ color: style.color }} />
        )}
        <span
          className="text-[0.6875rem]"
          style={{ color: style.color, ...bodyFont }}
        >
          {displayLabel}
          {itemCount !== undefined && (
            <span style={{ opacity: 0.7 }}> · {itemCount}</span>
          )}
        </span>
      </span>

      {onRefresh && !isRefreshing && (
        <RefreshCw
          className="w-3 h-3 ml-0.5"
          style={{ color: style.color, opacity: 0.6 }}
        />
      )}
    </button>
  );
}

/**
 * Fallback data indicator — shows when using hardcoded/fallback data instead of Notion
 */
export function FallbackDataBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[0.625rem] tracking-wide uppercase"
        style={{ color: "rgba(140,130,120,0.6)", ...bodyFont, letterSpacing: "0.06em" }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(140,130,120,0.4)" }} />
        Sample data
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
      style={{
        backgroundColor: "rgba(140,130,120,0.04)",
        border: "1px solid rgba(140,130,120,0.12)",
      }}
    >
      <span
        className="text-[0.6875rem]"
        style={{ color: "rgba(140,130,120,0.6)", ...bodyFont }}
      >
        Using sample data
      </span>
    </div>
  );
}
