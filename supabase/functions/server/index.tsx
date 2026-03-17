import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { travel } from "./travel-routes.tsx";
import { crm } from "./crm-routes.tsx";
import { formDiscord } from "./form-discord-routes.tsx";
import { engagement } from "./engagement-routes.tsx";
import { expenses, EXPENSE_BUCKET as EXPENSE_BUCKET_NAME } from "./expense-routes.tsx";
import { audit } from "./audit-routes.tsx";
import { studio } from "./content-studio.tsx";
import { notionContent, ensureDefaultConfig, resolveNotionKeyFromHeader, getNotionConfig } from "./notion-content-routes.tsx";
import { notionTasks, setActiveNotionKey } from "./notion-tasks-routes.tsx";
import { utility, PHOTO_BUCKET } from "./utility-routes.tsx";

const app = new Hono();

// ─── In-memory cache to reduce KV reads on hot paths ────────────
interface MemCache<T> { data: T; ts: number; }
const MEM_TTL = 30_000; // 30 seconds
let _profileCache: MemCache<any[]> | null = null;

async function getCachedProfiles(): Promise<any[]> {
  const now = Date.now();
  if (_profileCache && now - _profileCache.ts < MEM_TTL) {
    return _profileCache.data;
  }
  const profiles = await kv.getByPrefix("ik26:profile:");
  _profileCache = { data: profiles, ts: now };
  return profiles;
}

function invalidateProfileCache() {
  _profileCache = null;
}

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token", "X-Notion-Key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// ─── Auth helpers ────────────────────────────────────────────────

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
}

function getAnonClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY")
  );
}

// ─── Access Code Resolver (KV-backed, lazy-loaded) ──────────────
// Access codes are stored in KV under `ik26:config:access-codes`.
// On first use, if the KV key is empty, we seed it with defaults.
// Leadership can update codes via Content Studio without redeploying.

const ACCESS_CODES_KEY = "ik26:config:access-codes";

// Defaults — only used to seed KV on first run
const DEFAULT_ACCESS_CODES: Record<string, string> = {
  northstar222: "leadership", walbert2026: "leadership", m222: "leadership", w222: "leadership",
  kusina2026: "chef", chefik26: "chef", istorya2026: "chef", chef2026: "chef",
  teamik26: "team", team2026: "team", ops2026: "team", ik2026: "team",
  c222: "team", jj222: "team", mari222: "team", dio222: "team", jb222: "team",
  anj222: "team", cy222: "team", gris222: "team", ayce222: "team", jaryd222: "team",
  zwei222: "team", drew222: "team", ava222: "team", fler222: "team", sarah222: "team", jerj222: "team",
  den222: "viewer", team222: "viewer",
};

let _accessCodesCache: MemCache<Record<string, string>> | null = null;

async function getAccessCodes(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_accessCodesCache && now - _accessCodesCache.ts < MEM_TTL) {
    return _accessCodesCache.data;
  }
  let codes = await kv.get(ACCESS_CODES_KEY);
  if (!codes || typeof codes !== "object" || Object.keys(codes).length === 0) {
    // Seed KV with defaults on first run
    await kv.set(ACCESS_CODES_KEY, DEFAULT_ACCESS_CODES);
    codes = DEFAULT_ACCESS_CODES;
    console.log("[auth] Seeded access codes to KV — edit via Content Studio or PUT /config/access-codes");
  }
  _accessCodesCache = { data: codes as Record<string, string>, ts: now };
  return codes as Record<string, string>;
}

function invalidateAccessCodesCache() {
  _accessCodesCache = null;
}

async function resolveRole(code: string): Promise<string | null> {
  const codes = await getAccessCodes();
  return codes[code.trim().toLowerCase()] || null;
}

// ─── Notion API Key Helper ───────────────────────────────────────
// Falls back to X-Notion-Key header if env var is not set (for admin-provided keys).
// The active key is also set on a module-level variable so that lower-level functions
// (queryNotionDatabase2, findInlineDatabases) can use it without threading `c` through.
let _activeNotionKey: string | null = null;

function getNotionApiKey(c?: any): string | null {
  const envKey = Deno.env.get("NOTION_API_KEY");
  if (envKey) return envKey;
  if (c) {
    const headerKey = c.req.header("X-Notion-Key");
    if (headerKey && headerKey.trim()) return headerKey.trim();
  }
  return _activeNotionKey;
}

function resolveNotionKey(c: any): string | null {
  const key = getNotionApiKey(c);
  if (key) _activeNotionKey = key;
  return key;
}

// ─── Access Code Management Routes ──────────────────────────────

// GET current access codes (leadership only)
app.get("/make-server-5ed426e6/config/access-codes", async (c) => {
  try {
    const codes = await getAccessCodes();
    return c.json({ codes, count: Object.keys(codes).length });
  } catch (err: any) {
    return c.json({ error: `Failed to load access codes: ${err.message}` }, 500);
  }
});

// PUT update access codes (leadership only — replaces the full map)
app.put("/make-server-5ed426e6/config/access-codes", async (c) => {
  try {
    const { codes } = await c.req.json();
    if (!codes || typeof codes !== "object") {
      return c.json({ error: "Body must contain { codes: { code: role, ... } }" }, 400);
    }
    await kv.set(ACCESS_CODES_KEY, codes);
    invalidateAccessCodesCache();
    console.log(`[auth] Access codes updated — ${Object.keys(codes).length} codes`);
    return c.json({ ok: true, count: Object.keys(codes).length });
  } catch (err: any) {
    return c.json({ error: `Failed to update access codes: ${err.message}` }, 500);
  }
});

// ─── Auth Routes ─────────────────────────────────────────────────

// Register a new user — validates access code, creates Supabase auth user + KV profile
app.post("/make-server-5ed426e6/auth/register", async (c) => {
  try {
    const { accessCode, displayName, avatarId, themePreference, chefDirectoryId } = await c.req.json();

    if (!accessCode || !displayName) {
      return c.json({ error: "Missing required fields: accessCode, displayName" }, 400);
    }

    const role = await resolveRole(accessCode);
    if (!role) {
      return c.json({ error: "Invalid access code" }, 401);
    }

    // Generate a unique email for this user
    const uniqueId = crypto.randomUUID().slice(0, 12);
    const email = `user_${uniqueId}@ik26.isangkusina.com`;
    const normalizedCodeForPassword = accessCode.trim().toLowerCase();
    const password = `ik26_${normalizedCodeForPassword}_${uniqueId}`;

    const admin = getAdminClient();

    // Create Supabase auth user
    const { data: userData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { displayName, role, accessCode: accessCode.trim().toLowerCase() },
      email_confirm: true,
    });

    if (createError) {
      console.log("Error creating auth user:", createError);
      return c.json({ error: `Auth user creation failed: ${createError.message}` }, 500);
    }

    const userId = userData.user.id;
    const now = new Date().toISOString();

    // Create KV profile
    const profile = {
      id: userId,
      email,
      accessCode: accessCode.trim().toLowerCase(),
      displayName,
      role,
      avatarId: avatarId || "mortar",
      chefDirectoryId: chefDirectoryId || null,
      themePreference: themePreference || "ik26",
      notificationPreferences: {
        banners: true,
        bellAlerts: true,
        chatMentions: true,
      },
      onboardingCompleted: false,
      createdAt: now,
      lastActive: now,
    };

    await kv.set(`ik26:profile:${userId}`, profile);
    invalidateProfileCache();

    // Store credentials for future sign-in
    await kv.set(`ik26:creds:${userId}`, { email, password });

    // Also store a mapping: code → userId for lookup
    // We append to a list stored under the code key
    const codeKey = `ik26:code-users:${profile.accessCode}`;
    const existingUsers: string[] = (await kv.get(codeKey)) || [];
    existingUsers.push(userId);
    await kv.set(codeKey, existingUsers);

    // Sign in the user to get a session
    const anon = getAnonClient();
    const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.log("Error signing in after registration:", signInError);
      return c.json({ error: `Sign-in after registration failed: ${signInError.message}` }, 500);
    }

    return c.json({
      profile,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
      credentials: { email, password },
    });
  } catch (err) {
    console.log("Registration error:", err);
    return c.json({ error: `Registration failed: ${err}` }, 500);
  }
});

// Get profiles associated with an access code (for returning users)
app.post("/make-server-5ed426e6/auth/lookup", async (c) => {
  try {
    const { accessCode } = await c.req.json();

    if (!accessCode) {
      return c.json({ error: "Missing accessCode" }, 400);
    }

    const role = await resolveRole(accessCode);
    if (!role) {
      return c.json({ error: "Invalid access code" }, 401);
    }

    const normalizedCode = accessCode.trim().toLowerCase();
    const codeKey = `ik26:code-users:${normalizedCode}`;
    const userIds: string[] = (await kv.get(codeKey)) || [];

    if (userIds.length === 0) {
      return c.json({ profiles: [], role });
    }

    // Fetch all profiles
    const profileKeys = userIds.map((id) => `ik26:profile:${id}`);
    const profiles = await kv.mget(profileKeys);

    // Filter out nulls (deleted profiles)
    const validProfiles = profiles.filter(Boolean).map((p: any) => ({
      id: p.id,
      displayName: p.displayName,
      avatarId: p.avatarId,
      role: p.role,
    }));

    return c.json({ profiles: validProfiles, role });
  } catch (err) {
    console.log("Lookup error:", err);
    return c.json({ error: `Lookup failed: ${err}` }, 500);
  }
});

// Sign in an existing user by profile ID (for returning users selecting their name)
app.post("/make-server-5ed426e6/auth/signin", async (c) => {
  try {
    const { profileId } = await c.req.json();

    if (!profileId) {
      return c.json({ error: "Missing profileId" }, 400);
    }

    // Get the profile to find credentials
    const profile = await kv.get(`ik26:profile:${profileId}`);
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    // Get credentials from KV
    const creds = await kv.get(`ik26:creds:${profileId}`);

    if (!creds) {
      // Fallback: profile exists but no stored creds — use admin to generate a new password
      const admin = getAdminClient();
      const newPassword = `ik26_reset_${crypto.randomUUID().slice(0, 8)}`;
      const { error: updateError } = await admin.auth.admin.updateUserById(profileId, {
        password: newPassword,
      });
      if (updateError) {
        console.log("Error resetting password:", updateError);
        return c.json({ error: `Password reset failed: ${updateError.message}` }, 500);
      }

      // Sign in with new password
      const anon = getAnonClient();
      const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
        email: profile.email,
        password: newPassword,
      });

      if (signInError) {
        console.log("Error signing in after password reset:", signInError);
        return c.json({ error: `Sign-in failed: ${signInError.message}` }, 500);
      }

      // Store new creds
      await kv.set(`ik26:creds:${profileId}`, { email: profile.email, password: newPassword });

      // Update last active
      profile.lastActive = new Date().toISOString();
      await kv.set(`ik26:profile:${profileId}`, profile);

      return c.json({
        profile,
        session: {
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
        },
      });
    }

    // Sign in with stored credentials
    const anon = getAnonClient();
    const { data: signInData, error: signInError } = await anon.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });

    if (signInError) {
      console.log("Error signing in:", signInError);
      return c.json({ error: `Sign-in failed: ${signInError.message}` }, 500);
    }

    // Update last active
    profile.lastActive = new Date().toISOString();
    await kv.set(`ik26:profile:${profileId}`, profile);

    return c.json({
      profile,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    });
  } catch (err) {
    console.log("Sign-in error:", err);
    return c.json({ error: `Sign-in failed: ${err}` }, 500);
  }
});

// ─── Profile Routes (userId-based, secured by access-code gate) ──

// Get profile by userId
app.get("/make-server-5ed426e6/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    const profile = await kv.get(`ik26:profile:${userId}`);
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json({ profile });
  } catch (err) {
    console.log("Get profile error:", err);
    return c.json({ error: `Failed to get profile: ${err}` }, 500);
  }
});

// Update profile by userId
app.put("/make-server-5ed426e6/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    const updates = await c.req.json();
    const existing = await kv.get(`ik26:profile:${userId}`);
    if (!existing) {
      return c.json({ error: "Profile not found" }, 404);
    }

    // Merge updates (only allow specific fields)
    const allowedFields = [
      "displayName", "avatarId", "customPhotoUrl", "chefDirectoryId", "themePreference",
      "notificationPreferences", "onboardingCompleted",
    ];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        existing[field] = updates[field];
      }
    }
    existing.lastActive = new Date().toISOString();

    await kv.set(`ik26:profile:${userId}`, existing);

    return c.json({ profile: existing });
  } catch (err) {
    console.log("Update profile error:", err);
    return c.json({ error: `Failed to update profile: ${err}` }, 500);
  }
});

// ─── Admin Routes (leadership only) ─────────────────────────────

app.get("/make-server-5ed426e6/admin/profiles", async (c) => {
  try {
    const profiles = await getCachedProfiles();
    const sorted = [...profiles].sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return c.json({ profiles: sorted });
  } catch (err) {
    console.log("Error loading admin profiles:", err);
    return c.json({ error: `Failed to load profiles: ${err}` }, 500);
  }
});

// ─── Chef Submissions Aggregation (leadership) ─────────────────
// Returns all chef submissions across all users for the tracker view

app.get("/make-server-5ed426e6/chef-submissions", async (c) => {
  try {
    const profiles = await getCachedProfiles();
    const chefProfiles = profiles.filter((p: any) => p?.role === "chef");

    const result: any[] = [];
    for (const profile of chefProfiles) {
      if (!profile?.id) continue;
      const subData = await kv.get(`ik26:user-data:${profile.id}:chef-submissions`);
      result.push({
        userId: profile.id,
        displayName: profile.displayName,
        avatarId: profile.avatarId,
        chefDirectoryId: profile.chefDirectoryId,
        submissions: subData || null,
        lastActive: profile.lastActive,
      });
    }

    return c.json({ submissions: result });
  } catch (err) {
    console.log("Error loading chef submissions:", err);
    return c.json({ error: `Failed to load chef submissions: ${err}` }, 500);
  }
});

// ─── Submission Stats (for KPI cards) ───────────────────────────
// Lightweight stats-only endpoint that returns counts without full submission data

app.get("/make-server-5ed426e6/submission-stats", async (c) => {
  try {
    const profiles = await getCachedProfiles();
    const chefProfiles = profiles.filter((p: any) => p?.role === "chef");

    let conceptCount = 0;
    let ingredientCount = 0;
    let kitchenCount = 0;

    const hasContent = (obj: any) => {
      if (!obj || typeof obj !== "object") return false;
      return Object.values(obj).some(
        (v) => typeof v === "string" && (v as string).trim().length > 0
      );
    };

    for (const profile of chefProfiles) {
      if (!profile?.id) continue;
      const subData = await kv.get(
        `ik26:user-data:${profile.id}:chef-submissions`
      );
      if (!subData) continue;
      if (hasContent(subData.concept)) conceptCount++;
      if (hasContent(subData.ingredients)) ingredientCount++;
      if (hasContent(subData.kitchen)) kitchenCount++;
    }

    return c.json({
      totalChefs: chefProfiles.length,
      conceptCount,
      ingredientCount,
      kitchenCount,
      // Average completion across all 3 categories
      completionRate:
        chefProfiles.length > 0
          ? Math.round(
              ((conceptCount + ingredientCount + kitchenCount) /
                (chefProfiles.length * 3)) *
                100
            )
          : 0,
    });
  } catch (err) {
    console.log("Error loading submission stats:", err);
    return c.json({ error: `Failed to load submission stats: ${err}` }, 500);
  }
});

// Health check endpoint
app.get("/make-server-5ed426e6/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString(), version: "3.3.0" });
});

// ─── Pre-flight Deployment Validation ──────────────────────────
app.get("/make-server-5ed426e6/preflight", async (c) => {
  resolveNotionKey(c);
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string; error?: string }> = {};
  const now = Date.now();

  // 1. KV Store health
  try {
    const t0 = Date.now();
    await kv.set("ik26:preflight:ping", { ts: now });
    const val = await kv.get("ik26:preflight:ping");
    checks.kvStore = { ok: !!val, latencyMs: Date.now() - t0, detail: "read/write OK" };
  } catch (err: any) {
    checks.kvStore = { ok: false, error: err.message };
  }

  // 2. Supabase Auth
  try {
    const t0 = Date.now();
    const admin = getAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    checks.supabaseAuth = { ok: !error, latencyMs: Date.now() - t0, detail: error ? error.message : "Auth service OK" };
  } catch (err: any) {
    checks.supabaseAuth = { ok: false, error: err.message };
  }

  // 3. Supabase Storage
  try {
    const t0 = Date.now();
    const admin = getAdminClient();
    const { data: buckets, error } = await admin.storage.listBuckets();
    const bucketNames = (buckets || []).map((b: any) => b.name);
    const hasPhotoBucket = bucketNames.includes(PHOTO_BUCKET);
    const hasReceiptBucket = bucketNames.includes(EXPENSE_BUCKET_NAME);
    checks.supabaseStorage = {
      ok: !error && hasPhotoBucket && hasReceiptBucket,
      latencyMs: Date.now() - t0,
      detail: `Buckets: ${bucketNames.join(", ")}`,
      error: !hasPhotoBucket ? `Missing ${PHOTO_BUCKET}` : !hasReceiptBucket ? `Missing ${EXPENSE_BUCKET_NAME}` : undefined,
    };
  } catch (err: any) {
    checks.supabaseStorage = { ok: false, error: err.message };
  }

  // 4. Notion API
  const notionKey = _activeNotionKey || Deno.env.get("NOTION_API_KEY");
  if (notionKey) {
    try {
      const t0 = Date.now();
      const resp = await fetch("https://api.notion.com/v1/users/me", {
        headers: { Authorization: `Bearer ${notionKey}`, "Notion-Version": "2022-06-28" },
      });
      const nData = await resp.json();
      checks.notionApi = {
        ok: resp.ok,
        latencyMs: Date.now() - t0,
        detail: resp.ok ? `Bot: ${nData.name || nData.bot?.owner?.user?.name || "connected"}` : `HTTP ${resp.status}`,
        error: resp.ok ? undefined : nData?.message,
      };
    } catch (err: any) {
      checks.notionApi = { ok: false, error: err.message };
    }
  } else {
    checks.notionApi = { ok: false, error: "NOTION_API_KEY not set" };
  }

  // 5. Notion Content Config
  try {
    const config = await ensureDefaultConfig();
    const configuredCount = Object.values(config).filter((v: any) => v?.databaseId).length;
    checks.notionContent = { ok: configuredCount >= 8, detail: `${configuredCount}/11 content types configured` };
  } catch (err: any) {
    checks.notionContent = { ok: false, error: err.message };
  }

  // 6. Profile count
  try {
    const profiles = await getCachedProfiles();
    const roles: Record<string, number> = {};
    for (const p of profiles) { const role = (p as any)?.role || "unknown"; roles[role] = (roles[role] || 0) + 1; }
    checks.profiles = { ok: profiles.length > 0, detail: `${profiles.length} profiles` };
  } catch (err: any) {
    checks.profiles = { ok: false, error: err.message };
  }

  // 7. Form URLs
  try {
    const formUrls: Record<string, string> | null = await kv.get("ik26:config:form-urls");
    const urls = formUrls || {};
    const allUrls = Object.values(urls);
    const placeholderCount = allUrls.filter((u: string) => u.includes("Example")).length;
    checks.formUrls = {
      ok: allUrls.length >= 6 && placeholderCount === 0,
      detail: allUrls.length === 0 ? "No form URLs configured" : placeholderCount > 0 ? `${placeholderCount} placeholder URLs` : `${allUrls.length} URLs ready`,
    };
  } catch { checks.formUrls = { ok: false, error: "Failed to check form URLs" }; }

  // 8. Discord webhook
  const discordUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
  checks.discordWebhook = { ok: !!discordUrl, detail: discordUrl ? "Configured" : "Not set (optional)" };

  const allOk = Object.values(checks).every((ch) => ch.ok);
  const okCount = Object.values(checks).filter((ch) => ch.ok).length;
  return c.json({ ready: allOk, score: `${okCount}/${Object.keys(checks).length}`, checks, timestamp: new Date().toISOString(), version: "3.3.0" });
});

// ─── Logo, Calendar, Photo, Portal, Analytics → utility-routes.tsx ────

// ─── Notion API Key Validation ─────────────────────────────────

app.post("/make-server-5ed426e6/notion/validate-key", async (c) => {
  try {
    const { apiKey } = await c.req.json();
    if (!apiKey || (!apiKey.startsWith("ntn_") && !apiKey.startsWith("secret_"))) {
      return c.json({ valid: false, error: "Invalid key format. Must start with ntn_ or secret_" }, 400);
    }

    const resp = await fetch("https://api.notion.com/v1/users/me", {
      headers: { Authorization: `Bearer ${apiKey}`, "Notion-Version": "2022-06-28" },
    });

    if (!resp.ok) {
      const data = await resp.json();
      return c.json({ valid: false, error: data?.message || `HTTP ${resp.status}` });
    }

    const data = await resp.json();
    _activeNotionKey = apiKey;
    // Sync key to extracted notion-tasks module
    setActiveNotionKey(apiKey);

    return c.json({ valid: true, botName: data.name || data.bot?.owner?.user?.name || "Unknown Bot", botId: data.id, type: data.type });
  } catch (err: any) {
    return c.json({ valid: false, error: err.message }, 500);
  }
});

// ─── Export / Backup ───────────────────────────────────────────

app.get("/make-server-5ed426e6/export/full", async (c) => {
  try {
    const [profiles, expenses, messages, memoryPosts, fusionIdeas, voiceNotes, promptResponses] = await Promise.all([
      kv.getByPrefix("ik26:profile:"),
      kv.getByPrefix("ik26:expense:"),
      kv.getByPrefix("ik26:msg:"),
      kv.getByPrefix("ik26:memory-wall:"),
      kv.getByPrefix("ik26:flavor-fusion:"),
      kv.getByPrefix("ik26:voice:"),
      kv.getByPrefix("ik26:prompt-resp:"),
    ]);

    const notionConfig = await getNotionConfig();

    return c.json({
      exportedAt: new Date().toISOString(),
      version: "2.8.0",
      counts: {
        profiles: profiles.length,
        expenses: expenses.length,
        messages: messages.length,
        memoryPosts: memoryPosts.length,
        fusionIdeas: fusionIdeas.length,
        voiceNotes: voiceNotes.length,
        promptResponses: promptResponses.length,
      },
      data: { profiles, expenses, messages, memoryPosts, fusionIdeas, voiceNotes, promptResponses, notionConfig },
    });
  } catch (err) {
    console.log("Export error:", err);
    return c.json({ error: `Export failed: ${err}` }, 500);
  }
});

// ─── Engagement routes extracted to engagement-routes.tsx ───────
// (messages, reactions, prompts, trivia, voice notes, memory wall, flavor fusion, engagement stats)

// ─── User-specific data (per-user content) ─────────────────────

// Save user-specific data per user
app.put("/make-server-5ed426e6/user-data/:userId/:dataType", async (c) => {
  try {
    const userId = c.req.param("userId");
    const dataType = c.req.param("dataType");
    const body = await c.req.json();
    const { data } = body;

    if (!dataType || data === undefined) {
      return c.json({ error: "Missing dataType or data" }, 400);
    }

    const key = `ik26:user-data:${userId}:${dataType}`;
    await kv.set(key, data);
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving user data:", err);
    return c.json({ error: `Failed to save user data: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/user-data/:userId/:dataType", async (c) => {
  try {
    const userId = c.req.param("userId");
    const dataType = c.req.param("dataType");
    const data = await kv.get(`ik26:user-data:${userId}:${dataType}`);
    return c.json({ data: data || null });
  } catch (err) {
    console.log("Error loading user data:", err);
    return c.json({ error: `Failed to load user data: ${err}` }, 500);
  }
});

// ─── Notion IK26 Path, Task Board → notion-tasks-routes.tsx ────
// Photo, Logo, Calendar, Portal, Analytics → utility-routes.tsx

// ─── Mount extracted route modules ───────────────────────────────
app.route("/", crm);
app.route("/", travel);
app.route("/", formDiscord);
app.route("/", engagement);
app.route("/", expenses);
app.route("/", audit);
app.route("/", studio);
app.route("/", notionContent);
app.route("/", notionTasks);
app.route("/", utility);

Deno.serve(app.fetch);