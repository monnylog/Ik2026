import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const audit = new Hono();

// ─── Audit Trail System ────────────────────────────────────────
// Records important actions across the platform for compliance
// and operational visibility. Leadership-only read access.
// KV key pattern: ik26:audit:{timestamp}-{random}
// KV summary:     ik26:audit:summary (rolling stats)

interface AuditEntry {
  id: string;
  action: string;         // e.g. "expense.created", "profile.updated", "sync.completed"
  category: string;       // e.g. "expense", "profile", "notion", "auth", "travel", "system"
  actor: string;          // userId or system identifier
  actorName?: string;     // Display name for UI
  actorRole?: string;     // Role of actor
  target?: string;        // Resource identifier (expenseId, profileId, etc.)
  targetName?: string;    // Friendly name of target
  details?: string;       // Human-readable description
  metadata?: Record<string, any>; // Extra structured data
  severity: "info" | "warning" | "critical"; // Severity level
  timestamp: string;
}

const MAX_AUDIT_ENTRIES = 500; // Keep last 500 entries

// POST /audit/log — Record an audit event
audit.post("/make-server-5ed426e6/audit/log", async (c) => {
  try {
    const body = await c.req.json();
    const { action, category, actor, actorName, actorRole, target, targetName, details, metadata, severity } = body;

    if (!action || !category || !actor) {
      return c.json({ error: "Missing required fields: action, category, actor" }, 400);
    }

    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const entry: AuditEntry = {
      id,
      action,
      category: category || "system",
      actor,
      actorName: actorName || undefined,
      actorRole: actorRole || undefined,
      target: target || undefined,
      targetName: targetName || undefined,
      details: details || undefined,
      metadata: metadata || undefined,
      severity: severity || "info",
      timestamp: new Date().toISOString(),
    };

    await kv.set(`ik26:audit:${id}`, entry);

    // Update rolling summary
    const summary: Record<string, any> = (await kv.get("ik26:audit:summary")) || {
      totalEvents: 0,
      byCategory: {},
      bySeverity: { info: 0, warning: 0, critical: 0 },
      lastEvent: null,
      lastUpdated: null,
    };

    summary.totalEvents = (summary.totalEvents || 0) + 1;
    if (!summary.byCategory) summary.byCategory = {};
    summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
    if (!summary.bySeverity) summary.bySeverity = { info: 0, warning: 0, critical: 0 };
    summary.bySeverity[severity || "info"] = (summary.bySeverity[severity || "info"] || 0) + 1;
    summary.lastEvent = { action, category, actor: actorName || actor, timestamp: entry.timestamp };
    summary.lastUpdated = entry.timestamp;

    await kv.set("ik26:audit:summary", summary);

    return c.json({ success: true, id, timestamp: entry.timestamp });
  } catch (err) {
    console.log("Error saving audit entry:", err);
    return c.json({ error: `Failed to save audit entry: ${err}` }, 500);
  }
});

// GET /audit/log — Retrieve audit entries (paginated, filterable)
audit.get("/make-server-5ed426e6/audit/log", async (c) => {
  try {
    const category = c.req.query("category");
    const severity = c.req.query("severity");
    const actor = c.req.query("actor");
    const limit = parseInt(c.req.query("limit") || "50");
    const since = c.req.query("since"); // ISO timestamp

    let entries = await kv.getByPrefix("ik26:audit:");
    // Filter out the summary entry
    entries = entries.filter((e: any) => e && e.id && e.action);

    // Apply filters
    if (category) {
      entries = entries.filter((e: any) => e.category === category);
    }
    if (severity) {
      entries = entries.filter((e: any) => e.severity === severity);
    }
    if (actor) {
      entries = entries.filter((e: any) => e.actor === actor || e.actorName === actor);
    }
    if (since) {
      entries = entries.filter((e: any) => e.timestamp >= since);
    }

    // Sort by timestamp descending (newest first)
    entries.sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    // Paginate
    const total = entries.length;
    entries = entries.slice(0, Math.min(limit, MAX_AUDIT_ENTRIES));

    return c.json({ entries, total, returned: entries.length });
  } catch (err) {
    console.log("Error loading audit log:", err);
    return c.json({ error: `Failed to load audit log: ${err}` }, 500);
  }
});

// GET /audit/log/user/:userId — Entries for a specific user
audit.get("/make-server-5ed426e6/audit/log/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    let entries = await kv.getByPrefix("ik26:audit:");
    entries = entries
      .filter((e: any) => e && e.id && e.action && e.actor === userId)
      .sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));

    return c.json({ entries, total: entries.length });
  } catch (err) {
    console.log("Error loading user audit log:", err);
    return c.json({ error: `Failed to load user audit log: ${err}` }, 500);
  }
});

// GET /audit/summary — Rolling stats
audit.get("/make-server-5ed426e6/audit/summary", async (c) => {
  try {
    const summary = (await kv.get("ik26:audit:summary")) || {
      totalEvents: 0,
      byCategory: {},
      bySeverity: { info: 0, warning: 0, critical: 0 },
      lastEvent: null,
      lastUpdated: null,
    };

    // Compute today's events for "today" counter
    const today = new Date().toISOString().slice(0, 10);
    let entries = await kv.getByPrefix("ik26:audit:");
    entries = entries.filter((e: any) => e && e.id && e.action);
    const todayCount = entries.filter((e: any) => e.timestamp?.startsWith(today)).length;

    // Recent critical/warning events (last 5)
    const recentAlerts = entries
      .filter((e: any) => e.severity === "critical" || e.severity === "warning")
      .sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""))
      .slice(0, 5);

    return c.json({
      ...summary,
      todayCount,
      recentAlerts,
    });
  } catch (err) {
    console.log("Error loading audit summary:", err);
    return c.json({ error: `Failed to load audit summary: ${err}` }, 500);
  }
});

// DELETE /audit/log/cleanup — Remove entries older than N days (default 30)
audit.delete("/make-server-5ed426e6/audit/log/cleanup", async (c) => {
  try {
    const daysStr = c.req.query("days") || "30";
    const days = parseInt(daysStr);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    let entries = await kv.getByPrefix("ik26:audit:");
    entries = entries.filter((e: any) => e && e.id && e.action);

    const toDelete = entries.filter((e: any) => e.timestamp < cutoff);
    let deleted = 0;

    for (const entry of toDelete) {
      try {
        await kv.del(`ik26:audit:${(entry as any).id}`);
        deleted++;
      } catch { /* skip */ }
    }

    return c.json({ success: true, deleted, cutoff, daysRetained: days });
  } catch (err) {
    console.log("Error cleaning up audit log:", err);
    return c.json({ error: `Failed to clean up audit log: ${err}` }, 500);
  }
});

export { audit };
