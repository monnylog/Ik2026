// ─── Notion IK26 Path + Task Board Sync ────────────────────────
// Extracted from index.tsx v3.2.0 to further reduce cold-start memory.
// IK26 Path: queries the milestone tracker database, caches in KV 5 min.
// Task Board: two-way sync between local task board and a Notion tasks DB.

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

export const notionTasks = new Hono();

// ── Notion API key resolution (module-scoped) ────────────────────
let _activeNotionKey: string | null = null;

function resolveNotionKey(c: any): string | null {
  const envKey = Deno.env.get("NOTION_API_KEY");
  if (envKey) { _activeNotionKey = envKey; return envKey; }
  const headerKey = c?.req?.header("X-Notion-Key");
  if (headerKey && headerKey.trim()) { _activeNotionKey = headerKey.trim(); return _activeNotionKey; }
  return _activeNotionKey;
}

function getNotionKey(): string | null {
  return _activeNotionKey || Deno.env.get("NOTION_API_KEY") || null;
}

// Allow index.tsx to set the key when /validate-key is called
export function setActiveNotionKey(key: string) {
  _activeNotionKey = key;
}

// ─── IK26 Path (milestone tracker) ─────────────────────────────

const NOTION_DB_ID = "8c2ba05f42f24bd0a10859e44f212e5c";
const NOTION_CACHE_KEY = "ik26:notion:ik26-path";
const NOTION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface NotionCacheEntry {
  data: any;
  cachedAt: number;
}

async function fetchNotionDatabase() {
  const notionKey = getNotionKey();
  if (!notionKey) {
    throw new Error("NOTION_API_KEY not configured");
  }

  const allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: any = {
      page_size: 100,
      sorts: [{ property: "#", direction: "ascending" }],
    };
    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const resp = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Notion API error ${resp.status}: ${errText}`);
    }

    const json = await resp.json();
    allResults.push(...json.results);
    hasMore = json.has_more;
    startCursor = json.next_cursor;
  }

  return allResults;
}

function extractNotionProperties(page: any) {
  const props = page.properties;

  const getTitle = (p: any) =>
    p?.title?.map((t: any) => t.plain_text).join("") || "";
  const getText = (p: any) =>
    p?.rich_text?.map((t: any) => t.plain_text).join("") || "";
  const getSelect = (p: any) => p?.select?.name || null;
  const getNumber = (p: any) => p?.number ?? null;
  const getDateStart = (p: any) => p?.date?.start || null;
  const getDateEnd = (p: any) => p?.date?.end || null;
  const getUrl = (p: any) => p?.url || null;

  return {
    id: page.id,
    url: page.url,
    milestone: getTitle(props["Milestone"]),
    number: getNumber(props["#"]),
    division: getSelect(props["Division"]),
    status: getSelect(props["Status"]),
    week: getSelect(props["Week"]),
    owner: getText(props["Owner"]),
    blocksAndDeps: getText(props["Blocks / Dependencies"]),
    dueDate: getDateStart(props["Due Date"]),
    dueDateEnd: getDateEnd(props["Due Date"]),
    rellaLink: getUrl(props["Rella Content Link"]),
  };
}

notionTasks.get("/make-server-5ed426e6/notion/ik26-path", async (c) => {
  try {
    resolveNotionKey(c);
    // Check cache
    const cached: NotionCacheEntry | null = await kv.get(NOTION_CACHE_KEY);
    const now = Date.now();

    if (cached && now - cached.cachedAt < NOTION_CACHE_TTL_MS) {
      return c.json({ milestones: cached.data, cached: true, cachedAt: cached.cachedAt });
    }

    // Fetch fresh from Notion
    const results = await fetchNotionDatabase();
    const milestones = results.map(extractNotionProperties);

    // Cache in KV
    await kv.set(NOTION_CACHE_KEY, { data: milestones, cachedAt: now });

    return c.json({ milestones, cached: false, cachedAt: now });
  } catch (err) {
    console.log("Error fetching Notion IK26 Path:", err);

    // Try returning stale cache if available
    const staleCache: NotionCacheEntry | null = await kv.get(NOTION_CACHE_KEY);
    if (staleCache) {
      return c.json({
        milestones: staleCache.data,
        cached: true,
        stale: true,
        cachedAt: staleCache.cachedAt,
        error: `Using stale cache: ${err}`,
      });
    }

    return c.json({ error: `Failed to fetch Notion data: ${err}` }, 500);
  }
});

// Force-refresh cache
notionTasks.post("/make-server-5ed426e6/notion/ik26-path/refresh", async (c) => {
  try {
    resolveNotionKey(c);
    const results = await fetchNotionDatabase();
    const milestones = results.map(extractNotionProperties);
    const now = Date.now();
    await kv.set(NOTION_CACHE_KEY, { data: milestones, cachedAt: now });
    return c.json({ milestones, cached: false, cachedAt: now });
  } catch (err) {
    console.log("Error refreshing Notion IK26 Path:", err);
    return c.json({ error: `Failed to refresh Notion data: ${err}` }, 500);
  }
});

// ─── Notion Task Board Sync ────────────────────────────────────
// Two-way sync between task board and a Notion tasks database
// KV key: ik26:notion:tasks-db-id -> stores the Notion database ID
// KV key: ik26:notion:task-sync -> stores sync metadata
// KV key: ik26:notion:task-map -> maps local task IDs to Notion page IDs

const TASKS_DB_CACHE_KEY = "ik26:notion:tasks-db-id";
const TASK_SYNC_META_KEY = "ik26:notion:task-sync";
const TASK_MAP_KEY = "ik26:notion:task-map";
const TASK_BOARD_KEY = "ik26:taskboard:tasks";

// Save/get the Notion database ID for tasks
notionTasks.post("/make-server-5ed426e6/notion/tasks/configure", async (c) => {
  try {
    const { databaseId } = await c.req.json();
    if (!databaseId) {
      return c.json({ error: "Missing databaseId" }, 400);
    }
    await kv.set(TASKS_DB_CACHE_KEY, databaseId);
    return c.json({ ok: true, databaseId });
  } catch (err) {
    console.log("Error configuring Notion tasks DB:", err);
    return c.json({ error: `Failed to configure: ${err}` }, 500);
  }
});

notionTasks.get("/make-server-5ed426e6/notion/tasks/configure", async (c) => {
  try {
    const databaseId = await kv.get(TASKS_DB_CACHE_KEY);
    return c.json({ databaseId: databaseId || null });
  } catch (err) {
    console.log("Error getting Notion tasks DB config:", err);
    return c.json({ error: `Failed to get config: ${err}` }, 500);
  }
});

// Helper: create or update a task page in Notion
async function upsertNotionTask(
  notionKey: string,
  databaseId: string,
  task: any,
  existingPageId?: string
) {
  const statusMap: Record<string, string> = {
    todo: "To Do",
    "in-progress": "In Progress",
    done: "Done",
  };
  const properties: any = {
    "Task": { title: [{ text: { content: task.title } }] },
    "Status": { select: { name: statusMap[task.status] || "To Do" } },
    "Priority": { select: { name: task.priority.charAt(0).toUpperCase() + task.priority.slice(1) } },
    "Category": { select: { name: task.category } },
    "Assignee": { rich_text: [{ text: { content: task.assignee } }] },
    "Due Date": { rich_text: [{ text: { content: task.dueDate } }] },
  };

  if (existingPageId) {
    const resp = await fetch(`https://api.notion.com/v1/pages/${existingPageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Notion update error ${resp.status}: ${errText}`);
    }
    return await resp.json();
  } else {
    const resp = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Notion create error ${resp.status}: ${errText}`);
    }
    return await resp.json();
  }
}

// Push tasks to Notion (sync up)
notionTasks.post("/make-server-5ed426e6/notion/tasks/sync-up", async (c) => {
  try {
    const notionKey = resolveNotionKey(c);
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured" }, 500);
    }

    const databaseId = await kv.get(TASKS_DB_CACHE_KEY);
    if (!databaseId) {
      return c.json({ error: "Notion tasks database not configured. Go to Settings to set it up." }, 400);
    }

    const { tasks } = await c.req.json();
    if (!tasks || !Array.isArray(tasks)) {
      return c.json({ error: "Missing tasks array" }, 400);
    }

    // Get existing task -> Notion page mapping
    const taskMap: Record<string, string> = (await kv.get(TASK_MAP_KEY)) || {};

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const task of tasks) {
      try {
        const existingPageId = taskMap[task.id];
        const result = await upsertNotionTask(notionKey, databaseId, task, existingPageId);
        if (existingPageId) {
          updated++;
        } else {
          taskMap[task.id] = result.id;
          created++;
        }
      } catch (err: any) {
        errors.push(`Task "${task.title}": ${err.message}`);
      }
    }

    // Save updated mapping
    await kv.set(TASK_MAP_KEY, taskMap);

    // Save sync metadata
    const syncMeta = {
      lastSyncUp: new Date().toISOString(),
      taskCount: tasks.length,
      created,
      updated,
      errors,
    };
    await kv.set(TASK_SYNC_META_KEY, syncMeta);

    // Also save the tasks to KV for persistence
    await kv.set(TASK_BOARD_KEY, tasks);

    return c.json({ ok: true, ...syncMeta });
  } catch (err) {
    console.log("Error syncing tasks to Notion:", err);
    return c.json({ error: `Sync up failed: ${err}` }, 500);
  }
});

// Pull tasks from Notion (sync down)
notionTasks.get("/make-server-5ed426e6/notion/tasks/sync-down", async (c) => {
  try {
    const notionKey = resolveNotionKey(c);
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured" }, 500);
    }

    const databaseId = await kv.get(TASKS_DB_CACHE_KEY);
    if (!databaseId) {
      return c.json({ error: "Notion tasks database not configured" }, 400);
    }

    // Query Notion database
    const allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const body: any = { page_size: 100 };
      if (startCursor) body.start_cursor = startCursor;

      const resp = await fetch(
        `https://api.notion.com/v1/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Notion API error ${resp.status}: ${errText}`);
      }

      const json = await resp.json();
      allResults.push(...json.results);
      hasMore = json.has_more;
      startCursor = json.next_cursor;
    }

    // Extract task data from Notion pages
    const statusReverseMap: Record<string, string> = {
      "To Do": "todo",
      "In Progress": "in-progress",
      "Done": "done",
    };

    const tasks = allResults.map((page: any) => {
      const props = page.properties;
      const getTitle = (p: any) => p?.title?.map((t: any) => t.plain_text).join("") || "";
      const getText = (p: any) => p?.rich_text?.map((t: any) => t.plain_text).join("") || "";
      const getSelect = (p: any) => p?.select?.name || null;

      const title = getTitle(props["Task"]);
      const status = statusReverseMap[getSelect(props["Status"]) || ""] || "todo";
      const priority = (getSelect(props["Priority"]) || "medium").toLowerCase();
      const category = getSelect(props["Category"]) || "Logistics";
      const assignee = getText(props["Assignee"]) || "Unassigned";
      const dueDate = getText(props["Due Date"]) || "TBD";

      return {
        id: `notion-${page.id.replace(/-/g, "").slice(0, 8)}`,
        notionPageId: page.id,
        title,
        assignee,
        assigneeEmoji: "\u{1F4CB}",
        dueDate,
        priority,
        category,
        status,
      };
    });

    // Update task map with Notion page IDs
    const taskMap: Record<string, string> = {};
    tasks.forEach((t: any) => {
      taskMap[t.id] = t.notionPageId;
    });
    await kv.set(TASK_MAP_KEY, taskMap);

    // Save sync metadata
    const syncMeta = {
      lastSyncDown: new Date().toISOString(),
      taskCount: tasks.length,
    };
    await kv.set(TASK_SYNC_META_KEY, syncMeta);

    return c.json({ tasks, ...syncMeta });
  } catch (err) {
    console.log("Error pulling tasks from Notion:", err);
    return c.json({ error: `Sync down failed: ${err}` }, 500);
  }
});

// Get sync metadata
notionTasks.get("/make-server-5ed426e6/notion/tasks/sync-status", async (c) => {
  try {
    const syncMeta = await kv.get(TASK_SYNC_META_KEY);
    const databaseId = await kv.get(TASKS_DB_CACHE_KEY);
    return c.json({ syncMeta: syncMeta || null, configured: !!databaseId });
  } catch (err) {
    console.log("Error getting sync status:", err);
    return c.json({ error: `Failed to get sync status: ${err}` }, 500);
  }
});

// Save task board state to KV (for persistence across sessions)
notionTasks.put("/make-server-5ed426e6/notion/tasks/save", async (c) => {
  try {
    const { tasks } = await c.req.json();
    if (!tasks || !Array.isArray(tasks)) {
      return c.json({ error: "Missing tasks array" }, 400);
    }
    await kv.set(TASK_BOARD_KEY, tasks);
    return c.json({ ok: true, count: tasks.length });
  } catch (err) {
    console.log("Error saving task board:", err);
    return c.json({ error: `Failed to save tasks: ${err}` }, 500);
  }
});

// Load task board state from KV
notionTasks.get("/make-server-5ed426e6/notion/tasks/load", async (c) => {
  try {
    const tasks = await kv.get(TASK_BOARD_KEY);
    return c.json({ tasks: tasks || null });
  } catch (err) {
    console.log("Error loading task board:", err);
    return c.json({ error: `Failed to load tasks: ${err}` }, 500);
  }
});
