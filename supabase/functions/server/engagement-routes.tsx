import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const engagement = new Hono();

// ─── Chat Messages ─────────────────────────────────────────────
// KV key pattern: ik26:msg:{channelId}:{timestamp}

engagement.post("/make-server-5ed426e6/messages", async (c) => {
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

engagement.get("/make-server-5ed426e6/messages/:channelId", async (c) => {
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

engagement.post("/make-server-5ed426e6/reactions", async (c) => {
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

engagement.get("/make-server-5ed426e6/reactions/:channelId", async (c) => {
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

engagement.post("/make-server-5ed426e6/prompt-responses", async (c) => {
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

engagement.get("/make-server-5ed426e6/prompt-responses/:promptId", async (c) => {
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

engagement.get("/make-server-5ed426e6/all-prompt-responses", async (c) => {
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

engagement.post("/make-server-5ed426e6/trivia-answers", async (c) => {
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

engagement.get("/make-server-5ed426e6/trivia-answers/:triviaId", async (c) => {
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

engagement.post("/make-server-5ed426e6/voice-notes", async (c) => {
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

engagement.get("/make-server-5ed426e6/voice-notes", async (c) => {
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

engagement.post("/make-server-5ed426e6/memory-wall", async (c) => {
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

engagement.get("/make-server-5ed426e6/memory-wall", async (c) => {
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

engagement.post("/make-server-5ed426e6/flavor-fusion", async (c) => {
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

engagement.get("/make-server-5ed426e6/flavor-fusion", async (c) => {
  try {
    const ideas = await kv.getByPrefix("ik26:flavor-fusion:");
    ideas.sort((a: any, b: any) => (a.id || "").localeCompare(b.id || ""));
    return c.json({ ideas });
  } catch (err) {
    console.log("Error loading flavor fusion ideas:", err);
    return c.json({ error: `Failed to load flavor fusion ideas: ${err}` }, 500);
  }
});

// ─── Engagement Stats (aggregated for manager dashboard) ────────
// Counts real entries from KV for each engagement type

engagement.get("/make-server-5ed426e6/engagement-stats", async (c) => {
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

export { engagement };
