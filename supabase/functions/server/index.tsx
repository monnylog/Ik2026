import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
const app = new Hono();

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

// Access code → role mapping (duplicated from frontend for server-side validation)
const PASSWORD_MAP: Record<string, string> = {
  // Leadership
  northstar222: "leadership",
  walbert2026: "leadership",
  m222: "leadership",
  w222: "leadership",
  // Chef
  kusina2026: "chef",
  chefik26: "chef",
  istorya2026: "chef",
  chef2026: "chef",
  // Team
  teamik26: "team",
  team2026: "team",
  ops2026: "team",
  ik2026: "team",
  c222: "team",
  jj222: "team",
  mari222: "team",
  dio222: "team",
  jb222: "team",
  anj222: "team",
  cy222: "team",
  gris222: "team",
  ayce222: "team",
  jaryd222: "team",
  zwei222: "team",
  drew222: "team",
  ava222: "team",
  fler222: "team",
  sarah222: "team",
  jerj222: "team",
  // Viewer
  den222: "viewer",
  team222: "viewer",
};

function resolveRole(code: string): string | null {
  return PASSWORD_MAP[code.trim().toLowerCase()] || null;
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

// ─── Auth Routes ─────────────────────────────────────────────────

// Register a new user — validates access code, creates Supabase auth user + KV profile
app.post("/make-server-5ed426e6/auth/register", async (c) => {
  try {
    const { accessCode, displayName, avatarId, themePreference, chefDirectoryId } = await c.req.json();

    if (!accessCode || !displayName) {
      return c.json({ error: "Missing required fields: accessCode, displayName" }, 400);
    }

    const role = resolveRole(accessCode);
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

    const role = resolveRole(accessCode);
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
    // Fetch all profiles by prefix
    const profiles = await kv.getByPrefix("ik26:profile:");
    // Sort by createdAt descending
    profiles.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return c.json({ profiles });
  } catch (err) {
    console.log("Error loading admin profiles:", err);
    return c.json({ error: `Failed to load profiles: ${err}` }, 500);
  }
});

// ─── Chef Submissions Aggregation (leadership) ─────────────────
// Returns all chef submissions across all users for the tracker view

app.get("/make-server-5ed426e6/chef-submissions", async (c) => {
  try {
    // Get all chef profiles, then fetch their submissions
    const profiles = await kv.getByPrefix("ik26:profile:");
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
    const profiles = await kv.getByPrefix("ik26:profile:");
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
  return c.json({ status: "ok" });
});

// ─── Chat Messages ─────────────────────────────────────────────
// KV key pattern: ik26:msg:{channelId}:{timestamp}

app.post("/make-server-5ed426e6/messages", async (c) => {
  try {
    const body = await c.req.json();
    const { channelId, id, author, avatarId, text, timestamp, userId } = body;
    if (!channelId || !id || !author || !text) {
      return c.json({ error: "Missing required fields (channelId, id, author, text)" }, 400);
    }
    const key = `ik26:msg:${channelId}:${id}`;
    await kv.set(key, { channelId, id, author, avatarId, text, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving message:", err);
    return c.json({ error: `Failed to save message: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/messages/:channelId", async (c) => {
  try {
    const channelId = c.req.param("channelId");
    const messages = await kv.getByPrefix(`ik26:msg:${channelId}:`);
    // Sort by id (timestamp-based)
    messages.sort((a: any, b: any) => a.id.localeCompare(b.id));
    return c.json({ messages });
  } catch (err) {
    console.log("Error loading messages:", err);
    return c.json({ error: `Failed to load messages: ${err}` }, 500);
  }
});

// ─── Tapback Reactions ────────────────────────────────────────
// KV key pattern: ik26:reactions:{messageId} = { [userId]: reactionType }

app.post("/make-server-5ed426e6/reactions", async (c) => {
  try {
    const { messageId, userId, reaction } = await c.req.json();
    if (!messageId || !userId) {
      return c.json({ error: "Missing required fields (messageId, userId)" }, 400);
    }
    const key = `ik26:reactions:${messageId}`;
    const existing: Record<string, string> = (await kv.get(key)) || {};
    if (!reaction || existing[userId] === reaction) {
      // Toggle off
      delete existing[userId];
    } else {
      existing[userId] = reaction;
    }
    await kv.set(key, existing);
    return c.json({ ok: true, reactions: existing });
  } catch (err) {
    console.log("Error saving reaction:", err);
    return c.json({ error: `Failed to save reaction: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/reactions/:channelId", async (c) => {
  try {
    const channelId = c.req.param("channelId");
    // Get all message IDs for this channel, then get their reactions
    const messages = await kv.getByPrefix(`ik26:msg:${channelId}:`);
    const reactionMap: Record<string, Record<string, string>> = {};
    if (messages.length > 0) {
      const reactionKeys = messages.map((m: any) => `ik26:reactions:${m.id}`);
      const reactions = await kv.mget(reactionKeys);
      reactions.forEach((r: any, i: number) => {
        if (r && Object.keys(r).length > 0) {
          reactionMap[messages[i].id] = r;
        }
      });
    }
    return c.json({ reactions: reactionMap });
  } catch (err) {
    console.log("Error loading reactions:", err);
    return c.json({ error: `Failed to load reactions: ${err}` }, 500);
  }
});

// ─── Daily Prompt Responses ────────────────────────────────────
// KV key pattern: ik26:prompt-resp:{promptId}:{uniqueId}

app.post("/make-server-5ed426e6/prompt-responses", async (c) => {
  try {
    const body = await c.req.json();
    const { promptId, id, author, avatarId, text, timestamp, userId } = body;
    if (!promptId || !id || !text) {
      return c.json({ error: "Missing required fields for prompt response" }, 400);
    }
    const key = `ik26:prompt-resp:${promptId}:${id}`;
    await kv.set(key, { promptId, id, author, avatarId, text, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving prompt response:", err);
    return c.json({ error: `Failed to save prompt response: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/prompt-responses/:promptId", async (c) => {
  try {
    const promptId = c.req.param("promptId");
    const responses = await kv.getByPrefix(`ik26:prompt-resp:${promptId}:`);
    responses.sort((a: any, b: any) => a.id.localeCompare(b.id));
    return c.json({ responses });
  } catch (err) {
    console.log("Error loading prompt responses:", err);
    return c.json({ error: `Failed to load prompt responses: ${err}` }, 500);
  }
});

// ─── All prompt responses (for Our Istoryas recap) ─────────────

app.get("/make-server-5ed426e6/all-prompt-responses", async (c) => {
  try {
    const responses = await kv.getByPrefix("ik26:prompt-resp:");
    responses.sort((a: any, b: any) => (a.id || "").localeCompare(b.id || ""));
    return c.json({ responses });
  } catch (err) {
    console.log("Error loading all prompt responses:", err);
    return c.json({ error: `Failed to load all prompt responses: ${err}` }, 500);
  }
});

// ─── Trivia Answers ────────────────────────────────────────────
// KV key pattern: ik26:trivia-ans:{triviaId}:{uniqueId}

app.post("/make-server-5ed426e6/trivia-answers", async (c) => {
  try {
    const body = await c.req.json();
    const { triviaId, id, author, avatarId, answerId, userId } = body;
    if (!triviaId || !id || !answerId) {
      return c.json({ error: "Missing required fields for trivia answer" }, 400);
    }
    const key = `ik26:trivia-ans:${triviaId}:${id}`;
    await kv.set(key, { triviaId, id, author, avatarId, answerId, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving trivia answer:", err);
    return c.json({ error: `Failed to save trivia answer: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/trivia-answers/:triviaId", async (c) => {
  try {
    const triviaId = c.req.param("triviaId");
    const answers = await kv.getByPrefix(`ik26:trivia-ans:${triviaId}:`);
    return c.json({ answers });
  } catch (err) {
    console.log("Error loading trivia answers:", err);
    return c.json({ error: `Failed to load trivia answers: ${err}` }, 500);
  }
});

// ─── Voice Notes (Istoryas) ────────────────────────────────────
// KV key pattern: ik26:voice:{uniqueId}
// Audio stored as base64 in the value along with metadata

app.post("/make-server-5ed426e6/voice-notes", async (c) => {
  try {
    const body = await c.req.json();
    const { id, author, avatarId, caption, audioBase64, durationSec, timestamp, userId } = body;
    if (!id || !author || !audioBase64) {
      return c.json({ error: "Missing required fields for voice note (id, author, audioBase64)" }, 400);
    }
    const key = `ik26:voice:${id}`;
    await kv.set(key, { id, author, avatarId, caption, audioBase64, durationSec, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving voice note:", err);
    return c.json({ error: `Failed to save voice note: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/voice-notes", async (c) => {
  try {
    const notes = await kv.getByPrefix("ik26:voice:");
    notes.sort((a: any, b: any) => (b.id || "").localeCompare(a.id || ""));
    return c.json({ notes });
  } catch (err) {
    console.log("Error loading voice notes:", err);
    return c.json({ error: `Failed to load voice notes: ${err}` }, 500);
  }
});

// ─── Memory Wall ───────────────────────────────────────────────
// KV key pattern: ik26:memory-wall:{uniqueId}

app.post("/make-server-5ed426e6/memory-wall", async (c) => {
  try {
    const body = await c.req.json();
    const { id, author, avatarId, text, tagId, timestamp, userId } = body;
    if (!id || !author || !text) {
      return c.json({ error: "Missing required fields for memory wall post (id, author, text)" }, 400);
    }
    const key = `ik26:memory-wall:${id}`;
    await kv.set(key, { id, author, avatarId, text, tagId, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving memory wall post:", err);
    return c.json({ error: `Failed to save memory wall post: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/memory-wall", async (c) => {
  try {
    const posts = await kv.getByPrefix("ik26:memory-wall:");
    posts.sort((a: any, b: any) => (b.id || "").localeCompare(a.id || ""));
    return c.json({ posts });
  } catch (err) {
    console.log("Error loading memory wall posts:", err);
    return c.json({ error: `Failed to load memory wall posts: ${err}` }, 500);
  }
});

// ─── Flavor Fusion ─────────────────────────────────────────────
// KV key pattern: ik26:flavor-fusion:{uniqueId}

app.post("/make-server-5ed426e6/flavor-fusion", async (c) => {
  try {
    const body = await c.req.json();
    const { id, ingredientA, ingredientB, author, avatarId, idea, timestamp, userId } = body;
    if (!id || !author || !idea) {
      return c.json({ error: "Missing required fields for flavor fusion idea (id, author, idea)" }, 400);
    }
    const key = `ik26:flavor-fusion:${id}`;
    await kv.set(key, { id, ingredientA, ingredientB, author, avatarId, idea, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving flavor fusion idea:", err);
    return c.json({ error: `Failed to save flavor fusion idea: ${err}` }, 500);
  }
});

app.get("/make-server-5ed426e6/flavor-fusion", async (c) => {
  try {
    const ideas = await kv.getByPrefix("ik26:flavor-fusion:");
    ideas.sort((a: any, b: any) => (a.id || "").localeCompare(b.id || ""));
    return c.json({ ideas });
  } catch (err) {
    console.log("Error loading flavor fusion ideas:", err);
    return c.json({ error: `Failed to load flavor fusion ideas: ${err}` }, 500);
  }
});

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

// ─── Notion IK26 Path (live milestone data) ─────────────────────
// Queries the IK26 Path database from Notion, caches in KV for 5 min

const NOTION_DB_ID = "8c2ba05f42f24bd0a10859e44f212e5c";
const NOTION_CACHE_KEY = "ik26:notion:ik26-path";
const NOTION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface NotionCacheEntry {
  data: any;
  cachedAt: number;
}

async function fetchNotionDatabase() {
  const notionKey = _activeNotionKey || Deno.env.get("NOTION_API_KEY");
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

app.get("/make-server-5ed426e6/notion/ik26-path", async (c) => {
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
app.post("/make-server-5ed426e6/notion/ik26-path/refresh", async (c) => {
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
// KV key: ik26:notion:tasks-db-id → stores the Notion database ID
// KV key: ik26:notion:task-sync → stores sync metadata
// KV key: ik26:notion:task-map → maps local task IDs to Notion page IDs

const TASKS_DB_CACHE_KEY = "ik26:notion:tasks-db-id";
const TASK_SYNC_META_KEY = "ik26:notion:task-sync";
const TASK_MAP_KEY = "ik26:notion:task-map";
const TASK_BOARD_KEY = "ik26:taskboard:tasks";

// Save/get the Notion database ID for tasks
app.post("/make-server-5ed426e6/notion/tasks/configure", async (c) => {
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

app.get("/make-server-5ed426e6/notion/tasks/configure", async (c) => {
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
    // Update existing page
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
    // Create new page
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
app.post("/make-server-5ed426e6/notion/tasks/sync-up", async (c) => {
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

    // Get existing task → Notion page mapping
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
app.get("/make-server-5ed426e6/notion/tasks/sync-down", async (c) => {
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
        assigneeEmoji: "📋",
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
app.get("/make-server-5ed426e6/notion/tasks/sync-status", async (c) => {
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
app.put("/make-server-5ed426e6/notion/tasks/save", async (c) => {
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
app.get("/make-server-5ed426e6/notion/tasks/load", async (c) => {
  try {
    const tasks = await kv.get(TASK_BOARD_KEY);
    return c.json({ tasks: tasks || null });
  } catch (err) {
    console.log("Error loading task board:", err);
    return c.json({ error: `Failed to load tasks: ${err}` }, 500);
  }
});

// ─── Photo Upload (Supabase Storage) ───────────────────────────
// Bucket for chef profile photos

const PHOTO_BUCKET = "make-5ed426e6-photos";

// Ensure bucket exists on startup
(async () => {
  try {
    const admin = getAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === PHOTO_BUCKET);
    if (!bucketExists) {
      await admin.storage.createBucket(PHOTO_BUCKET, { public: false });
      console.log(`Created storage bucket: ${PHOTO_BUCKET}`);
    }
  } catch (err) {
    console.log("Error ensuring photo bucket:", err);
  }
})();

app.post("/make-server-5ed426e6/upload-photo/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, 400);
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: "File too large. Max 2MB." }, 400);
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `chef-photos/${userId}.${ext}`;

    const admin = getAdminClient();

    // Upload (upsert to overwrite existing)
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(PHOTO_BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log("Upload error:", uploadError);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Create a signed URL (valid for 1 year)
    const { data: signedData, error: signedError } = await admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    if (signedError) {
      console.log("Signed URL error:", signedError);
      return c.json({ error: `Failed to create signed URL: ${signedError.message}` }, 500);
    }

    // Auto-update the profile with the photo URL
    const existing = await kv.get(`ik26:profile:${userId}`);
    if (existing) {
      existing.customPhotoUrl = signedData.signedUrl;
      existing.lastActive = new Date().toISOString();
      await kv.set(`ik26:profile:${userId}`, existing);
    }

    return c.json({
      url: signedData.signedUrl,
      profile: existing || null,
    });
  } catch (err) {
    console.log("Photo upload error:", err);
    return c.json({ error: `Photo upload failed: ${err}` }, 500);
  }
});

// ─── Engagement Stats (aggregated for manager dashboard) ────────
// Counts real entries from KV for each engagement type

app.get("/make-server-5ed426e6/engagement-stats", async (c) => {
  try {
    const [promptResponses, allMessages, memoryPosts, fusionIdeas] = await Promise.all([
      kv.getByPrefix("ik26:prompt-resp:"),
      Promise.all([
        kv.getByPrefix("ik26:msg:general:"),
        kv.getByPrefix("ik26:msg:kitchen-prep:"),
        kv.getByPrefix("ik26:msg:logistics:"),
        kv.getByPrefix("ik26:msg:introductions:"),
      ]).then((arrs) => arrs.flat()),
      kv.getByPrefix("ik26:memory-wall:"),
      kv.getByPrefix("ik26:flavor-fusion:"),
    ]);

    // Recipe Roulette spins are stored per-user as user-data
    // We count all users who have recipe-roulette data
    const allUserData = await kv.getByPrefix("ik26:user-data:");
    const recipeSpins = allUserData.filter(
      (d: any) => d && typeof d === "object" && d.spins !== undefined
    ).reduce((sum: number, d: any) => sum + (d.spins || 0), 0);

    // Get unique prompt respondents
    const uniquePromptAuthors = new Set(
      promptResponses.map((r: any) => r.userId || r.author).filter(Boolean)
    );

    // Get message count per channel
    const channelCounts: Record<string, number> = {};
    for (const msg of allMessages) {
      const ch = (msg as any).channelId || "unknown";
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    }

    return c.json({
      promptResponses: promptResponses.length,
      promptRespondents: uniquePromptAuthors.size,
      chatMessages: allMessages.length,
      channelCounts,
      memoryWallPosts: memoryPosts.length,
      flavorFusionIdeas: fusionIdeas.length,
      recipeRouletteSpins: recipeSpins,
    });
  } catch (err) {
    console.log("Error loading engagement stats:", err);
    return c.json({ error: `Failed to load engagement stats: ${err}` }, 500);
  }
});

// ─── Portal Inquiry Form ───────────────────────────────────────
// Public endpoint — no auth required (visitor-facing form)

app.post("/make-server-5ed426e6/portal-inquiry", async (c) => {
  try {
    const { name, email, organization, inquiryType, message } = await c.req.json();

    if (!name || !email || !message) {
      return c.json({ error: "Missing required fields: name, email, message" }, 400);
    }

    const id = crypto.randomUUID().slice(0, 12);
    const inquiry = {
      id,
      name,
      email,
      organization: organization || "",
      inquiryType: inquiryType || "General Question",
      message,
      timestamp: new Date().toISOString(),
      status: "new",
    };

    await kv.set(`ik26:portal-inquiry:${id}`, inquiry);

    console.log(`Portal inquiry saved: ${id} from ${name} (${inquiryType})`);
    return c.json({ success: true, id });
  } catch (err) {
    console.log("Portal inquiry error:", err);
    return c.json({ error: `Failed to save inquiry: ${err}` }, 500);
  }
});

// Get all portal inquiries (leadership only)
app.get("/make-server-5ed426e6/portal-inquiries", async (c) => {
  try {
    const inquiries = await kv.getByPrefix("ik26:portal-inquiry:");
    const sorted = (inquiries || [])
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return c.json({ inquiries: sorted });
  } catch (err) {
    console.log("Error loading portal inquiries:", err);
    return c.json({ error: `Failed to load inquiries: ${err}` }, 500);
  }
});

// Update inquiry status (mark as reviewed/archived)
app.put("/make-server-5ed426e6/portal-inquiry/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status } = await c.req.json();

    if (!status || !["new", "reviewed", "archived"].includes(status)) {
      return c.json({ error: "Invalid status. Must be: new, reviewed, or archived" }, 400);
    }

    const inquiry = await kv.get(`ik26:portal-inquiry:${id}`);
    if (!inquiry) {
      return c.json({ error: "Inquiry not found" }, 404);
    }

    (inquiry as any).status = status;
    (inquiry as any).statusUpdatedAt = new Date().toISOString();
    await kv.set(`ik26:portal-inquiry:${id}`, inquiry);

    console.log(`Portal inquiry ${id} status updated to ${status}`);
    return c.json({ success: true, inquiry });
  } catch (err) {
    console.log("Error updating inquiry status:", err);
    return c.json({ error: `Failed to update inquiry status: ${err}` }, 500);
  }
});

// Get inquiry count summary (for sidebar badge)
app.get("/make-server-5ed426e6/portal-inquiries/count", async (c) => {
  try {
    const inquiries = await kv.getByPrefix("ik26:portal-inquiry:");
    const all = (inquiries || []).filter(Boolean);
    const newCount = all.filter((i: any) => i.status === "new").length;
    return c.json({ total: all.length, new: newCount });
  } catch (err) {
    console.log("Error counting inquiries:", err);
    return c.json({ error: `Failed to count inquiries: ${err}` }, 500);
  }
});

// ─── Share Analytics ────────────────────────────────────────────
// Track share/invite actions from landing page

app.post("/make-server-5ed426e6/analytics/event", async (c) => {
  try {
    const { event, data } = await c.req.json();
    if (!event) {
      return c.json({ error: "Missing event name" }, 400);
    }

    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;
    const entry = {
      id,
      event,
      data: data || {},
      timestamp: new Date().toISOString(),
      userAgent: c.req.header("user-agent") || "unknown",
    };

    await kv.set(`ik26:analytics:${id}`, entry);
    return c.json({ success: true });
  } catch (err) {
    console.log("Analytics event error:", err);
    return c.json({ error: `Failed to track event: ${err}` }, 500);
  }
});

// Get analytics summary (for dashboard widget)
app.get("/make-server-5ed426e6/analytics/summary", async (c) => {
  try {
    const events = await kv.getByPrefix("ik26:analytics:");
    const all = (events || []).filter(Boolean);

    // Count by event type
    const byEvent: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    const recentEvents: any[] = [];

    for (const e of all) {
      const ev = e as any;
      byEvent[ev.event] = (byEvent[ev.event] || 0) + 1;

      // Group by day
      const day = ev.timestamp?.slice(0, 10) || "unknown";
      byDay[day] = (byDay[day] || 0) + 1;

      // Collect recent events (last 20)
      recentEvents.push({
        event: ev.event,
        data: ev.data,
        timestamp: ev.timestamp,
      });
    }

    // Sort recent events by timestamp descending
    recentEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({
      total: all.length,
      byEvent,
      byDay,
      recent: recentEvents.slice(0, 20),
    });
  } catch (err) {
    console.log("Error loading analytics summary:", err);
    return c.json({ error: `Failed to load analytics: ${err}` }, 500);
  }
});

// ─── Notion Content Hub (Generic Multi-Database Sync) ──────────
// Universal system for syncing ANY Notion database to the app.
// Config stored at: ik26:notion:config (master registry)
// Cache per type at: ik26:notion:cache:{type}
// Sync log at:       ik26:notion:sync-log

const NOTION_CONTENT_TYPES = [
  "roster", "courses", "team", "comms", "milestones",
  "budget", "sponsors", "announcements", "schedule", "decisions", "warroom",
] as const;

type NotionContentType = typeof NOTION_CONTENT_TYPES[number];

const CONTENT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes default

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
  const notionKey = _activeNotionKey || Deno.env.get("NOTION_API_KEY");
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
async function getNotionConfig(): Promise<Record<string, { databaseId: string; label?: string; configuredAt?: string }>> {
  return (await kv.get("ik26:notion:config")) || {};
}

async function saveNotionConfig(config: Record<string, any>) {
  await kv.set("ik26:notion:config", config);
}

// ── Default IK26 Notion workspace configuration ─────────────────
// Pre-populated with REAL page/database IDs from the IK26 Notion workspace.
const DEFAULT_NOTION_CONFIG: Record<string, { databaseId: string; label: string; isPageId?: boolean }> = {
  // All IK26 workstream IDs are Notion PAGES (not databases).
  // smartQueryNotionContent discovers inline child_database blocks inside them.
  roster: { databaseId: "924024e2b82048ed8d6923c2199abf2d", label: "🍽️ Chefs, Menu & Beverage", isPageId: true },
  courses: { databaseId: "924024e2b82048ed8d6923c2199abf2d", label: "🍽️ Chefs, Menu & Beverage (Courses view)", isPageId: true },
  team: { databaseId: "ada2715ee86b4980a35d46450292b855", label: "👥 Team Deploy", isPageId: true },
  comms: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Comms Tracker (inline DB)", isPageId: true },
  milestones: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Milestones (inline DB)", isPageId: true },
  budget: { databaseId: "964857d01c6647669a134a0375f6bcd2", label: "💰 Money", isPageId: true },
  sponsors: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "Sponsors (from Comms Tracker)", isPageId: true },
  announcements: { databaseId: "b60f493a780e4c5ca053f14b3ca5ad23", label: "IK26 Announcements", isPageId: true },
  schedule: { databaseId: "89f4bb096f6e40229f7cd100cee489c7", label: "📋 Event Day & FOH", isPageId: true },
  decisions: { databaseId: "dd700843bbe140ebbc43acb01b081dd6", label: "⚠️ Risk Register & Decision Log", isPageId: true },
  warroom: { databaseId: "c039a9bd04984885a1b96da9af7523dc", label: "🔥 Mission Control", isPageId: true },
};

// Auto-seed: if config is empty, pre-populate with defaults.
// Also patches existing entries whose isPageId flag is missing/wrong.
async function ensureDefaultConfig(): Promise<Record<string, any>> {
  let config = await getNotionConfig();
  const configuredTypes = Object.keys(config).filter((k) => config[k]?.databaseId);
  const now = new Date().toISOString();
  let changed = false;

  if (configuredTypes.length === 0) {
    // Fresh seed
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
    // Patch: ensure isPageId flag matches defaults for entries using default IDs
    for (const [type, def] of Object.entries(DEFAULT_NOTION_CONFIG)) {
      const entry = config[type];
      if (entry && entry.databaseId === def.databaseId && def.isPageId && !entry.isPageId) {
        entry.isPageId = true;
        // Clear stale resolved DB IDs so re-discovery happens
        delete entry._resolvedDbId;
        delete entry._resolvedDbTitle;
        delete entry._resolvedAt;
        changed = true;
      }
      // Also seed any missing types
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
  const notionKey = _activeNotionKey || Deno.env.get("NOTION_API_KEY");
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
// For pages, discovers inline child_database blocks and queries the best match.
// Also has auto-detection: if a direct DB query fails with "is a page" error,
// it retries via inline DB discovery.
async function smartQueryNotionContent(
  configEntry: any,
  type: string,
  sorts?: any[],
  filter?: any,
): Promise<any[]> {
  // If not flagged as page, try direct database query first
  if (!configEntry.isPageId) {
    try {
      return await queryNotionDatabase2(configEntry.databaseId, sorts, filter);
    } catch (err: any) {
      // Auto-detect: if Notion says "is a page, not a database", retry as page
      if (err.message && err.message.includes("is a page, not a database")) {
        console.log(`Auto-detected ${configEntry.databaseId} as a page (not database) for type ${type}, switching to inline DB discovery`);
        // Update config so future calls skip the failed attempt
        const config = await getNotionConfig();
        if (config[type]) {
          config[type].isPageId = true;
          await saveNotionConfig(config);
        }
        configEntry.isPageId = true;
        // Fall through to page handling below
      } else {
        throw err; // Re-throw non-page errors
      }
    }
  }

  // If we previously resolved the inline DB ID, use it
  if (configEntry._resolvedDbId) {
    try {
      return await queryNotionDatabase2(configEntry._resolvedDbId, sorts, filter);
    } catch {
      // Resolution may be stale, fall through to re-discover
      console.log(`Stale resolved DB ID for ${type}, re-discovering inline databases`);
    }
  }

  // For page IDs, find inline databases and query them
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

  console.log(`Page ${configEntry.databaseId} → found ${inlineDbs.length} inline DBs, querying "${targetDb.title}" (${targetDb.id}) for type ${type}`);

  // Cache the discovered database ID for faster future queries
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

app.post("/make-server-5ed426e6/notion/content/:type/configure", async (c) => {
  try {
    const type = c.req.param("type") as NotionContentType;
    const { databaseId, label, isPageId } = await c.req.json();

    if (!databaseId) {
      return c.json({ error: "Missing databaseId" }, 400);
    }

    const notionKey = resolveNotionKey(c);
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured. Set it via environment variable or Admin Panel → Settings." }, 500);
    }

    try {
      let dbTitle = label || "Untitled";
      let properties: string[] = [];
      let resolvedAsPage = false;

      // Try as database first
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
        // Try as page ID — check if it's a valid page with inline databases
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

app.get("/make-server-5ed426e6/notion/content/:type/configure", async (c) => {
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

app.get("/make-server-5ed426e6/notion/content/:type/pull", async (c) => {
  try {
    resolveNotionKey(c); // Ensure header-provided key is available to downstream helpers
    const type = c.req.param("type");
    const forceRefresh = c.req.query("force") === "true";
    // Auto-seed config if empty
    const config = await ensureDefaultConfig();
    const entry = config[type];

    if (!entry) {
      return c.json({ items: [], configured: false, error: "Not configured" });
    }

    const cacheKey = `ik26:notion:cache:${type}`;
    const now = Date.now();

    if (!forceRefresh) {
      const cached: any = await kv.get(cacheKey);
      if (cached && now - cached.cachedAt < CONTENT_CACHE_TTL_MS) {
        return c.json({ items: cached.data, cached: true, stale: false, lastPulled: cached.cachedAt, itemCount: cached.data.length });
      }
    }

    // Use smart query to handle both database IDs and page IDs
    const results = await smartQueryNotionContent(entry, type);
    const items = results.map(extractAllProperties);
    await kv.set(cacheKey, { data: items, cachedAt: now });

    await appendSyncLog({ type, action: "pulled", itemCount: items.length, timestamp: new Date().toISOString() });

    return c.json({ items, cached: false, stale: false, lastPulled: now, itemCount: items.length });
  } catch (err: any) {
    console.log(`Error pulling Notion content (${c.req.param("type")}):`, err);

    const cacheKey = `ik26:notion:cache:${c.req.param("type")}`;
    const stale: any = await kv.get(cacheKey);
    if (stale) {
      return c.json({ items: stale.data, cached: true, stale: true, lastPulled: stale.cachedAt, itemCount: stale.data.length, error: `Using stale cache: ${err.message}` });
    }
    return c.json({ items: [], error: `Pull failed: ${err.message}` }, 500);
  }
});

// ── Push an update back to Notion (two-way sync) ────────────────

app.put("/make-server-5ed426e6/notion/content/:type/push/:pageId", async (c) => {
  try {
    const type = c.req.param("type");
    const pageId = c.req.param("pageId");
    const { properties } = await c.req.json();

    const notionKey = resolveNotionKey(c);
    if (!notionKey) return c.json({ error: "NOTION_API_KEY not configured" }, 500);
    if (!properties || typeof properties !== "object") return c.json({ error: "Missing properties object" }, 400);

    // Build Notion-format properties
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

app.get("/make-server-5ed426e6/notion/content/sources", async (c) => {
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

app.post("/make-server-5ed426e6/notion/content/sync-all", async (c) => {
  try {
    resolveNotionKey(c);
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

    return c.json({ results, syncedAt: new Date().toISOString() });
  } catch (err) {
    console.log("Error syncing all Notion content:", err);
    return c.json({ error: `Sync all failed: ${err}` }, 500);
  }
});

// ── Check for changes (lightweight — uses last_edited_time) ─────

app.get("/make-server-5ed426e6/notion/content/check-changes", async (c) => {
  try {
    resolveNotionKey(c);
    const config = await ensureDefaultConfig();
    const changes: Record<string, { hasChanges: boolean; latestEdit: string | null }> = {};

    for (const type of NOTION_CONTENT_TYPES) {
      const entry = config[type];
      if (!entry) continue;

      const cacheKey = `ik26:notion:cache:${type}`;
      const cached: any = await kv.get(cacheKey);

      if (!cached) {
        changes[type] = { hasChanges: true, latestEdit: null };
        continue;
      }

      try {
        // Use smart query which handles page IDs with inline DB discovery
        const results = await smartQueryNotionContent(
          entry, type,
          [{ timestamp: "last_edited_time", direction: "descending" }],
        );
        if (results.length > 0) {
          const latestEdit = results[0].last_edited_time;
          const cachedTime = new Date(cached.cachedAt).toISOString();
          changes[type] = { hasChanges: latestEdit > cachedTime, latestEdit };
        } else {
          changes[type] = { hasChanges: false, latestEdit: null };
        }
      } catch {
        changes[type] = { hasChanges: true, latestEdit: null };
      }
    }

    return c.json({ changes });
  } catch (err) {
    console.log("Error checking Notion changes:", err);
    return c.json({ error: `Change check failed: ${err}` }, 500);
  }
});

// ── Get sync log ────────────────────────────────────────────────

app.get("/make-server-5ed426e6/notion/content/sync-log", async (c) => {
  try {
    const log = (await kv.get("ik26:notion:sync-log")) || [];
    return c.json({ log });
  } catch (err) {
    console.log("Error loading sync log:", err);
    return c.json({ error: `Failed to load sync log: ${err}` }, 500);
  }
});

// ── Auto-configure all defaults at once ─────────────────────────

app.post("/make-server-5ed426e6/notion/content/auto-configure", async (c) => {
  try {
    const notionKey = resolveNotionKey(c);
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured. Set it via environment variable or Admin Panel → Settings." }, 500);
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

app.get("/make-server-5ed426e6/notion/discover-inline-dbs/:pageId", async (c) => {
  try {
    resolveNotionKey(c);
    const pageId = c.req.param("pageId");
    const databases = await findInlineDatabases(pageId);
    return c.json({ databases, count: databases.length });
  } catch (err: any) {
    console.log("Error discovering inline databases:", err);
    return c.json({ error: `Discovery failed: ${err.message}` }, 500);
  }
});

// ── Remove a content type configuration ─────────────────────────

app.delete("/make-server-5ed426e6/notion/content/:type/configure", async (c) => {
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

// ─── Expense & Reimbursement System ────────────────────────────
// KV key pattern: ik26:expense:{id}
// Receipt files stored in Supabase Storage bucket

const EXPENSE_BUCKET = "make-5ed426e6-receipts";

// Ensure receipt bucket exists on startup
(async () => {
  try {
    const admin = getAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === EXPENSE_BUCKET);
    if (!bucketExists) {
      await admin.storage.createBucket(EXPENSE_BUCKET, { public: false });
      console.log(`Created storage bucket: ${EXPENSE_BUCKET}`);
    }
  } catch (err) {
    console.log("Error ensuring receipt bucket:", err);
  }
})();

// Submit new expense
app.post("/make-server-5ed426e6/expenses", async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, submitted_by, role_team, expense_category, description, amount, receipt_base64, receipt_filename, date_submitted, notes } = body;

    if (!submitted_by || !expense_category || !amount) {
      return c.json({ error: "Missing required fields: submitted_by, expense_category, amount" }, 400);
    }

    const id = crypto.randomUUID();
    let receipt_url = "";

    // Upload receipt if provided (base64 encoded)
    if (receipt_base64 && receipt_filename) {
      try {
        const admin = getAdminClient();
        const ext = receipt_filename.split(".").pop() || "jpg";
        const filePath = `receipts/${id}.${ext}`;

        // Decode base64 to Uint8Array
        const binaryString = atob(receipt_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const contentTypes: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
          webp: "image/webp", gif: "image/gif", pdf: "application/pdf",
        };
        const contentType = contentTypes[ext.toLowerCase()] || "application/octet-stream";

        const { error: uploadError } = await admin.storage
          .from(EXPENSE_BUCKET)
          .upload(filePath, bytes, { contentType, upsert: true });

        if (uploadError) {
          console.log("Receipt upload error:", uploadError);
        } else {
          const { data: signedData } = await admin.storage
            .from(EXPENSE_BUCKET)
            .createSignedUrl(filePath, 60 * 60 * 24 * 365);
          if (signedData) receipt_url = signedData.signedUrl;
        }
      } catch (uploadErr) {
        console.log("Receipt upload failed:", uploadErr);
      }
    }

    const expense = {
      id,
      user_id: user_id || "",
      submitted_by,
      role_team: role_team || "",
      expense_category,
      description: description || "",
      amount: parseFloat(amount),
      receipt_url,
      status: "Pending",
      approved_by: "",
      date_submitted: date_submitted || new Date().toISOString(),
      date_paid: "",
      notes: notes || "",
      created_at: new Date().toISOString(),
    };

    await kv.set(`ik26:expense:${id}`, expense);
    console.log(`Expense saved: ${id} by ${submitted_by} ($${amount})`);

    return c.json({ success: true, expense });
  } catch (err) {
    console.log("Error saving expense:", err);
    return c.json({ error: `Failed to save expense: ${err}` }, 500);
  }
});

// Get all expenses
app.get("/make-server-5ed426e6/expenses", async (c) => {
  try {
    const expenses = await kv.getByPrefix("ik26:expense:");
    const sorted = (expenses || [])
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json({ expenses: sorted });
  } catch (err) {
    console.log("Error loading expenses:", err);
    return c.json({ error: `Failed to load expenses: ${err}` }, 500);
  }
});

// Get expenses by user
app.get("/make-server-5ed426e6/expenses/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const expenses = await kv.getByPrefix("ik26:expense:");
    const filtered = (expenses || [])
      .filter((e: any) => e && (e.user_id === userId || e.submitted_by === userId))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json({ expenses: filtered });
  } catch (err) {
    console.log("Error loading user expenses:", err);
    return c.json({ error: `Failed to load user expenses: ${err}` }, 500);
  }
});

// Update expense status (leadership: approve/deny/pay)
app.put("/make-server-5ed426e6/expenses/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, approved_by, notes } = await c.req.json();

    if (!status || !["Pending", "Approved", "Denied", "Paid"].includes(status)) {
      return c.json({ error: "Invalid status. Must be: Pending, Approved, Denied, Paid" }, 400);
    }

    const expense = await kv.get(`ik26:expense:${id}`);
    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }

    (expense as any).status = status;
    if (approved_by) (expense as any).approved_by = approved_by;
    if (notes !== undefined) (expense as any).notes = notes;
    if (status === "Paid") (expense as any).date_paid = new Date().toISOString();

    await kv.set(`ik26:expense:${id}`, expense);
    console.log(`Expense ${id} status updated to ${status}`);

    return c.json({ success: true, expense });
  } catch (err) {
    console.log("Error updating expense status:", err);
    return c.json({ error: `Failed to update expense: ${err}` }, 500);
  }
});

// Delete expense
app.delete("/make-server-5ed426e6/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`ik26:expense:${id}`);
    console.log(`Expense ${id} deleted`);
    return c.json({ success: true });
  } catch (err) {
    console.log("Error deleting expense:", err);
    return c.json({ error: `Failed to delete expense: ${err}` }, 500);
  }
});

// Expense summary (for finance dashboard cards)
app.get("/make-server-5ed426e6/expenses/summary", async (c) => {
  try {
    const expenses = await kv.getByPrefix("ik26:expense:");
    const all = (expenses || []).filter(Boolean);

    let totalAmount = 0, pendingAmount = 0, approvedAmount = 0, paidAmount = 0, deniedAmount = 0;
    let pendingCount = 0, approvedCount = 0, paidCount = 0, deniedCount = 0;
    const byCategory: Record<string, number> = {};
    const byPerson: Record<string, { total: number; pending: number; approved: number; paid: number; denied: number; count: number }> = {};

    for (const e of all) {
      const exp = e as any;
      const amt = exp.amount || 0;
      totalAmount += amt;

      if (exp.status === "Pending") { pendingAmount += amt; pendingCount++; }
      else if (exp.status === "Approved") { approvedAmount += amt; approvedCount++; }
      else if (exp.status === "Paid") { paidAmount += amt; paidCount++; }
      else if (exp.status === "Denied") { deniedAmount += amt; deniedCount++; }

      const cat = exp.expense_category || "Misc";
      byCategory[cat] = (byCategory[cat] || 0) + amt;

      const person = exp.submitted_by || "Unknown";
      if (!byPerson[person]) {
        byPerson[person] = { total: 0, pending: 0, approved: 0, paid: 0, denied: 0, count: 0 };
      }
      byPerson[person].total += amt;
      byPerson[person].count++;
      if (exp.status === "Pending") byPerson[person].pending += amt;
      else if (exp.status === "Approved") byPerson[person].approved += amt;
      else if (exp.status === "Paid") byPerson[person].paid += amt;
      else if (exp.status === "Denied") byPerson[person].denied += amt;
    }

    return c.json({
      total: all.length,
      totalAmount,
      pending: { count: pendingCount, amount: pendingAmount },
      approved: { count: approvedCount, amount: approvedAmount },
      paid: { count: paidCount, amount: paidAmount },
      denied: { count: deniedCount, amount: deniedAmount },
      byCategory,
      byPerson,
    });
  } catch (err) {
    console.log("Error loading expense summary:", err);
    return c.json({ error: `Failed to load expense summary: ${err}` }, 500);
  }
});

// ─── IK26 CRM Integration Routes ──────────────────────────────────
// Support for Organizations, Contacts, Opportunities, Activities sync
// Used by Google Apps Script flows and Figma Make app

// Upsert IK26 sponsors table (confirmed opportunities only)
app.post("/make-server-5ed426e6/ik26/sponsors/upsert", async (c) => {
  try {
    const body = await c.req.json();
    const { sponsors } = body; // Array of sponsor objects

    if (!Array.isArray(sponsors) || sponsors.length === 0) {
      return c.json({ error: "sponsors array is required" }, 400);
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();

    // Upsert each sponsor
    const results = [];
    for (const sponsor of sponsors) {
      const { error } = await admin
        .from("ik26_sponsors")
        .upsert({
          id: sponsor.id,
          org_name: sponsor.org_name,
          type: sponsor.type,
          partner_tier: sponsor.partner_tier,
          logo_url: sponsor.logo_url || null,
          story_blurb: sponsor.story_blurb || null,
          visibility_score: sponsor.visibility_score || null,
          confirmed_date: sponsor.confirmed_date || now,
          synced_at: now,
        }, { onConflict: 'id' });

      if (error) {
        console.log(`Error upserting sponsor ${sponsor.id}:`, error);
        results.push({ id: sponsor.id, success: false, error: error.message });
      } else {
        results.push({ id: sponsor.id, success: true });
      }
    }

    return c.json({ success: true, results, count: results.filter(r => r.success).length });
  } catch (err) {
    console.log("Error upserting IK26 sponsors:", err);
    return c.json({ error: `Sponsor upsert failed: ${err}` }, 500);
  }
});

// Upsert IK26 organizations table
app.post("/make-server-5ed426e6/ik26/orgs/upsert", async (c) => {
  try {
    const body = await c.req.json();
    const { orgs } = body; // Array of organization objects

    if (!Array.isArray(orgs) || orgs.length === 0) {
      return c.json({ error: "orgs array is required" }, 400);
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();

    const results = [];
    for (const org of orgs) {
      const { error } = await admin
        .from("ik26_orgs")
        .upsert({
          id: org.id,
          name: org.name,
          type: org.type,
          region: org.region || null,
          ik_chapter: org.ik_chapter || null,
          community_impact: org.community_impact || [],
          synced_at: now,
        }, { onConflict: 'id' });

      if (error) {
        console.log(`Error upserting org ${org.id}:`, error);
        results.push({ id: org.id, success: false, error: error.message });
      } else {
        results.push({ id: org.id, success: true });
      }
    }

    return c.json({ success: true, results, count: results.filter(r => r.success).length });
  } catch (err) {
    console.log("Error upserting IK26 orgs:", err);
    return c.json({ error: `Org upsert failed: ${err}` }, 500);
  }
});

// Get all confirmed sponsors (for public-facing app)
app.get("/make-server-5ed426e6/ik26/sponsors", async (c) => {
  try {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from("ik26_sponsors")
      .select("*")
      .order("confirmed_date", { ascending: false });

    if (error) throw error;
    return c.json({ sponsors: data || [] });
  } catch (err) {
    console.log("Error fetching IK26 sponsors:", err);
    return c.json({ error: `Failed to fetch sponsors: ${err}` }, 500);
  }
});

// Get all organizations
app.get("/make-server-5ed426e6/ik26/orgs", async (c) => {
  try {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from("ik26_orgs")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return c.json({ orgs: data || [] });
  } catch (err) {
    console.log("Error fetching IK26 orgs:", err);
    return c.json({ error: `Failed to fetch orgs: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);