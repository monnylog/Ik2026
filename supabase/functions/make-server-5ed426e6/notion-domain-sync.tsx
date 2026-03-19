// ─── IK2026 Domain-Typed Notion Sync ─────────────────────────────
// Typed, per-entity sync for chef profiles, courses, journey progress,
// and event schedule. Layered on top of notion-content-routes.tsx —
// same KV storage, same Notion key resolution, same rate limiter.
//
// KV keys:
//   ik26:notion:chef:{chefId}   → ChefSyncRecord
//   ik26:notion:courses         → { data: CourseItem[], cachedAt }
//   ik26:notion:schedule        → { data: ScheduleEntry[], cachedAt }

import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import {
  resolveNotionKeyFromHeader,
  rateLimitedNotionFetch,
  extractAllProperties,
} from "./notion-content-routes.tsx";

const notionDomainSync = new Hono();

// ─── Chef Roster (canonical, matches ik26-notion-config.ts) ──────

interface ChefRosterEntry {
  chefId: string;
  name: string;
  notionPageId: string;
  courseNumber: number | null;
  isIstoryaRoots: boolean;
}

const CHEF_ROSTER: ChefRosterEntry[] = [
  { chefId: "rachel",    name: "Rachel Barril",        notionPageId: "326dc6047d2d81f5b384c9af6b0d3d7a", courseNumber: 1,    isIstoryaRoots: false },
  { chefId: "aaron",     name: "Aaron Verzosa",         notionPageId: "326dc6047d2d8156889ae7e29f599c40", courseNumber: 2,    isIstoryaRoots: false },
  { chefId: "maynard",   name: "Lord Maynard Llera",    notionPageId: "326dc6047d2d812f88c9d388be824d31", courseNumber: 3,    isIstoryaRoots: false },
  { chefId: "christina", name: "Christina Quackenbush", notionPageId: "326dc6047d2d817b9e6fffb8552df441", courseNumber: 4,    isIstoryaRoots: false },
  { chefId: "patrice",   name: "Patrice Cleary",        notionPageId: "326dc6047d2d817aaec4ff0c123b5d55", courseNumber: 5,    isIstoryaRoots: false },
  { chefId: "justin",    name: "Justin Barnes",         notionPageId: "326dc6047d2d810f980ad69d103f98d2", courseNumber: null, isIstoryaRoots: true  },
  { chefId: "dio",       name: "Dio Buan",              notionPageId: "326dc6047d2d81719155e5bc75339f3b", courseNumber: null, isIstoryaRoots: true  },
];

const CHEF_CACHE_TTL_MS = 5 * 60 * 1000;   // 5 min
const SCHEDULE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

// ─── Domain Types ────────────────────────────────────────────────

export interface ChefSyncRecord {
  chefId: string;
  notionPageId: string;
  fullName: string;
  courseNumber: number | null;
  isIstoryaRoots: boolean;
  city: string;
  restaurant: string;
  bio: string;
  instagram: string;
  headshotUrl: string;
  status: string;
  dishConcept: string;
  historicalAnchor: string;
  dietaryFlags: string[];
  travelNotes: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
  milestone4: string;
  lastSyncedAt: string;
  _notionLastEdited: string | null;
}

export interface CourseItem {
  courseNumber: number | null;
  chefId: string;
  chefName: string;
  dishConcept: string;
  historicalAnchor: string;
  dietaryFlags: string[];
  pairing: string;
  status: string;
  notionPageId: string;
}

export interface ScheduleEntry {
  id: string;
  time: string;
  endTime: string | null;
  activity: string;
  location: string;
  owner: string;
  category: string;
  notes: string;
  status: string;
  isKeyMoment: boolean;
}

export interface JourneyProgress {
  chefId: string;
  chefName: string;
  courseNumber: number | null;
  isIstoryaRoots: boolean;
  status: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
  milestone4: string;
  completedCount: number;
  inProgressCount: number;
  overallProgress: number;
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

async function fetchNotionPage(pageId: string, notionKey: string): Promise<Record<string, any> | null> {
  const resp = await rateLimitedNotionFetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${notionKey}`,
      "Notion-Version": "2022-06-28",
    },
  });
  if (!resp.ok) {
    console.log(`fetchNotionPage ${pageId}: ${resp.status} ${await resp.text()}`);
    return null;
  }
  return resp.json();
}

function pageToChefRecord(
  page: Record<string, any>,
  entry: ChefRosterEntry,
  existingKvProfile?: any,
): ChefSyncRecord {
  const props = extractAllProperties(page);
  const existing = existingKvProfile || {};

  const str = (...keys: string[]): string => {
    for (const k of keys) {
      if (typeof props[k] === "string" && props[k].trim()) return props[k].trim();
    }
    return "";
  };

  const arr = (...keys: string[]): string[] => {
    for (const k of keys) {
      if (Array.isArray(props[k])) return props[k];
    }
    return [];
  };

  const ms = (n: number): string =>
    str(`Milestone ${n}`, `Milestone${n}`) || "Not started";

  return {
    chefId: entry.chefId,
    notionPageId: entry.notionPageId,
    fullName: str("Name", "Chef Name") || entry.name,
    courseNumber: entry.courseNumber,
    isIstoryaRoots: entry.isIstoryaRoots,
    city: str("City") || existing.city || "",
    restaurant: str("Restaurant") || existing.restaurant || "",
    bio: str("Bio", "About") || existing.bio || "",
    instagram: str("Instagram", "IG", "Social") || existing.instagram || "",
    headshotUrl: str("Headshot", "Photo", "Image URL") || existing.headshotUrl || "",
    status: str("Status") || "Invited",
    dishConcept: str("Dish Concept", "Dish") || "",
    historicalAnchor: str("Historical Anchor", "Anchor") || "",
    dietaryFlags: arr("Dietary Flags", "Dietary", "Flags"),
    travelNotes: str("Travel Notes", "Travel") || "",
    milestone1: ms(1),
    milestone2: ms(2),
    milestone3: ms(3),
    milestone4: ms(4),
    lastSyncedAt: new Date().toISOString(),
    _notionLastEdited: page.last_edited_time || null,
  };
}

function computeJourneyProgress(record: ChefSyncRecord): JourneyProgress {
  const milestones = [record.milestone1, record.milestone2, record.milestone3, record.milestone4];
  const completedCount = milestones.filter((m) => m === "Complete").length;
  const inProgressCount = milestones.filter((m) => m === "In progress").length;
  return {
    chefId: record.chefId,
    chefName: record.fullName,
    courseNumber: record.courseNumber,
    isIstoryaRoots: record.isIstoryaRoots,
    status: record.status,
    milestone1: record.milestone1,
    milestone2: record.milestone2,
    milestone3: record.milestone3,
    milestone4: record.milestone4,
    completedCount,
    inProgressCount,
    overallProgress: Math.round((completedCount / 4) * 100),
    lastUpdated: record.lastSyncedAt,
  };
}

function chefRecordToCourseItem(r: ChefSyncRecord): CourseItem {
  return {
    courseNumber: r.courseNumber,
    chefId: r.chefId,
    chefName: r.fullName,
    dishConcept: r.dishConcept,
    historicalAnchor: r.historicalAnchor,
    dietaryFlags: r.dietaryFlags,
    pairing: "",
    status: r.status,
    notionPageId: r.notionPageId,
  };
}

function rawToScheduleEntry(raw: Record<string, any>): ScheduleEntry {
  const str = (...keys: string[]): string => {
    for (const k of keys) {
      if (typeof raw[k] === "string" && raw[k].trim()) return raw[k].trim();
    }
    return "";
  };
  return {
    id: raw._notionId || "",
    time: str("Time", "Start Time", "Start", "Time Slot"),
    endTime: raw["End Time"] || raw["End"] || null,
    activity: str("Activity", "Name", "Event", "Item"),
    location: str("Location", "Venue", "Area", "Space"),
    owner: str("Owner", "Lead", "Responsible", "POC"),
    category: str("Category", "Type", "Section"),
    notes: str("Notes", "Details", "Description"),
    status: str("Status") || "Scheduled",
    isKeyMoment: !!(raw["Key Moment"] || raw["Highlight"] || raw["Keynote"] || false),
  };
}

async function syncChef(entry: ChefRosterEntry, notionKey: string): Promise<ChefSyncRecord | null> {
  const page = await fetchNotionPage(entry.notionPageId, notionKey);
  if (!page) return null;
  const existing = await kv.get(`ik26:chef-profile:${entry.chefId}`);
  const record = pageToChefRecord(page, entry, existing);
  await kv.set(`ik26:notion:chef:${entry.chefId}`, record);
  return record;
}

function isStale(record: ChefSyncRecord): boolean {
  return Date.now() - new Date(record.lastSyncedAt).getTime() > CHEF_CACHE_TTL_MS;
}

// ─── Routes: Chef Profiles ────────────────────────────────────────

// GET all chefs — serves from cache, syncs from Notion if stale/missing
notionDomainSync.get("/make-server-5ed426e6/notion/sync/chefs", async (c) => {
  const forceRefresh = c.req.query("force") === "true";

  if (!forceRefresh) {
    const cached = await Promise.all(CHEF_ROSTER.map((e) => kv.get(`ik26:notion:chef:${e.chefId}`)));
    const allPresent = cached.every(Boolean);
    if (allPresent && (cached as ChefSyncRecord[]).every((r) => !isStale(r))) {
      return c.json({ chefs: cached, cached: true, count: cached.length });
    }
  }

  const notionKey = resolveNotionKeyFromHeader(c);
  if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);

  const records: ChefSyncRecord[] = [];
  const results: any[] = [];

  for (const entry of CHEF_ROSTER) {
    try {
      const record = await syncChef(entry, notionKey);
      if (record) { records.push(record); results.push({ chefId: entry.chefId, success: true }); }
      else results.push({ chefId: entry.chefId, success: false, error: "Page returned null" });
    } catch (err: any) {
      results.push({ chefId: entry.chefId, success: false, error: err.message });
    }
  }

  return c.json({ chefs: records, results, cached: false, count: records.length, syncedAt: new Date().toISOString() });
});

// GET single chef — cache hit or fresh Notion fetch
notionDomainSync.get("/make-server-5ed426e6/notion/sync/chef/:chefId", async (c) => {
  const chefId = c.req.param("chefId");
  const entry = CHEF_ROSTER.find((e) => e.chefId === chefId);
  if (!entry) return c.json({ error: `Unknown chefId: ${chefId}` }, 404);

  const forceRefresh = c.req.query("force") === "true";
  if (!forceRefresh) {
    const cached = await kv.get(`ik26:notion:chef:${chefId}`);
    if (cached && !isStale(cached as ChefSyncRecord)) return c.json({ chef: cached, cached: true });
  }

  const notionKey = resolveNotionKeyFromHeader(c);
  if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);

  const record = await syncChef(entry, notionKey);
  if (!record) return c.json({ error: "Failed to fetch chef from Notion" }, 500);
  return c.json({ chef: record, cached: false });
});

// PUT milestone update → Notion + invalidate cache
notionDomainSync.put("/make-server-5ed426e6/notion/sync/chef/:chefId/milestone", async (c) => {
  const chefId = c.req.param("chefId");
  const entry = CHEF_ROSTER.find((e) => e.chefId === chefId);
  if (!entry) return c.json({ error: `Unknown chefId: ${chefId}` }, 404);

  const notionKey = resolveNotionKeyFromHeader(c);
  if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);

  const { milestone, status } = await c.req.json();
  if (![1, 2, 3, 4].includes(milestone)) return c.json({ error: "milestone must be 1–4" }, 400);
  if (!["Not started", "In progress", "Complete"].includes(status)) {
    return c.json({ error: "status must be: Not started | In progress | Complete" }, 400);
  }

  const resp = await rateLimitedNotionFetch(`https://api.notion.com/v1/pages/${entry.notionPageId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${notionKey}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify({ properties: { [`Milestone ${milestone}`]: { select: { name: status } } } }),
  });

  if (!resp.ok) return c.json({ error: `Notion update failed: ${await resp.text()}` }, 500);

  await kv.del(`ik26:notion:chef:${chefId}`);
  return c.json({ success: true, chefId, milestone, status });
});

// PUT status update → Notion + invalidate cache
notionDomainSync.put("/make-server-5ed426e6/notion/sync/chef/:chefId/status", async (c) => {
  const chefId = c.req.param("chefId");
  const entry = CHEF_ROSTER.find((e) => e.chefId === chefId);
  if (!entry) return c.json({ error: `Unknown chefId: ${chefId}` }, 404);

  const notionKey = resolveNotionKeyFromHeader(c);
  if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);

  const { status } = await c.req.json();
  const valid = ["Invited", "Confirmed", "In R&D", "Dish Finalized", "Event Ready"];
  if (!valid.includes(status)) return c.json({ error: `status must be one of: ${valid.join(", ")}` }, 400);

  const resp = await rateLimitedNotionFetch(`https://api.notion.com/v1/pages/${entry.notionPageId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${notionKey}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify({ properties: { Status: { select: { name: status } } } }),
  });

  if (!resp.ok) return c.json({ error: `Notion update failed: ${await resp.text()}` }, 500);

  await kv.del(`ik26:notion:chef:${chefId}`);
  return c.json({ success: true, chefId, status });
});

// ─── Routes: Courses ─────────────────────────────────────────────

// GET course lineup — derived from chef profiles (no extra Notion calls if already synced)
notionDomainSync.get("/make-server-5ed426e6/notion/sync/courses", async (c) => {
  const forceRefresh = c.req.query("force") === "true";

  if (!forceRefresh) {
    const cached: any = await kv.get("ik26:notion:courses");
    if (cached && Date.now() - cached.cachedAt < CHEF_CACHE_TTL_MS) {
      return c.json({ courses: cached.data, cached: true, count: cached.data.length });
    }
  }

  const courseEntries = CHEF_ROSTER.filter((e) => !e.isIstoryaRoots);
  let chefRecords = (await Promise.all(courseEntries.map((e) => kv.get(`ik26:notion:chef:${e.chefId}`)))).filter(Boolean) as ChefSyncRecord[];

  // If any chefs are missing from cache and we have a key, sync them
  if (chefRecords.length < courseEntries.length) {
    const notionKey = resolveNotionKeyFromHeader(c);
    if (notionKey) {
      const missing = courseEntries.filter((e) => !chefRecords.find((r) => r.chefId === e.chefId));
      const fresh = (await Promise.all(missing.map((e) => syncChef(e, notionKey).catch(() => null)))).filter(Boolean) as ChefSyncRecord[];
      chefRecords = [...chefRecords, ...fresh];
    }
  }

  const courses = chefRecords
    .map(chefRecordToCourseItem)
    .sort((a, b) => (a.courseNumber ?? 99) - (b.courseNumber ?? 99));

  await kv.set("ik26:notion:courses", { data: courses, cachedAt: Date.now() });
  return c.json({ courses, cached: false, count: courses.length });
});

// ─── Routes: Journey Progress ─────────────────────────────────────

// GET all chefs' milestone progress
notionDomainSync.get("/make-server-5ed426e6/notion/sync/journey", async (c) => {
  const chefRecords = (await Promise.all(CHEF_ROSTER.map((e) => kv.get(`ik26:notion:chef:${e.chefId}`)))).filter(Boolean) as ChefSyncRecord[];
  const journey = chefRecords.map(computeJourneyProgress);

  const completedMilestones = journey.reduce((s, j) => s + j.completedCount, 0);
  const totalMilestones = journey.length * 4;

  return c.json({
    journey,
    summary: {
      totalChefs: journey.length,
      completedMilestones,
      totalMilestones,
      overallProgress: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
      chefsEventReady: journey.filter((j) => j.status === "Event Ready").length,
      chefsDishFinalized: journey.filter((j) => j.status === "Dish Finalized").length,
    },
  });
});

// GET single chef's journey progress
notionDomainSync.get("/make-server-5ed426e6/notion/sync/journey/:chefId", async (c) => {
  const chefId = c.req.param("chefId");
  const record: ChefSyncRecord | null = await kv.get(`ik26:notion:chef:${chefId}`);
  if (!record) return c.json({ error: `${chefId} not synced — call GET /notion/sync/chefs first` }, 404);
  return c.json({ journey: computeJourneyProgress(record) });
});

// ─── Routes: Event Schedule ───────────────────────────────────────

// GET typed event schedule — transforms raw content cache into ScheduleEntry[]
notionDomainSync.get("/make-server-5ed426e6/notion/sync/schedule", async (c) => {
  const forceRefresh = c.req.query("force") === "true";

  if (!forceRefresh) {
    const cached: any = await kv.get("ik26:notion:schedule");
    if (cached && Date.now() - cached.cachedAt < SCHEDULE_CACHE_TTL_MS) {
      return c.json({ schedule: cached.data, cached: true, count: cached.data.length });
    }
  }

  // Pull from the generic schedule cache populated by /notion/content/schedule/pull
  const rawCached: any = await kv.get("ik26:notion:cache:schedule");
  if (!rawCached?.data) {
    return c.json({
      schedule: [],
      cached: false,
      count: 0,
      hint: "Run GET /notion/content/schedule/pull first to populate the schedule cache",
    });
  }

  const schedule = (rawCached.data as Record<string, any>[]).map(rawToScheduleEntry);
  await kv.set("ik26:notion:schedule", { data: schedule, cachedAt: Date.now() });
  return c.json({ schedule, cached: false, count: schedule.length });
});

// ─── Routes: Sync All Domain Types ───────────────────────────────

// POST /notion/sync/domain-all — full sync of all 4 entity types
notionDomainSync.post("/make-server-5ed426e6/notion/sync/domain-all", async (c) => {
  const notionKey = resolveNotionKeyFromHeader(c);
  if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);

  const startedAt = Date.now();
  const results: Record<string, any> = {};

  // 1. Chef profiles — sequential to respect Notion rate limits (3 req/sec)
  const chefResults: any[] = [];
  for (const entry of CHEF_ROSTER) {
    try {
      const record = await syncChef(entry, notionKey);
      chefResults.push({ chefId: entry.chefId, success: !!record });
    } catch (err: any) {
      chefResults.push({ chefId: entry.chefId, success: false, error: err.message });
    }
  }
  const synced = chefResults.filter((r) => r.success).length;
  results.chefs = { success: synced === CHEF_ROSTER.length, synced, total: CHEF_ROSTER.length, results: chefResults };

  // 2. Courses — derived from chef records, no extra Notion calls
  try {
    const courseEntries = CHEF_ROSTER.filter((e) => !e.isIstoryaRoots);
    const recs = (await Promise.all(courseEntries.map((e) => kv.get(`ik26:notion:chef:${e.chefId}`)))).filter(Boolean) as ChefSyncRecord[];
    const courses = recs.map(chefRecordToCourseItem).sort((a, b) => (a.courseNumber ?? 99) - (b.courseNumber ?? 99));
    await kv.set("ik26:notion:courses", { data: courses, cachedAt: Date.now() });
    results.courses = { success: true, count: courses.length };
  } catch (err: any) {
    results.courses = { success: false, error: err.message };
  }

  // 3. Journey progress — derived from chef records, no extra Notion calls
  try {
    const recs = (await Promise.all(CHEF_ROSTER.map((e) => kv.get(`ik26:notion:chef:${e.chefId}`)))).filter(Boolean) as ChefSyncRecord[];
    const journey = recs.map(computeJourneyProgress);
    const completedMilestones = journey.reduce((s, j) => s + j.completedCount, 0);
    results.journey = {
      success: true,
      count: journey.length,
      overallProgress: journey.length > 0 ? Math.round((completedMilestones / (journey.length * 4)) * 100) : 0,
    };
  } catch (err: any) {
    results.journey = { success: false, error: err.message };
  }

  // 4. Schedule — transform generic cache if available
  try {
    const rawCached: any = await kv.get("ik26:notion:cache:schedule");
    if (rawCached?.data) {
      const schedule = (rawCached.data as Record<string, any>[]).map(rawToScheduleEntry);
      await kv.set("ik26:notion:schedule", { data: schedule, cachedAt: Date.now() });
      results.schedule = { success: true, count: schedule.length };
    } else {
      results.schedule = { success: false, error: "No schedule cache found — run /notion/content/schedule/pull first" };
    }
  } catch (err: any) {
    results.schedule = { success: false, error: err.message };
  }

  return c.json({ results, syncedAt: new Date().toISOString(), elapsedMs: Date.now() - startedAt });
});

export { notionDomainSync };
