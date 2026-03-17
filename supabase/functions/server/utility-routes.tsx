// ─── Utility Routes (Media, Calendar, Portal, Analytics) ───────
// Consolidated from media-routes, calendar-routes, portal-analytics-routes
// in v3.2.1 to reduce cold-start module count and fix WORKER_LIMIT.

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

export const utility = new Hono();

export const PHOTO_BUCKET = "make-5ed426e6-photos";

// ─── Lazy Supabase client (created on first use, not on import) ──
let _adminClient: any = null;
function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );
  }
  return _adminClient;
}

// ─── Lazy bucket creation (on first upload, not on import) ──────
let _photoBucketReady = false;
async function ensurePhotoBucket() {
  if (_photoBucketReady) return;
  try {
    const admin = getAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === PHOTO_BUCKET);
    if (!exists) {
      await admin.storage.createBucket(PHOTO_BUCKET, { public: false });
      console.log(`Created storage bucket: ${PHOTO_BUCKET}`);
    }
    _photoBucketReady = true;
  } catch (err) {
    console.log("Error ensuring photo bucket:", err);
  }
}

// ═══════════════════════════════════════════════════════════════════
// PHOTO UPLOAD
// ═══════════════════════════════════════════════════════════════════

utility.post("/make-server-5ed426e6/upload-photo/:userId", async (c) => {
  try {
    await ensurePhotoBucket();
    const userId = c.req.param("userId");
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, 400);
    }
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: "File too large. Max 2MB." }, 400);
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `chef-photos/${userId}.${ext}`;
    const admin = getAdminClient();

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(filePath, arrayBuffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.log("Upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    const { data: signedData, error: signedError } = await admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedError) {
      return c.json({ error: `Failed to create signed URL: ${signedError.message}` }, 500);
    }

    const existing = await kv.get(`ik26:profile:${userId}`);
    if (existing) {
      existing.customPhotoUrl = signedData.signedUrl;
      existing.lastActive = new Date().toISOString();
      await kv.set(`ik26:profile:${userId}`, existing);
    }

    return c.json({ url: signedData.signedUrl, profile: existing || null });
  } catch (err) {
    console.log("Photo upload error:", err);
    return c.json({ error: `Photo upload failed: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// CLEARBIT LOGO PROXY (with KV caching)
// ═══════════════════════════════════════════════════════════════════

const LOGO_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

utility.get("/make-server-5ed426e6/logo/:domain", async (c) => {
  const domain = c.req.param("domain");
  if (!domain || domain.length < 3) {
    return c.json({ error: "Invalid domain" }, 400);
  }

  const cacheKey = `ik26:logo:${domain.toLowerCase()}`;
  try {
    const cached: any = await kv.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < LOGO_CACHE_TTL) {
      return c.json({ url: cached.notFound ? null : cached.url, cached: true });
    }
  } catch { /* ignore */ }

  try {
    const clearbitUrl = `https://logo.clearbit.com/${domain}?size=128`;
    const resp = await fetch(clearbitUrl, { redirect: "follow" });
    if (resp.ok && resp.headers.get("content-type")?.includes("image")) {
      await kv.set(cacheKey, { url: clearbitUrl, cachedAt: Date.now() });
      return c.json({ url: clearbitUrl, cached: false });
    } else {
      await kv.set(cacheKey, { notFound: true, cachedAt: Date.now() });
      return c.json({ url: null, cached: false });
    }
  } catch (err: any) {
    return c.json({ url: null, error: err.message }, 200);
  }
});

utility.post("/make-server-5ed426e6/logos/batch", async (c) => {
  try {
    const { domains } = await c.req.json();
    if (!Array.isArray(domains) || domains.length === 0) {
      return c.json({ error: "domains array required" }, 400);
    }

    const results: Record<string, string | null> = {};
    const uncached: string[] = [];

    for (const domain of domains.slice(0, 20)) {
      const d = domain.toLowerCase();
      try {
        const cached: any = await kv.get(`ik26:logo:${d}`);
        if (cached && Date.now() - cached.cachedAt < LOGO_CACHE_TTL) {
          results[d] = cached.notFound ? null : cached.url;
        } else { uncached.push(d); }
      } catch { uncached.push(d); }
    }

    for (const domain of uncached) {
      try {
        const clearbitUrl = `https://logo.clearbit.com/${domain}?size=128`;
        const resp = await fetch(clearbitUrl, { redirect: "follow" });
        if (resp.ok && resp.headers.get("content-type")?.includes("image")) {
          results[domain] = clearbitUrl;
          await kv.set(`ik26:logo:${domain}`, { url: clearbitUrl, cachedAt: Date.now() });
        } else {
          results[domain] = null;
          await kv.set(`ik26:logo:${domain}`, { notFound: true, cachedAt: Date.now() });
        }
        if (uncached.indexOf(domain) < uncached.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch { results[domain] = null; }
    }

    return c.json({ logos: results, cached: domains.length - uncached.length, fetched: uncached.length });
  } catch (err) {
    return c.json({ error: `Batch logo lookup failed: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR DEEP LINKS
// ═══════════════════════════════════════════════════════════════════

function formatGCalDate(dateStr: string, isAllDay: boolean): string {
  const d = new Date(dateStr);
  if (isAllDay) return d.toISOString().replace(/[-:]/g, "").split("T")[0];
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

utility.post("/make-server-5ed426e6/calendar/create-link", async (c) => {
  try {
    const { title, description, location, startDate, endDate, allDay } = await c.req.json();
    if (!title || !startDate) {
      return c.json({ error: "Missing required: title, startDate" }, 400);
    }

    const start = formatGCalDate(startDate, !!allDay);
    const end = endDate
      ? formatGCalDate(endDate, !!allDay)
      : allDay
        ? formatGCalDate(new Date(new Date(startDate).getTime() + 86400000).toISOString(), true)
        : formatGCalDate(new Date(new Date(startDate).getTime() + 3600000).toISOString(), false);

    const params = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${start}/${end}` });
    if (description) params.set("details", description);
    if (location) params.set("location", location);

    return c.json({ url: `https://calendar.google.com/calendar/render?${params.toString()}` });
  } catch (err) {
    return c.json({ error: `Failed to create calendar link: ${err}` }, 500);
  }
});

utility.post("/make-server-5ed426e6/calendar/batch-links", async (c) => {
  try {
    const { events } = await c.req.json();
    if (!Array.isArray(events)) {
      return c.json({ error: "events array required" }, 400);
    }

    const links = events.map((evt: any) => {
      const start = formatGCalDate(evt.startDate, !!evt.allDay);
      const end = evt.endDate
        ? formatGCalDate(evt.endDate, !!evt.allDay)
        : evt.allDay
          ? formatGCalDate(new Date(new Date(evt.startDate).getTime() + 86400000).toISOString(), true)
          : formatGCalDate(new Date(new Date(evt.startDate).getTime() + 3600000).toISOString(), false);

      const params = new URLSearchParams({
        action: "TEMPLATE", text: evt.title || "IK26 Event", dates: `${start}/${end}`,
      });
      if (evt.description) params.set("details", evt.description);
      if (evt.location) params.set("location", evt.location || "Isang Kusina 2026 Venue");

      return { id: evt.id, title: evt.title, url: `https://calendar.google.com/calendar/render?${params.toString()}` };
    });

    return c.json({ links });
  } catch (err) {
    return c.json({ error: `Failed: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// PORTAL INQUIRIES (with in-memory caching)
// ═══════════════════════════════════════════════════════════════════

interface MemCache<T> { data: T; ts: number; }
const MEM_TTL = 30_000; // 30 seconds
let _inquiryCache: MemCache<any[]> | null = null;

async function getCachedInquiries(): Promise<any[]> {
  const now = Date.now();
  if (_inquiryCache && now - _inquiryCache.ts < MEM_TTL) {
    return _inquiryCache.data;
  }
  const inquiries = await kv.getByPrefix("ik26:portal-inquiry:");
  const valid = (inquiries || []).filter(Boolean);
  _inquiryCache = { data: valid, ts: now };
  return valid;
}

function invalidateInquiryCache() { _inquiryCache = null; }

utility.post("/make-server-5ed426e6/portal-inquiry", async (c) => {
  try {
    const { name, email, organization, inquiryType, message } = await c.req.json();
    if (!name || !email || !message) {
      return c.json({ error: "Missing required fields: name, email, message" }, 400);
    }

    const id = crypto.randomUUID().slice(0, 12);
    const inquiry = {
      id, name, email,
      organization: organization || "",
      inquiryType: inquiryType || "General Question",
      message,
      timestamp: new Date().toISOString(),
      status: "new",
    };

    await kv.set(`ik26:portal-inquiry:${id}`, inquiry);
    invalidateInquiryCache();
    console.log(`Portal inquiry saved: ${id} from ${name} (${inquiryType})`);
    return c.json({ success: true, id });
  } catch (err) {
    return c.json({ error: `Failed to save inquiry: ${err}` }, 500);
  }
});

utility.get("/make-server-5ed426e6/portal-inquiries", async (c) => {
  try {
    const all = await getCachedInquiries();
    const sorted = [...all].sort(
      (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return c.json({ inquiries: sorted });
  } catch (err) {
    return c.json({ error: `Failed to load inquiries: ${err}` }, 500);
  }
});

utility.put("/make-server-5ed426e6/portal-inquiry/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();
    if (!status || !["new", "reviewed", "archived"].includes(status)) {
      return c.json({ error: "Invalid status. Must be: new, reviewed, or archived" }, 400);
    }

    const inquiry = await kv.get(`ik26:portal-inquiry:${id}`);
    if (!inquiry) return c.json({ error: "Inquiry not found" }, 404);

    (inquiry as any).status = status;
    (inquiry as any).statusUpdatedAt = new Date().toISOString();
    await kv.set(`ik26:portal-inquiry:${id}`, inquiry);
    invalidateInquiryCache();
    return c.json({ success: true, inquiry });
  } catch (err) {
    return c.json({ error: `Failed to update inquiry status: ${err}` }, 500);
  }
});

utility.get("/make-server-5ed426e6/portal-inquiries/count", async (c) => {
  try {
    const all = await getCachedInquiries();
    const newCount = all.filter((i: any) => i.status === "new").length;
    return c.json({ total: all.length, new: newCount });
  } catch (err) {
    return c.json({ error: `Failed to count inquiries: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// SHARE ANALYTICS
// ═══════════════════════════════════════════════════════════════════

utility.post("/make-server-5ed426e6/analytics/event", async (c) => {
  try {
    const { event, data } = await c.req.json();
    if (!event) return c.json({ error: "Missing event name" }, 400);

    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    await kv.set(`ik26:analytics:${id}`, {
      id, event, data: data || {},
      timestamp: new Date().toISOString(),
      userAgent: c.req.header("user-agent") || "unknown",
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: `Failed to track event: ${err}` }, 500);
  }
});

utility.get("/make-server-5ed426e6/analytics/summary", async (c) => {
  try {
    const events = await kv.getByPrefix("ik26:analytics:");
    const all = (events || []).filter(Boolean);

    const byEvent: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const recentEvents: any[] = [];

    for (const e of all) {
      const ev = e as any;
      byEvent[ev.event] = (byEvent[ev.event] || 0) + 1;
      const day = ev.timestamp?.slice(0, 10) || "unknown";
      byDay[day] = (byDay[day] || 0) + 1;
      recentEvents.push({ event: ev.event, data: ev.data, timestamp: ev.timestamp });
    }
    recentEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ total: all.length, byEvent, byDay, recent: recentEvents.slice(0, 20) });
  } catch (err) {
    return c.json({ error: `Failed to load analytics: ${err}` }, 500);
  }
});

// ─── Chef Journey Milestones (KV-backed, Content Studio editable) ───

// GET all chef journey data
utility.get("/make-server-5ed426e6/chef-journey/milestones", async (c) => {
  try {
    const data = await kv.getByPrefix("ik26:chef-journey:");
    const result: Record<string, any> = {};
    for (const item of (data || [])) {
      const entry = item as any;
      if (entry?.chefId) result[entry.chefId] = entry;
    }
    return c.json({ milestones: result });
  } catch (err) {
    return c.json({ error: `Failed to load chef journey milestones: ${err}` }, 500);
  }
});

// PUT update a single chef's milestone data
utility.put("/make-server-5ed426e6/chef-journey/milestones/:chefId", async (c) => {
  try {
    const chefId = c.req.param("chefId");
    const body = await c.req.json();
    const payload = {
      chefId,
      milestones: body.milestones || [],
      updatedAt: new Date().toISOString(),
      ...(body.dishStatus ? { dishStatus: body.dishStatus } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
    };
    await kv.set(`ik26:chef-journey:${chefId}`, payload);
    return c.json({ success: true, data: payload });
  } catch (err) {
    return c.json({ error: `Failed to update chef journey milestone: ${err}` }, 500);
  }
});