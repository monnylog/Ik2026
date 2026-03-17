import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const studio = new Hono();

// ─── Browse KV keys by prefix ───────────────────────────────────
// Returns keys + values for a given prefix, with optional pagination
studio.get("/make-server-5ed426e6/content-studio/browse", async (c) => {
  try {
    const prefix = c.req.query("prefix") || "ik26:";
    const items = await kv.getByPrefix(prefix);
    const all = (items || []).filter(Boolean);

    // Attach the key patterns discovered
    const keySummary: Record<string, number> = {};
    for (const item of all) {
      const raw = item as any;
      // Try to infer key pattern from the data
      const type = raw._kvType || raw.id || "unknown";
      const prefix2 = typeof type === "string" ? type.split(":").slice(0, 3).join(":") : "unknown";
      keySummary[prefix2] = (keySummary[prefix2] || 0) + 1;
    }

    return c.json({
      prefix,
      count: all.length,
      items: all.slice(0, 200), // Limit to 200 items per request
      keySummary,
    });
  } catch (err) {
    console.log("Content Studio browse error:", err);
    return c.json({ error: `Browse failed: ${err}` }, 500);
  }
});

// ─── Get all KV key prefixes (content registry) ─────────────────
// Returns a summary of all known content types stored in KV
studio.get("/make-server-5ed426e6/content-studio/registry", async (c) => {
  try {
    const prefixes = [
      { prefix: "ik26:profile:", label: "User Profiles", icon: "users", category: "auth" },
      { prefix: "ik26:expense:", label: "Expenses", icon: "receipt", category: "finance" },
      { prefix: "ik26:msg:", label: "Chat Messages", icon: "message-circle", category: "engagement" },
      { prefix: "ik26:memory-wall:", label: "Memory Wall", icon: "image", category: "engagement" },
      { prefix: "ik26:flavor-fusion:", label: "Flavor Fusion", icon: "utensils", category: "engagement" },
      { prefix: "ik26:voice:", label: "Voice Notes", icon: "mic", category: "engagement" },
      { prefix: "ik26:prompt-resp:", label: "Daily Prompts", icon: "sparkles", category: "engagement" },
      { prefix: "ik26:portal-inquiry:", label: "Portal Inquiries", icon: "inbox", category: "portal" },
      { prefix: "ik26:analytics:", label: "Analytics Events", icon: "bar-chart", category: "analytics" },
      { prefix: "ik26:notion:cache:", label: "Notion Cache", icon: "database", category: "notion" },
      { prefix: "ik26:logo:", label: "Logo Cache", icon: "image", category: "cache" },
      { prefix: "ik26:user-data:", label: "User Data", icon: "folder", category: "user" },
      { prefix: "ik26:taskboard:", label: "Task Board", icon: "kanban", category: "planning" },
      { prefix: "ik26:code-users:", label: "Access Codes", icon: "key", category: "auth" },
      { prefix: "ik26:creds:", label: "Credentials", icon: "lock", category: "auth", sensitive: true },
    ];

    const registry = [];
    for (const p of prefixes) {
      try {
        const items = await kv.getByPrefix(p.prefix);
        const count = (items || []).filter(Boolean).length;
        registry.push({ ...p, count });
      } catch {
        registry.push({ ...p, count: 0 });
      }
    }

    // Also get singleton keys
    const singletons = [
      { key: "ik26:notion:config", label: "Notion Config", icon: "settings", category: "config" },
      { key: "ik26:notion:sync-log", label: "Sync Log", icon: "scroll", category: "config" },
      { key: "ik26:config:form-urls", label: "Form URLs", icon: "link", category: "config" },
      { key: "ik26:notion:tasks-db-id", label: "Tasks DB ID", icon: "database", category: "config" },
      { key: "ik26:notion:task-sync", label: "Task Sync Meta", icon: "refresh-cw", category: "config" },
      { key: "ik26:notion:task-map", label: "Task Map", icon: "map", category: "config" },
      { key: "ik26:taskboard:tasks", label: "Task Board Data", icon: "list-checks", category: "planning" },
      { key: "ik26:notion:ik26-path", label: "IK26 Path Cache", icon: "route", category: "notion" },
    ];

    const singletonResults = [];
    for (const s of singletons) {
      try {
        const val = await kv.get(s.key);
        singletonResults.push({
          ...s,
          exists: val !== null && val !== undefined,
          preview: val ? (typeof val === "object" ? `${Object.keys(val).length} fields` : String(val).slice(0, 50)) : null,
        });
      } catch {
        singletonResults.push({ ...s, exists: false, preview: null });
      }
    }

    return c.json({ registry, singletons: singletonResults });
  } catch (err) {
    console.log("Content Studio registry error:", err);
    return c.json({ error: `Registry failed: ${err}` }, 500);
  }
});

// ─── Get a single KV entry by full key ──────────────────────────
studio.get("/make-server-5ed426e6/content-studio/entry", async (c) => {
  try {
    const key = c.req.query("key");
    if (!key) return c.json({ error: "Missing key parameter" }, 400);

    // Block sensitive keys
    if (key.startsWith("ik26:creds:")) {
      return c.json({ error: "Cannot read credential entries for security reasons" }, 403);
    }

    const value = await kv.get(key);
    if (value === null || value === undefined) {
      return c.json({ error: "Key not found", key }, 404);
    }

    return c.json({ key, value, type: typeof value });
  } catch (err) {
    console.log("Content Studio entry read error:", err);
    return c.json({ error: `Read failed: ${err}` }, 500);
  }
});

// ─── Update a single KV entry ───────────────────────────────────
studio.put("/make-server-5ed426e6/content-studio/entry", async (c) => {
  try {
    const { key, value } = await c.req.json();
    if (!key) return c.json({ error: "Missing key" }, 400);
    if (value === undefined) return c.json({ error: "Missing value" }, 400);

    // Block sensitive keys
    if (key.startsWith("ik26:creds:")) {
      return c.json({ error: "Cannot modify credential entries for security reasons" }, 403);
    }

    await kv.set(key, value);
    console.log(`Content Studio: updated key ${key}`);
    return c.json({ success: true, key });
  } catch (err) {
    console.log("Content Studio entry update error:", err);
    return c.json({ error: `Update failed: ${err}` }, 500);
  }
});

// ─── Delete a single KV entry ───────────────────────────────────
studio.delete("/make-server-5ed426e6/content-studio/entry", async (c) => {
  try {
    const key = c.req.query("key");
    if (!key) return c.json({ error: "Missing key parameter" }, 400);

    // Block sensitive keys
    if (key.startsWith("ik26:creds:")) {
      return c.json({ error: "Cannot delete credential entries for security reasons" }, 403);
    }

    await kv.del(key);
    console.log(`Content Studio: deleted key ${key}`);
    return c.json({ success: true, key });
  } catch (err) {
    console.log("Content Studio entry delete error:", err);
    return c.json({ error: `Delete failed: ${err}` }, 500);
  }
});

// ─── Bulk browse with full keys ─────────────────────────────────
// Returns items with their actual KV keys reconstructed
studio.get("/make-server-5ed426e6/content-studio/browse-with-keys", async (c) => {
  try {
    const prefix = c.req.query("prefix") || "ik26:";
    const items = await kv.getByPrefix(prefix);
    const all = (items || []).filter(Boolean);

    // Reconstruct keys from item data
    const enriched = all.map((item: any, idx: number) => {
      // Try to determine the key from known patterns
      let inferredKey = `${prefix}${idx}`;
      if (item.id) inferredKey = `${prefix}${item.id}`;
      else if (item.key) inferredKey = item.key;

      return {
        _inferredKey: inferredKey,
        _preview: getPreview(item),
        ...item,
      };
    });

    return c.json({
      prefix,
      count: enriched.length,
      items: enriched.slice(0, 200),
    });
  } catch (err) {
    console.log("Content Studio browse-with-keys error:", err);
    return c.json({ error: `Browse failed: ${err}` }, 500);
  }
});

function getPreview(item: any): string {
  if (!item || typeof item !== "object") return String(item).slice(0, 80);
  // Pick the most descriptive field
  for (const field of ["displayName", "name", "milestone", "title", "action", "event", "message", "email"]) {
    if (item[field]) return String(item[field]).slice(0, 80);
  }
  return `${Object.keys(item).length} fields`;
}

// ─── Quick stats for dashboard widget ───────────────────────────
studio.get("/make-server-5ed426e6/content-studio/stats", async (c) => {
  try {
    const [profiles, expenses, inquiries, analytics, notionConfig] = await Promise.all([
      kv.getByPrefix("ik26:profile:").then((r: any) => (r || []).filter(Boolean).length).catch(() => 0),
      kv.getByPrefix("ik26:expense:").then((r: any) => (r || []).filter(Boolean).length).catch(() => 0),
      kv.getByPrefix("ik26:portal-inquiry:").then((r: any) => (r || []).filter(Boolean).length).catch(() => 0),
      kv.getByPrefix("ik26:analytics:").then((r: any) => (r || []).filter(Boolean).length).catch(() => 0),
      kv.get("ik26:notion:config").catch(() => null),
    ]);

    const notionTypes = notionConfig ? Object.keys(notionConfig).filter((k: string) => (notionConfig as any)[k]?.databaseId).length : 0;

    return c.json({
      profiles,
      expenses,
      inquiries,
      analytics,
      notionTypes,
      totalKvEntries: profiles + expenses + inquiries + analytics,
    });
  } catch (err) {
    console.log("Content Studio stats error:", err);
    return c.json({ error: `Stats failed: ${err}` }, 500);
  }
});

export { studio };
