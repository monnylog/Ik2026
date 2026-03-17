// ─── IK26 Website Copy CMS ──────────────────────────────────────
// Serves all public-facing website copy from the Notion "Website Copy (CMS)"
// database (ID: 3a60b0b74d594babbd887280c8dcd8f8).
//
// Endpoints:
//   GET /ik26/copy          → returns all "Live" copy as { key: copy } map
//   GET /ik26/copy/:key     → returns a single copy entry by key
//   POST /ik26/copy/refresh → force-clears the cache and re-fetches from Notion
//
// Cache: 5-minute TTL in Supabase kv_store (key: ik26:copy:cache)
// Scope: IK26 only. Reads from one database. No cross-workspace access.

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const websiteCopy = new Hono();

const COPY_DB_ID = "3a60b0b74d594babbd887280c8dcd8f8";
const CACHE_KEY = "ik26:copy:cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Notion API helpers ───────────────────────────────────────────

function getNotionKey(): string {
  const key = Deno.env.get("NOTION_API_KEY");
  if (!key) throw new Error("NOTION_API_KEY not set");
  return key;
}

let lastNotionReqTime = 0;
async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const elapsed = Date.now() - lastNotionReqTime;
  if (elapsed < 340) await new Promise((r) => setTimeout(r, 340 - elapsed));
  lastNotionReqTime = Date.now();
  return fetch(url, options);
}

// ── Fetch all Live copy rows from Notion ─────────────────────────

async function fetchCopyFromNotion(): Promise<Record<string, string>> {
  const notionKey = getNotionKey();
  const allResults: any[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: any = {
      page_size: 100,
      filter: {
        property: "Status",
        select: { equals: "Live" },
      },
    };
    if (startCursor) body.start_cursor = startCursor;

    const resp = await rateLimitedFetch(
      `https://api.notion.com/v1/databases/${COPY_DB_ID}/query`,
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
      const err = await resp.text();
      throw new Error(`Notion API error ${resp.status}: ${err}`);
    }

    const json = await resp.json();
    allResults.push(...json.results);
    hasMore = json.has_more;
    startCursor = json.next_cursor;
  }

  // Transform Notion rows into a flat { key: copy } map
  const copyMap: Record<string, string> = {};
  for (const page of allResults) {
    const key = page.properties?.Key?.rich_text?.[0]?.plain_text?.trim();
    const copy = page.properties?.Copy?.rich_text?.[0]?.plain_text?.trim();
    if (key && copy !== undefined) {
      copyMap[key] = copy;
    }
  }
  return copyMap;
}

// ── Cache helpers ────────────────────────────────────────────────

async function getCachedCopy(): Promise<Record<string, string> | null> {
  try {
    const cached = await kv.get(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCachedCopy(data: Record<string, string>): Promise<void> {
  await kv.set(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

// ── Routes ───────────────────────────────────────────────────────

// GET /ik26/copy — returns all Live copy as a flat key/value map
websiteCopy.get("/", async (c) => {
  try {
    let copyMap = await getCachedCopy();
    if (!copyMap) {
      copyMap = await fetchCopyFromNotion();
      await setCachedCopy(copyMap);
    }
    return c.json({ ok: true, copy: copyMap, count: Object.keys(copyMap).length });
  } catch (err: any) {
    console.error("[website-copy] GET /ik26/copy error:", err.message);
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// GET /ik26/copy/:key — returns a single copy entry
websiteCopy.get("/:key{.+}", async (c) => {
  const key = c.req.param("key");
  try {
    let copyMap = await getCachedCopy();
    if (!copyMap) {
      copyMap = await fetchCopyFromNotion();
      await setCachedCopy(copyMap);
    }
    if (!(key in copyMap)) {
      return c.json({ ok: false, error: `Key "${key}" not found` }, 404);
    }
    return c.json({ ok: true, key, copy: copyMap[key] });
  } catch (err: any) {
    console.error(`[website-copy] GET /ik26/copy/${key} error:`, err.message);
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// POST /ik26/copy/refresh — force-clears the cache
websiteCopy.post("/refresh", async (c) => {
  try {
    await kv.del(CACHE_KEY);
    const copyMap = await fetchCopyFromNotion();
    await setCachedCopy(copyMap);
    return c.json({ ok: true, message: "Cache refreshed", count: Object.keys(copyMap).length });
  } catch (err: any) {
    console.error("[website-copy] POST /ik26/copy/refresh error:", err.message);
    return c.json({ ok: false, error: err.message }, 500);
  }
});

export { websiteCopy };
