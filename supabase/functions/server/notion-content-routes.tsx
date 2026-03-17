// ─── Notion Content Hub (Generic Multi-Database Sync) ──────────
// Extracted from index.tsx to reduce cold-start memory pressure.
// Universal system for syncing ANY Notion database to the app.
// Config stored at: ik26:notion:config (master registry)
// Cache per type at: ik26:notion:cache:{type}
// Sync log at:       ik26:notion:sync-log

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const notionContent = new Hono();

const NOTION_CONTENT_TYPES = [
  "roster", "courses", "team", "comms", "milestones",
  "budget", "sponsors", "announcements", "schedule", "decisions", "warroom",
] as const;

type NotionContentType = typeof NOTION_CONTENT_TYPES[number];

const CONTENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes default

// ── In-memory cache for hot paths (reduces KV reads + Notion API calls) ──
interface MemCache<T> { data: T; ts: number; }
const MEM_CONTENT_TTL = 60_000; // 60 seconds in-memory
const _memContentCache: Map<string, MemCache<any[]>> = new Map();
const MEM_CHANGES_TTL = 90_000; // 90 seconds — check-changes is very expensive
let _memChangesCache: MemCache<any> | null = null;

function getMemContent(type: string): any[] | null {
  const cached = _memContentCache.get(type);
  if (cached && Date.now() - cached.ts < MEM_CONTENT_TTL) return cached.data;
  return null;
}

function setMemContent(type: string, data: any[]) {
  _memContentCache.set(type, { data, ts: Date.now() });
}

function getMemChanges(): any | null {
  const cached = _memChangesCache;
  if (cached && Date.now() - cached.ts < MEM_CHANGES_TTL) return cached.data;
  return null;
}

function setMemChanges(data: any) {
  _memChangesCache = { data, ts: Date.now() };
}

// ── Notion API key resolution ────────────────────────────────────
// Module-level key so downstream helpers can access it without threading `c`.
let _activeNotionKey: string | null = null;

export function resolveNotionKeyFromHeader(c: any): string | null {
  const envKey = Deno.env.get("NOTION_API_KEY");
  if (envKey) { _activeNotionKey = envKey; return envKey; }
  const headerKey = c?.req?.header("X-Notion-Key");
  if (headerKey && headerKey.trim()) { _activeNotionKey = headerKey.trim(); return _activeNotionKey; }
  return _activeNotionKey;
}

function getNotionKey(): string | null {
  return _activeNotionKey || Deno.env.get("NOTION_API_KEY") || null;
}

// Rate limiting: Notion allows 3 req/sec
let lastNotionReqTime = 0;
async function rateLimitedNotionFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastNotionReqTime;
  if (elapsed < 340) {
    await new Promise((r) => setTimeout(r, 340 - elapsed));
  }
  lastNotionReqTime = Date.now();
  return fetch(url, options);
}

// Generic Notion database query with pagination, rate limiting, and exponential backoff
async function queryNotionDatabase2(
  databaseId: string,
  sorts?: any[],
  filter?: any,
  retries = 3
): Promise<any[]> {
  const notionKey = getNotionKey();
  if (!notionKey) throw new Error("NOTION_API_KEY not configured");

  const allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: any = { page_size: 100 };
    if (sorts) body.sorts = sorts;
    if (filter) body.filter = filter;
    if (startCursor) body.start_cursor = startCursor;

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const resp = await rateLimitedNotionFetch(
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

        if (resp.status === 429) {
          const wait = Math.pow(2, attempt) * 1000;
          console.log(`Notion rate limited, waiting ${wait}ms (attempt ${attempt + 1})`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Notion API error ${resp.status}: ${errText}`);
        }

        const json = await resp.json();
        allResults.push(...json.results);
        hasMore = json.has_more;
        startCursor = json.next_cursor;
        lastErr = null;
        break;
      } catch (err: any) {
        lastErr = err;
        if (attempt < retries - 1) {
          const wait = Math.pow(2, attempt) * 1000;
          console.log(`Notion query retry ${attempt + 1}, waiting ${wait}ms: ${err.message}`);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
    }
    if (lastErr) throw lastErr;
  }

  return allResults;
}

// Extract ALL properties from a Notion page generically
function extractAllProperties(page: any): Record<string, any> {
  const props = page.properties;
  const result: Record<string, any> = {
    _notionId: page.id,
    _url: page.url,
    _lastEdited: page.last_edited_time,
    _created: page.created_time,
  };

  for (const [name, prop] of Object.entries(props)) {
    const p = prop as any;
    switch (p.type) {
      case "title": result[name] = p.title?.map((t: any) => t.plain_text).join("") || ""; break;
      case "rich_text": result[name] = p.rich_text?.map((t: any) => t.plain_text).join("") || ""; break;
      case "select": result[name] = p.select?.name || null; break;
      case "multi_select": result[name] = (p.multi_select || []).map((s: any) => s.name); break;
      case "number": result[name] = p.number ?? null; break;
      case "checkbox": result[name] = p.checkbox ?? false; break;
      case "date": result[name] = p.date?.start || null; result[`${name}_end`] = p.date?.end || null; break;
      case "url": result[name] = p.url || null; break;
      case "email": result[name] = p.email || null; break;
      case "phone_number": result[name] = p.phone_number || null; break;
      case "people": result[name] = (p.people || []).map((pe: any) => pe.name || pe.id); break;
      case "relation": result[name] = (p.relation || []).map((r: any) => r.id); break;
      case "formula": {
        const f = p.formula;
        result[name] = f ? (f.string || f.number || f.boolean || f.date?.start || null) : null;
        break;
      }
      case "status": result[name] = p.status?.name || null; break;
      case "files": result[name] = (p.files || []).map((f: any) => f.file?.url || f.external?.url || "").filter(Boolean); break;
      case "rollup": {
        if (p.rollup?.type === "number") result[name] = p.rollup.number;
        else if (p.rollup?.type === "array") result[name] = p.rollup.array?.length ?? 0;
        else result[name] = null;
        break;
      }
      case "created_time": result[name] = p.created_time; break;
      case "last_edited_time": result[name] = p.last_edited_time; break;
      case "created_by": result[name] = p.created_by?.name || p.created_by?.id; break;
      case "last_edited_by": result[name] = p.last_edited_by?.name || p.last_edited_by?.id; break;
      default: result[name] = null;
    }
  }

  return result;
}

// Get or initialize the master Notion config
export async function getNotionConfig(): Promise<Record<string, any>> {
  return (await kv.get("ik26:notion:config")) || {};
}

async function saveNotionConfig(config: Record<string, any>) {
  await kv.set("ik26:notion:config", config);
}

// ── Default IK26 Notion workspace configuration ─────────────────
const DEFAULT_NOTION_CONFIG: Record<string, { databaseId: string; label: string; isPageId?: boolean }> = {
  roster: { databaseId: "924024e2b82048ed8d6923c2199abf2d", label: "Chefs, Menu & Beverage", isPageId: true },
  courses: { databaseId: "924024e2b82048ed8d6923c2199abf2d", label: "Chefs, Menu & Beverage (Courses view)", isPageId: true },
  team: { databaseId: "ada2715ee86b4980a35d46450292b855", label: "Team Deploy", isPageId: true },
  comms: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Comms Tracker (inline DB)", isPageId: true },
  milestones: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Milestones (inline DB)", isPageId: true },
  budget: { databaseId: "964857d01c6647669a134a0375f6bcd2", label: "Money", isPageId: true },
  sponsors: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "Sponsors (from Comms Tracker)", isPageId: true },
  announcements: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Announcements", isPageId: true },
  schedule: { databaseId: "89f4bb096f6e40229f7cd100cee489c7", label: "Event Day & FOH", isPageId: true },
  decisions: { databaseId: "dd700843bbe140ebbc43acb01b081dd6", label: "Risk Register & Decision Log", isPageId: true },
  warroom: { databaseId: "c039a9bd04984885a1b96da9af7523dc", label: "Mission Control", isPageId: true },
};

// Auto-seed / patch config
export async function ensureDefaultConfig(): Promise<Record<string, any>> {
  let config = await getNotionConfig();
  const configuredTypes = Object.keys(config).filter((k) => config[k]?.databaseId);
  const now = new Date().toISOString();
  let changed = false;

  if (configuredTypes.length === 0) {
    for (const [type, def] of Object.entries(DEFAULT_NOTION_CONFIG)) {
      config[type] = {
        databaseId: def.databaseId,
        label: def.label,
        isPageId: def.isPageId || false,
        configuredAt: now,
        autoSeeded: true,
      };
    }
    changed = true;
    console.log("Auto-seeded Notion config with IK26 default database IDs");
  } else {
    for (const [type, def] of Object.entries(DEFAULT_NOTION_CONFIG)) {
      const entry = config[type];
      if (entry && entry.databaseId === def.databaseId && def.isPageId && !entry.isPageId) {
        entry.isPageId = true;
        delete entry._resolvedDbId;
        delete entry._resolvedDbTitle;
        delete entry._resolvedAt;
        changed = true;
      }
      if (!entry) {
        config[type] = {
          databaseId: def.databaseId,
          label: def.label,
          isPageId: def.isPageId || false,
          configuredAt: now,
          autoSeeded: true,
        };
        changed = true;
      }
    }
  }

  if (changed) {
    await saveNotionConfig(config);
    await appendSyncLog({ type: "system", action: "auto-seeded-defaults", timestamp: now });
  }
  return config;
}

// ── Helper: find inline databases within a Notion page ──────────
async function findInlineDatabases(pageId: string): Promise<{ id: string; title: string }[]> {
  const notionKey = getNotionKey();
  if (!notionKey) throw new Error("NOTION_API_KEY not configured");

  const databases: { id: string; title: string }[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const url = startCursor
      ? `https://api.notion.com/v1/blocks/${pageId}/children?start_cursor=${startCursor}&page_size=100`
      : `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`;

    const resp = await rateLimitedNotionFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Notion blocks API error ${resp.status}: ${errText}`);
    }

    const json = await resp.json();
    for (const block of json.results) {
      if (block.type === "child_database") {
        databases.push({
          id: block.id,
          title: block.child_database?.title || "Untitled Database",
        });
      }
    }
    hasMore = json.has_more;
    startCursor = json.next_cursor;
  }

  return databases;
}

// Smart query: handles both database IDs and page IDs.
async function smartQueryNotionContent(
  configEntry: any,
  type: string,
  sorts?: any[],
  filter?: any,
): Promise<any[]> {
  if (!configEntry.isPageId) {
    try {
      return await queryNotionDatabase2(configEntry.databaseId, sorts, filter);
    } catch (err: any) {
      if (err.message && err.message.includes("is a page, not a database")) {
        console.log(`Auto-detected ${configEntry.databaseId} as a page for type ${type}`);
        const config = await getNotionConfig();
        if (config[type]) {
          config[type].isPageId = true;
          await saveNotionConfig(config);
        }
        configEntry.isPageId = true;
      } else {
        throw err;
      }
    }
  }

  if (configEntry._resolvedDbId) {
    try {
      return await queryNotionDatabase2(configEntry._resolvedDbId, sorts, filter);
    } catch {
      console.log(`Stale resolved DB ID for ${type}, re-discovering`);
    }
  }

  const inlineDbs = await findInlineDatabases(configEntry.databaseId);
  if (inlineDbs.length === 0) {
    console.log(`No inline databases found on page ${configEntry.databaseId} for type ${type}`);
    return [];
  }

  const typeHints: Record<string, string[]> = {
    roster: ["chef", "roster", "chefs"],
    courses: ["course", "menu", "lineup", "dish"],
    team: ["team", "deploy", "member", "staff"],
    comms: ["comms", "tracker", "communication", "contact", "outreach"],
    milestones: ["milestone", "timeline", "path", "ik26"],
    budget: ["budget", "cost", "cogs", "money", "finance", "expense"],
    sponsors: ["sponsor", "partner", "tier"],
    announcements: ["announce", "update", "news"],
    schedule: ["schedule", "timeline", "event day", "foh", "agenda"],
    decisions: ["decision", "blocker", "risk", "open"],
    warroom: ["mission", "control", "critical", "alert", "escalat", "blocker"],
  };

  const hints = typeHints[type] || [];
  let targetDb = inlineDbs[0];

  if (hints.length > 0) {
    for (const db of inlineDbs) {
      const titleLower = db.title.toLowerCase();
      if (hints.some((h) => titleLower.includes(h))) {
        targetDb = db;
        break;
      }
    }
  }

  console.log(`Page ${configEntry.databaseId} -> found ${inlineDbs.length} inline DBs, querying "${targetDb.title}" (${targetDb.id}) for type ${type}`);

  const config = await getNotionConfig();
  if (config[type]) {
    config[type]._resolvedDbId = targetDb.id;
    config[type]._resolvedDbTitle = targetDb.title;
    config[type]._resolvedAt = new Date().toISOString();
    await saveNotionConfig(config);
  }

  return await queryNotionDatabase2(targetDb.id, sorts, filter);
}

// Append to sync log (keep last 100 entries)
async function appendSyncLog(entry: { type: string; action: string; itemCount?: number; error?: string; timestamp: string }) {
  const log: any[] = (await kv.get("ik26:notion:sync-log")) || [];
  log.unshift(entry);
  if (log.length > 100) log.length = 100;
  await kv.set("ik26:notion:sync-log", log);
}

// ── Configure a database ID for a content type ──────────────────

notionContent.post("/make-server-5ed426e6/notion/content/:type/configure", async (c) => {
  try {
    const type = c.req.param("type") as NotionContentType;
    const { databaseId, label, isPageId } = await c.req.json();

    if (!databaseId) {
      return c.json({ error: "Missing databaseId" }, 400);
    }

    const notionKey = resolveNotionKeyFromHeader(c);
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured." }, 500);
    }

    try {
      let dbTitle = label || "Untitled";
      let properties: string[] = [];
      let resolvedAsPage = false;

      const resp = await rateLimitedNotionFetch(
        `https://api.notion.com/v1/databases/${databaseId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28",
          },
        }
      );

      if (resp.ok) {
        const dbInfo = await resp.json();
        dbTitle = label || dbInfo.title?.map((t: any) => t.plain_text).join("") || "Untitled";
        properties = Object.keys(dbInfo.properties || {});
      } else {
        const pageResp = await rateLimitedNotionFetch(
          `https://api.notion.com/v1/pages/${databaseId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${notionKey}`,
              "Notion-Version": "2022-06-28",
            },
          }
        );

        if (!pageResp.ok) {
          const errText = await pageResp.text();
          return c.json({ error: `Invalid database/page ID or no access: ${errText}` }, 400);
        }

        resolvedAsPage = true;
        const inlineDbs = await findInlineDatabases(databaseId);
        if (inlineDbs.length > 0) {
          dbTitle = label || `Page with ${inlineDbs.length} inline DB(s)`;
          properties = inlineDbs.map((db) => db.title);
        } else {
          dbTitle = label || "Page (no inline databases found)";
        }
      }

      const config = await getNotionConfig();
      config[type] = {
        databaseId,
        label: dbTitle,
        isPageId: resolvedAsPage || isPageId || false,
        configuredAt: new Date().toISOString(),
      };
      await saveNotionConfig(config);

      await appendSyncLog({ type, action: "configured", timestamp: new Date().toISOString() });

      return c.json({
        configured: true,
        databaseId,
        label: dbTitle,
        isPageId: resolvedAsPage || isPageId || false,
        properties,
      });
    } catch (err: any) {
      return c.json({ error: `Database validation failed: ${err.message}` }, 400);
    }
  } catch (err) {
    console.log("Error configuring Notion content:", err);
    return c.json({ error: `Configuration failed: ${err}` }, 500);
  }
});

// ── Check configuration status ──────────────────────────────────

notionContent.get("/make-server-5ed426e6/notion/content/:type/configure", async (c) => {
  try {
    const type = c.req.param("type");
    const config = await getNotionConfig();
    const entry = config[type];
    if (entry) {
      return c.json({ configured: true, databaseId: entry.databaseId, label: entry.label, configuredAt: entry.configuredAt });
    }
    return c.json({ configured: false });
  } catch (err) {
    console.log("Error checking Notion content config:", err);
    return c.json({ error: `Config check failed: ${err}` }, 500);
  }
});

// ── Pull data from a configured Notion database ─────────────────

notionContent.get("/make-server-5ed426e6/notion/content/:type/pull", async (c) => {
  try {
    resolveNotionKeyFromHeader(c);
    const type = c.req.param("type");
    const forceRefresh = c.req.query("force") === "true";
    const config = await ensureDefaultConfig();
    const entry = config[type];

    if (!entry) {
      return c.json({ items: [], configured: false, error: "Not configured" });
    }

    // 1. Check in-memory cache first (fastest, avoids KV read)
    if (!forceRefresh) {
      const memCached = getMemContent(type);
      if (memCached) {
        return c.json({ items: memCached, cached: true, stale: false, lastPulled: Date.now(), itemCount: memCached.length, source: "mem" });
      }
    }

    const cacheKey = `ik26:notion:cache:${type}`;
    const now = Date.now();

    // 2. Check KV cache
    if (!forceRefresh) {
      const cached: any = await kv.get(cacheKey);
      if (cached && now - cached.cachedAt < CONTENT_CACHE_TTL_MS) {
        setMemContent(type, cached.data); // warm mem cache
        return c.json({ items: cached.data, cached: true, stale: false, lastPulled: cached.cachedAt, itemCount: cached.data.length });
      }
    }

    // 3. Fetch fresh from Notion
    const results = await smartQueryNotionContent(entry, type);
    const items = results.map(extractAllProperties);
    await kv.set(cacheKey, { data: items, cachedAt: now });
    setMemContent(type, items); // warm mem cache

    await appendSyncLog({ type, action: "pulled", itemCount: items.length, timestamp: new Date().toISOString() });

    return c.json({ items, cached: false, stale: false, lastPulled: now, itemCount: items.length });
  } catch (err: any) {
    console.log(`Error pulling Notion content (${c.req.param("type")}):`, err);

    // Try in-memory cache first, then KV stale cache
    const type = c.req.param("type");
    const memCached = getMemContent(type);
    if (memCached) {
      return c.json({ items: memCached, cached: true, stale: true, lastPulled: Date.now(), itemCount: memCached.length, error: `Using mem cache: ${err.message}` });
    }

    const cacheKey = `ik26:notion:cache:${type}`;
    const stale: any = await kv.get(cacheKey);
    if (stale) {
      return c.json({ items: stale.data, cached: true, stale: true, lastPulled: stale.cachedAt, itemCount: stale.data.length, error: `Using stale cache: ${err.message}` });
    }
    return c.json({ items: [], error: `Pull failed: ${err.message}` }, 500);
  }
});

// ── Push an update back to Notion (two-way sync) ────────────────

notionContent.put("/make-server-5ed426e6/notion/content/:type/push/:pageId", async (c) => {
  try {
    const type = c.req.param("type");
    const pageId = c.req.param("pageId");
    const { properties } = await c.req.json();

    const notionKey = resolveNotionKeyFromHeader(c);
    if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);
    if (!properties || typeof properties !== "object") return c.json({ error: "Missing properties object" }, 400);

    const notionProps: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      const val = value as any;
      if (val._type === "select") notionProps[key] = { select: val.value ? { name: val.value } : null };
      else if (val._type === "multi_select") notionProps[key] = { multi_select: (val.value || []).map((n: string) => ({ name: n })) };
      else if (val._type === "number") notionProps[key] = { number: val.value };
      else if (val._type === "checkbox") notionProps[key] = { checkbox: !!val.value };
      else if (val._type === "date") notionProps[key] = { date: val.value ? { start: val.value, end: val.end || null } : null };
      else if (val._type === "url") notionProps[key] = { url: val.value || null };
      else if (val._type === "email") notionProps[key] = { email: val.value || null };
      else if (val._type === "status") notionProps[key] = { status: val.value ? { name: val.value } : null };
      else if (val._type === "title") notionProps[key] = { title: [{ text: { content: String(val.value || "") } }] };
      else notionProps[key] = { rich_text: [{ text: { content: String(val.value || "") } }] };
    }

    const resp = await rateLimitedNotionFetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${notionKey}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
      body: JSON.stringify({ properties: notionProps }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Notion update error ${resp.status}: ${errText}`);
    }

    const updated = await resp.json();
    await kv.del(`ik26:notion:cache:${type}`);
    await appendSyncLog({ type, action: "pushed", timestamp: new Date().toISOString() });

    return c.json({ success: true, page: extractAllProperties(updated) });
  } catch (err: any) {
    console.log(`Error pushing Notion content (${c.req.param("type")}):`, err);
    return c.json({ error: `Push failed: ${err.message}` }, 500);
  }
});

// ── Get all configured sources with status ──────────────────────

notionContent.get("/make-server-5ed426e6/notion/content/sources", async (c) => {
  try {
    const config = await ensureDefaultConfig();
    const sources: Record<string, any> = {};

    for (const type of NOTION_CONTENT_TYPES) {
      const entry = config[type];
      if (entry) {
        const cacheKey = `ik26:notion:cache:${type}`;
        const cached: any = await kv.get(cacheKey);
        const now = Date.now();
        sources[type] = {
          configured: true, databaseId: entry.databaseId, label: entry.label, configuredAt: entry.configuredAt,
          lastPulled: cached?.cachedAt || null, itemCount: cached?.data?.length || 0,
          isStale: cached ? (now - cached.cachedAt > CONTENT_CACHE_TTL_MS) : true,
        };
      } else {
        sources[type] = { configured: false, databaseId: null, label: null, lastPulled: null, itemCount: 0, isStale: false };
      }
    }

    return c.json({ sources });
  } catch (err) {
    console.log("Error loading Notion sources:", err);
    return c.json({ error: `Failed to load sources: ${err}` }, 500);
  }
});

// ── Sync all configured databases at once ───────────────────────

notionContent.post("/make-server-5ed426e6/notion/content/sync-all", async (c) => {
  try {
    resolveNotionKeyFromHeader(c);
    const config = await ensureDefaultConfig();
    const results: Record<string, any> = {};
    const configuredTypes = Object.keys(config).filter((k) => config[k]?.databaseId);

    for (const type of configuredTypes) {
      try {
        const entry = config[type];
        const dbResults = await smartQueryNotionContent(entry, type);
        const items = dbResults.map(extractAllProperties);
        const now = Date.now();
        await kv.set(`ik26:notion:cache:${type}`, { data: items, cachedAt: now });
        results[type] = { success: true, itemCount: items.length, lastPulled: now };
        await appendSyncLog({ type, action: "sync-all-pulled", itemCount: items.length, timestamp: new Date().toISOString() });
      } catch (err: any) {
        results[type] = { success: false, error: err.message };
        await appendSyncLog({ type, action: "sync-all-error", error: err.message, timestamp: new Date().toISOString() });
      }
    }

    // Send Discord notification if webhook is configured
    const discordUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (discordUrl) {
      try {
        const successCount = Object.values(results).filter((r: any) => r.success).length;
        const failCount = Object.values(results).filter((r: any) => !r.success).length;
        const totalItems = Object.values(results)
          .filter((r: any) => r.success)
          .reduce((s: number, r: any) => s + (r.itemCount || 0), 0);

        await fetch(discordUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "IK26 Ops Bot",
            embeds: [{
              title: "Notion Sync Complete",
              description: `Synced ${successCount} content types (${totalItems} total items)${failCount > 0 ? ` — ${failCount} failed` : ""}`,
              color: failCount > 0 ? 0xc27b6b : 0x7e9e78,
              fields: Object.entries(results).map(([type, r]: [string, any]) => ({
                name: type,
                value: r.success ? `${r.itemCount} items` : `Error: ${r.error}`,
                inline: true,
              })),
              timestamp: new Date().toISOString(),
              footer: { text: "Isang Kusina 2026 Bot" },
            }],
          }),
        });
      } catch (discordErr) {
        console.log("Discord notification failed (non-blocking):", discordErr);
      }
    }

    return c.json({ results, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.log("Error syncing all Notion content:", err);
    return c.json({ error: `Sync all failed: ${err}` }, 500);
  }
});

// ── Check for changes (lightweight — uses last_edited_time) ─────
// Cached in-memory for 90s to prevent repeated heavy Notion API sweeps

notionContent.get("/make-server-5ed426e6/notion/content/check-changes", async (c) => {
  try {
    // Return cached result if available (avoids 11 Notion API calls)
    const memCached = getMemChanges();
    if (memCached) {
      return c.json({ changes: memCached, cached: true });
    }

    resolveNotionKeyFromHeader(c);
    const config = await ensureDefaultConfig();
    const changes: Record<string, { hasChanges: boolean; latestEdit: string | null }> = {};

    // Only check types that have cached data — skip uncached ones (mark as changed)
    const typesToCheck: string[] = [];
    for (const type of NOTION_CONTENT_TYPES) {
      const entry = config[type];
      if (!entry) continue;

      const cacheKey = `ik26:notion:cache:${type}`;
      const cached: any = await kv.get(cacheKey);

      if (!cached) {
        changes[type] = { hasChanges: true, latestEdit: null };
      } else {
        typesToCheck.push(type);
      }
    }

    // Batch check only cached types (limit to 4 at a time to stay under compute limits)
    for (let i = 0; i < typesToCheck.length; i += 4) {
      const batch = typesToCheck.slice(i, i + 4);
      const results = await Promise.allSettled(
        batch.map(async (type) => {
          const entry = config[type];
          const cacheKey = `ik26:notion:cache:${type}`;
          const cached: any = await kv.get(cacheKey);

          try {
            const results = await smartQueryNotionContent(
              entry, type,
              [{ timestamp: "last_edited_time", direction: "descending" }],
            );
            if (results.length > 0) {
              const latestEdit = results[0].last_edited_time;
              const cachedTime = new Date(cached.cachedAt).toISOString();
              return { type, hasChanges: latestEdit > cachedTime, latestEdit };
            }
            return { type, hasChanges: false, latestEdit: null };
          } catch {
            return { type, hasChanges: true, latestEdit: null };
          }
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          const { type, ...rest } = result.value;
          changes[type] = rest;
        }
      }
    }

    // Cache the result in memory for 90 seconds
    setMemChanges(changes);

    return c.json({ changes, cached: false });
  } catch (err) {
    console.log("Error checking Notion changes:", err);
    return c.json({ error: `Change check failed: ${err}` }, 500);
  }
});

// ── Get sync log ────────────────────────────────────────────────

notionContent.get("/make-server-5ed426e6/notion/content/sync-log", async (c) => {
  try {
    const log = (await kv.get("ik26:notion:sync-log")) || [];
    return c.json({ log });
  } catch (err) {
    console.log("Error loading sync log:", err);
    return c.json({ error: `Failed to load sync log: ${err}` }, 500);
  }
});

// ── Auto-configure all defaults at once ─────────────────────────

notionContent.post("/make-server-5ed426e6/notion/content/auto-configure", async (c) => {
  try {
    const notionKey = resolveNotionKeyFromHeader(c);
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured." }, 500);
    }

    const config = await getNotionConfig();
    const now = new Date().toISOString();
    let configured = 0;

    for (const [type, def] of Object.entries(DEFAULT_NOTION_CONFIG)) {
      if (!config[type]?.databaseId) {
        config[type] = {
          databaseId: def.databaseId,
          label: def.label,
          isPageId: def.isPageId || false,
          configuredAt: now,
          autoSeeded: true,
        };
        configured++;
      }
    }

    await saveNotionConfig(config);
    await appendSyncLog({ type: "system", action: "auto-configured-all", itemCount: configured, timestamp: now });

    return c.json({ success: true, configured, total: Object.keys(DEFAULT_NOTION_CONFIG).length });
  } catch (err) {
    console.log("Error auto-configuring Notion content:", err);
    return c.json({ error: `Auto-configure failed: ${err}` }, 500);
  }
});

// ── Discover inline databases on a page ─────────────────────────

notionContent.get("/make-server-5ed426e6/notion/discover-inline-dbs/:pageId", async (c) => {
  try {
    resolveNotionKeyFromHeader(c);
    const pageId = c.req.param("pageId");
    const databases = await findInlineDatabases(pageId);
    return c.json({ databases, count: databases.length });
  } catch (err: any) {
    console.log("Error discovering inline databases:", err);
    return c.json({ error: `Discovery failed: ${err.message}` }, 500);
  }
});

// ── Remove a content type configuration ─────────────────────────

notionContent.delete("/make-server-5ed426e6/notion/content/:type/configure", async (c) => {
  try {
    const type = c.req.param("type");
    const config = await getNotionConfig();
    if (config[type]) {
      delete config[type];
      await saveNotionConfig(config);
      await kv.del(`ik26:notion:cache:${type}`);
      await appendSyncLog({ type, action: "removed", timestamp: new Date().toISOString() });
    }
    return c.json({ success: true });
  } catch (err) {
    console.log("Error removing Notion content config:", err);
    return c.json({ error: `Remove failed: ${err}` }, 500);
  }
});

export { notionContent };