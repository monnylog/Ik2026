// ─── Notion Write Service ───────────────────────────────────────
// Handles all PATCH operations to write data back to Notion.
// Provides a unified endpoint for updating Notion page properties.
// Auto-invalidates KV cache after successful writes.

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const notionWrite = new Hono();

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

// Helper to convert friendly property format to Notion API format
function convertToNotionProperties(properties: Record<string, any>): Record<string, any> {
  const notionProps: Record<string, any> = {};
  
  for (const [key, val] of Object.entries(properties)) {
    if (!val || typeof val !== "object") continue;
    
    const value = val as any;
    
    // Handle different property types
    if (value._type === "select" || value.type === "select") {
      notionProps[key] = { select: value.value ? { name: value.value } : null };
    } else if (value._type === "status" || value.type === "status") {
      notionProps[key] = { status: value.value ? { name: value.value } : null };
    } else if (value._type === "multi_select" || value.type === "multi_select") {
      notionProps[key] = { multi_select: (value.value || []).map((n: string) => ({ name: n })) };
    } else if (value._type === "number" || value.type === "number") {
      notionProps[key] = { number: value.value };
    } else if (value._type === "checkbox" || value.type === "checkbox") {
      notionProps[key] = { checkbox: !!value.value };
    } else if (value._type === "date" || value.type === "date") {
      notionProps[key] = { date: value.value ? { start: value.value, end: value.end || null } : null };
    } else if (value._type === "url" || value.type === "url") {
      notionProps[key] = { url: value.value || null };
    } else if (value._type === "email" || value.type === "email") {
      notionProps[key] = { email: value.value || null };
    } else if (value._type === "title" || value.type === "title") {
      notionProps[key] = { title: [{ text: { content: String(value.value || "") } }] };
    } else if (value._type === "rich_text" || value.type === "rich_text") {
      notionProps[key] = { rich_text: [{ text: { content: String(value.value || "") } }] };
    } else {
      // Default to rich_text
      notionProps[key] = { rich_text: [{ text: { content: String(value.value || "") } }] };
    }
  }
  
  return notionProps;
}

// ── PATCH /make-server-5ed426e6/notion/write/:contentType/:pageId ──
// Update a Notion page and invalidate the cache
notionWrite.patch("/make-server-5ed426e6/notion/write/:contentType/:pageId", async (c) => {
  try {
    const contentType = c.req.param("contentType");
    const pageId = c.req.param("pageId");
    
    const body = await c.req.json();
    const { properties } = body;
    
    if (!properties || typeof properties !== "object") {
      return c.json({ error: "Missing properties in request body" }, 400);
    }
    
    // Get Notion API key
    const notionKey = Deno.env.get("NOTION_API_KEY") || c.req.header("X-Notion-Key");
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured" }, 401);
    }
    
    // Convert properties to Notion format
    const notionProps = convertToNotionProperties(properties);
    
    console.log(`[notion-write] Updating ${contentType} page ${pageId}`, { notionProps });
    
    // Update Notion page
    const resp = await rateLimitedNotionFetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: notionProps }),
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      console.error(`[notion-write] Notion API error ${resp.status}:`, errText);
      return c.json({ error: `Notion API error: ${resp.status}`, details: errText }, resp.status);
    }
    
    const updated = await resp.json();
    
    // Invalidate KV cache for this content type
    const cacheKey = `ik26:notion:cache:${contentType}`;
    await kv.del(cacheKey);
    console.log(`[notion-write] Cache invalidated: ${cacheKey}`);
    
    // Log the sync
    const syncLogKey = "ik26:notion:sync-log";
    const existingLog: any[] = await kv.get(syncLogKey) || [];
    const newEntry = {
      type: contentType,
      action: "write",
      pageId,
      timestamp: new Date().toISOString(),
    };
    await kv.set(syncLogKey, [...existingLog.slice(-99), newEntry]);
    
    return c.json({
      success: true,
      message: "Saved to Notion",
      pageId: updated.id,
      lastEdited: updated.last_edited_time,
    });
  } catch (err: any) {
    console.error("[notion-write] Error:", err);
    return c.json({ error: `Failed to write to Notion: ${err.message}` }, 500);
  }
});

// ── PATCH /make-server-5ed426e6/notion/write-batch ──
// Batch update multiple pages (for bulk operations)
notionWrite.patch("/make-server-5ed426e6/notion/write-batch", async (c) => {
  try {
    const body = await c.req.json();
    const { updates } = body; // [{ contentType, pageId, properties }]
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return c.json({ error: "Missing updates array in request body" }, 400);
    }
    
    const notionKey = Deno.env.get("NOTION_API_KEY") || c.req.header("X-Notion-Key");
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured" }, 401);
    }
    
    const results = [];
    const affectedTypes = new Set<string>();
    
    for (const update of updates) {
      const { contentType, pageId, properties } = update;
      
      try {
        const notionProps = convertToNotionProperties(properties);
        
        const resp = await rateLimitedNotionFetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ properties: notionProps }),
        });
        
        if (resp.ok) {
          results.push({ pageId, success: true });
          affectedTypes.add(contentType);
        } else {
          const errText = await resp.text();
          results.push({ pageId, success: false, error: errText });
        }
      } catch (err: any) {
        results.push({ pageId, success: false, error: err.message });
      }
    }
    
    // Invalidate caches for all affected types
    for (const type of affectedTypes) {
      await kv.del(`ik26:notion:cache:${type}`);
    }
    
    const successCount = results.filter((r) => r.success).length;
    
    return c.json({
      success: successCount === results.length,
      message: `${successCount}/${results.length} updates succeeded`,
      results,
    });
  } catch (err: any) {
    console.error("[notion-write] Batch error:", err);
    return c.json({ error: `Batch write failed: ${err.message}` }, 500);
  }
});

export default notionWrite;
