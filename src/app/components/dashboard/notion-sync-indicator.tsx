import { useState, useEffect, useCallback } from "react";
import { Wifi, WifiOff, RefreshCw, Clock, ArrowDownCircle, Database, ChevronDown } from "lucide-react";
import { useNotion } from "../../lib/notion-context";
import {
  CONTENT_TYPE_LABELS,
  type NotionContentType,
  ALL_CONTENT_TYPES,
  fetchSources,
  syncAllContent,
  type ContentSourceStatus,
} from "../../lib/notion-sync";
import { toast } from "sonner";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

function timeAgo(cachedAt: number): string {
  const diffMs = Date.now() - cachedAt;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

interface NotionSyncIndicatorProps {
  showRefresh?: boolean;
}

export function NotionSyncIndicator({ showRefresh = true }: NotionSyncIndicatorProps) {
  const { isLive, isLoading: ctxLoading, isCached, isStale, cachedAt, stats, lastError, refresh, hasNewData, changedTypes, dismissNewData } = useNotion();
  const [refreshing, setRefreshing] = useState(false);
  const [agoText, setAgoText] = useState("");
  const [expanded, setExpanded] = useState(false);

  // Content hub stats
  const [sources, setSources] = useState<Record<NotionContentType, ContentSourceStatus> | null>(null);
  const [sourcesLoading, setSourcesLoading] = useState(true);

  // Fetch content hub sources
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const s = await fetchSources();
        if (mounted) setSources(s);
      } catch {
        // Silently fail
      } finally {
        if (mounted) setSourcesLoading(false);
      }
    };
    load();
    // Refresh every 2 minutes
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Update "ago" text every 30s
  useEffect(() => {
    if (!cachedAt) return;
    setAgoText(timeAgo(cachedAt));
    const interval = setInterval(() => setAgoText(timeAgo(cachedAt)), 30_000);
    return () => clearInterval(interval);
  }, [cachedAt]);

  // Compute aggregate stats from content hub
  const hubStats = (() => {
    if (!sources) return { totalItems: 0, configuredCount: 0, staleCount: 0, latestSync: null as number | null };
    let totalItems = 0;
    let configuredCount = 0;
    let staleCount = 0;
    let latestSync: number | null = null;
    for (const type of ALL_CONTENT_TYPES) {
      const src = sources[type];
      if (!src) continue;
      if (src.configured) {
        configuredCount++;
        totalItems += src.itemCount || 0;
        if (src.isStale) staleCount++;
        if (src.lastPulled && (!latestSync || src.lastPulled > latestSync)) {
          latestSync = src.lastPulled;
        }
      }
    }
    return { totalItems, configuredCount, staleCount, latestSync };
  })();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh both the old milestones context and the content hub
      const [ctxResult] = await Promise.all([
        refresh(),
        syncAllContent().catch(() => null),
      ]);
      // Reload sources after sync
      try {
        const s = await fetchSources();
        setSources(s);
      } catch {}

      const totalItems = hubStats.totalItems;
      toast.success("Notion synced", {
        description: `${totalItems} total items across ${hubStats.configuredCount} sources`,
      });
    } catch {
      toast.error("Sync failed", {
        description: lastError || "Could not reach Notion",
      });
    } finally {
      setRefreshing(false);
    }
  }, [refresh, lastError, hubStats]);

  const isLoading = ctxLoading || sourcesLoading;
  const hasHub = hubStats.configuredCount > 0;
  const allFresh = hubStats.staleCount === 0;
  const anyStale = hubStats.staleCount > 0;

  // Determine effective live status (either old context is live, or hub has data)
  const effectiveLive = isLive || hasHub;
  const effectiveStale = isStale || anyStale;

  if (!effectiveLive && !isLoading) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* New data available banner */}
      {hasNewData && (
        <button
          onClick={async () => {
            dismissNewData();
            setRefreshing(true);
            await refresh();
            try { const s = await fetchSources(); setSources(s); } catch {}
            setRefreshing(false);
            toast.success("Data refreshed", {
              description: `Updated: ${changedTypes.map(t => CONTENT_TYPE_LABELS[t as NotionContentType] || t).join(", ")}`,
            });
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.6875rem] cursor-pointer transition-all hover:opacity-80 animate-pulse"
          style={{
            backgroundColor: "rgba(74,127,181,0.08)",
            border: "1px solid rgba(74,127,181,0.2)",
            color: "#4A7FB5",
            ...bodyFont,
          }}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span className="font-medium">New data available</span>
          <span style={{ color: "rgba(74,127,181,0.6)" }}>•</span>
          <span>{changedTypes.length} source{changedTypes.length !== 1 ? "s" : ""} updated</span>
        </button>
      )}

      {/* Main status bar */}
      <div className="flex flex-col rounded-lg overflow-hidden" style={{
        backgroundColor: effectiveLive
          ? effectiveStale ? "rgba(232,168,48,0.06)" : "rgba(93,160,107,0.06)"
          : "rgba(107,127,142,0.06)",
        border: effectiveLive
          ? effectiveStale ? "1px solid rgba(232,168,48,0.12)" : "1px solid rgba(93,160,107,0.12)"
          : "1px solid rgba(107,127,142,0.1)",
      }}>
        <div className="flex items-center gap-2 px-3 py-1.5 text-[0.6875rem]" style={bodyFont}>
          {/* Clickable status area */}
          <div
            onClick={() => hasHub && setExpanded(!expanded)}
            className={`flex items-center gap-2 flex-1 min-w-0 ${hasHub ? "cursor-pointer" : ""}`}
          >
            {/* Status icon */}
            {isLoading || refreshing ? (
              <RefreshCw className="w-3 h-3 animate-spin shrink-0" style={{ color: "#6B7F8E" }} />
            ) : effectiveLive ? (
              <Database className="w-3 h-3 shrink-0" style={{ color: effectiveStale ? "#E8A830" : "#5DA06B" }} />
            ) : (
              <WifiOff className="w-3 h-3 shrink-0" style={{ color: "#6B7F8E" }} />
            )}

            {/* Label */}
            <span style={{
              color: effectiveLive
                ? effectiveStale ? "#E8A830" : "#5DA06B"
                : "#6B7F8E",
            }}>
              {isLoading || refreshing
                ? "Syncing Notion…"
                : effectiveLive
                  ? effectiveStale ? "Notion (some stale)" : "Notion live"
                  : "Offline"}
            </span>

            {/* Aggregate stats */}
            {effectiveLive && hubStats.totalItems > 0 && !isLoading && !refreshing && (
              <>
                <span style={{ color: "rgba(107,127,142,0.3)" }}>•</span>
                <span style={{ color: "#6B7F8E" }}>
                  {hubStats.totalItems} items · {hubStats.configuredCount} sources
                </span>
              </>
            )}

            {/* Time ago */}
            {hubStats.latestSync && !isLoading && !refreshing && (
              <>
                <span style={{ color: "rgba(107,127,142,0.3)" }}>•</span>
                <span className="flex items-center gap-1" style={{ color: "#6B7F8E" }}>
                  <Clock className="w-2.5 h-2.5" />
                  {timeAgo(hubStats.latestSync)}
                </span>
              </>
            )}

            {/* Milestones progress (from legacy context) */}
            {isLive && stats.total > 0 && !isLoading && !refreshing && (
              <>
                <span style={{ color: "rgba(107,127,142,0.3)" }}>•</span>
                <span style={{ color: "#6B7F8E" }}>
                  {stats.done}/{stats.total} milestones
                </span>
                {stats.critical > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(199,91,63,0.1)", color: "#C75B3F", fontSize: "0.5625rem" }}
                  >
                    {stats.critical} critical
                  </span>
                )}
              </>
            )}

            {/* Expand chevron */}
            {hasHub && (
              <ChevronDown className={`w-3 h-3 text-muted-foreground/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
            )}
          </div>

          {/* Refresh button — outside the clickable div, not nested in a button */}
          {showRefresh && effectiveLive && !isLoading && !refreshing && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="ml-1 w-5 h-5 rounded flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
              title="Force refresh all sources from Notion"
            >
              <RefreshCw className="w-2.5 h-2.5" style={{ color: "#6B7F8E" }} />
            </button>
          )}
        </div>

        {/* Expanded: per-source breakdown */}
        {expanded && sources && (
          <div className="px-3 pb-2 space-y-1 border-t" style={{ borderColor: "rgba(107,127,142,0.08)" }}>
            <div className="pt-1.5" />
            {ALL_CONTENT_TYPES.map((type) => {
              const src = sources[type];
              if (!src?.configured) return null;
              const fresh = !src.isStale;
              return (
                <div key={type} className="flex items-center gap-2 text-[0.625rem] py-0.5" style={bodyFont}>
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: fresh ? "#5DA06B" : "#E8A830" }}
                  />
                  <span className="text-muted-foreground flex-1 truncate">
                    {CONTENT_TYPE_LABELS[type]}
                  </span>
                  <span style={{ color: "#6B7F8E" }}>
                    {src.itemCount} item{src.itemCount !== 1 ? "s" : ""}
                  </span>
                  {src.lastPulled && (
                    <span style={{ color: "rgba(107,127,142,0.5)" }}>
                      {timeAgo(src.lastPulled)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}