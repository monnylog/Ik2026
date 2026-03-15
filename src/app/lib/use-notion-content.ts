import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "./supabase";
import {
  type NotionContentType,
  ALL_CONTENT_TYPES,
  subscribeToContent,
  pullContent,
  pushToNotion,
} from "./notion-sync";

// Re-export types for backward compatibility
export type ContentType = NotionContentType;
export { ALL_CONTENT_TYPES };

export interface ContentSource {
  configured: boolean;
  databaseId: string | null;
  lastPulled: number | null;
  itemCount: number;
}

export interface NotionContentItem {
  _notionId: string;
  _url: string;
  _lastEdited: string;
  [key: string]: any;
}

interface UseNotionContentReturn {
  items: NotionContentItem[];
  isLoading: boolean;
  isConfigured: boolean;
  isCached: boolean;
  isStale: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  configure: (databaseId: string) => Promise<boolean>;
  pushUpdate: (notionId: string, properties: Record<string, any>) => Promise<boolean>;
}

export function useNotionContent(type: ContentType, enabled = true): UseNotionContentReturn {
  const [items, setItems] = useState<NotionContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to broadcast updates from the sync service
  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribeToContent(type, (newItems) => {
      setItems(newItems as NotionContentItem[]);
    });
    return unsub;
  }, [type, enabled]);

  // Check configuration and pull data on mount
  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      setIsLoading(true);
      try {
        // Check if configured
        const configRes = await apiFetch(`/notion/content/${type}/configure`);
        setIsConfigured(!!configRes.configured);

        if (configRes.configured) {
          // Pull data
          const pullRes = await apiFetch(`/notion/content/${type}/pull`);
          if (pullRes.items && Array.isArray(pullRes.items)) {
            setItems(pullRes.items);
            setIsCached(!!pullRes.cached);
            setIsStale(!!pullRes.stale);
          }
          if (pullRes.error) {
            setError(pullRes.error);
          }
        }
      } catch (err: any) {
        console.error(`Notion content (${type}) init error:`, err);
        setError(err?.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [type, enabled]);

  // Refresh (force re-pull from Notion)
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await pullContent(type, true);
      setItems(items as NotionContentItem[]);
      setIsCached(false);
      setIsStale(false);
    } catch (err: any) {
      console.error(`Notion content (${type}) refresh error:`, err);
      setError(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Configure a new database ID
  const configure = useCallback(async (databaseId: string): Promise<boolean> => {
    try {
      await apiFetch(`/notion/content/${type}/configure`, {
        method: "POST",
        body: JSON.stringify({ databaseId }),
      });
      setIsConfigured(true);
      // Immediately pull data
      await refresh();
      return true;
    } catch (err: any) {
      console.error(`Notion content (${type}) configure error:`, err);
      setError(err?.message || String(err));
      return false;
    }
  }, [type, refresh]);

  // Push an update back to Notion (two-way sync)
  const pushUpdate = useCallback(async (
    notionId: string,
    properties: Record<string, any>
  ): Promise<boolean> => {
    try {
      const success = await pushToNotion(type, notionId, properties);
      if (success) {
        // Refresh to get updated data
        await refresh();
      }
      return success;
    } catch (err: any) {
      console.error(`Notion content (${type}) push error:`, err);
      setError(err?.message || String(err));
      return false;
    }
  }, [type, refresh]);

  return {
    items,
    isLoading,
    isConfigured,
    isCached,
    isStale,
    error,
    refresh,
    configure,
    pushUpdate,
  };
}

// ─── List all configured content sources ─────────────────────────

export function useNotionSources() {
  const [sources, setSources] = useState<Record<ContentType, ContentSource> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/notion/content/sources")
      .then((res) => setSources(res.sources))
      .catch((err) => console.error("Error loading Notion sources:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/notion/content/sources");
      setSources(res.sources);
    } catch (err) {
      console.error("Error reloading Notion sources:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sources, isLoading, reload };
}
