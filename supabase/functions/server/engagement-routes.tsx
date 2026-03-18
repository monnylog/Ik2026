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

// ─── Pinned Messages ──────────────────────────────────────────
// KV key: ik26:pins:{channelId} = { messageIds: string[], pinnedBy: Record<string, { userId: string, at: string }> }

engagement.get("/make-server-5ed426e6/pins/:channelId", async (c) => {
  try {
    const channelId = c.req.param("channelId");
    const data: any = (await kv.get(`ik26:pins:${channelId}`)) || { messageIds: [], pinnedBy: {} };
    return c.json({ pins: data });
  } catch (err) {
    console.log("Error loading pins:", err);
    return c.json({ error: `Failed to load pins: ${err}` }, 500);
  }
});

engagement.post("/make-server-5ed426e6/pins", async (c) => {
  try {
    const { channelId, messageId, userId, action } = await c.req.json();
    if (!channelId || !messageId) {
      return c.json({ error: "Missing channelId or messageId" }, 400);
    }
    const key = `ik26:pins:${channelId}`;
    const data: any = (await kv.get(key)) || { messageIds: [], pinnedBy: {} };
    if (action === "unpin") {
      data.messageIds = (data.messageIds || []).filter((id: string) => id !== messageId);
      delete data.pinnedBy?.[messageId];
    } else {
      if (!(data.messageIds || []).includes(messageId)) {
        data.messageIds = [...(data.messageIds || []), messageId];
      }
      data.pinnedBy = { ...(data.pinnedBy || {}), [messageId]: { userId: userId || "unknown", at: new Date().toISOString() } };
    }
    await kv.set(key, data);
    return c.json({ ok: true, pins: data });
  } catch (err) {
    console.log("Error saving pin:", err);
    return c.json({ error: `Failed to save pin: ${err}` }, 500);
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

// ─── Notification Preferences ─────────────────────────────────
// KV key pattern: ik26:notif-prefs:{userId}

engagement.get("/make-server-5ed426e6/notification-prefs/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const prefs = await kv.get(`ik26:notif-prefs:${userId}`);
    return c.json({ prefs: prefs || { sound: true, mentions: true, replies: true } });
  } catch (err) {
    console.log("Error loading notification prefs:", err);
    return c.json({ error: `Failed to load notification prefs: ${err}` }, 500);
  }
});

engagement.put("/make-server-5ed426e6/notification-prefs/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const prefs = await c.req.json();
    await kv.set(`ik26:notif-prefs:${userId}`, prefs);
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving notification prefs:", err);
    return c.json({ error: `Failed to save notification prefs: ${err}` }, 500);
  }
});

// ─── Voice Notes ──────────────────────────────────────────────
// KV key pattern: ik26:voice:{id}

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

engagement.post("/make-server-5ed426e6/voice-notes", async (c) => {
  try {
    const body = await c.req.json();
    const { id, author, avatarId, transcript, audioUrl, timestamp, userId } = body;
    if (!id || !author) {
      return c.json({ error: "Missing required fields (id, author)" }, 400);
    }
    const key = `ik26:voice:${id}`;
    await kv.set(key, { id, author, avatarId, transcript, audioUrl, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving voice note:", err);
    return c.json({ error: `Failed to save voice note: ${err}` }, 500);
  }
});

// ─── Memory Wall ──────────────────────────────────────────────
// KV key pattern: ik26:memory-wall:{id}

engagement.get("/make-server-5ed426e6/memory-wall", async (c) => {
  try {
    const posts = await kv.getByPrefix("ik26:memory-wall:");
    posts.sort((a: any, b: any) => (b.id || "").localeCompare(a.id || ""));
    return c.json({ posts });
  } catch (err) {
    console.log("Error loading memory wall:", err);
    return c.json({ error: `Failed to load memory wall: ${err}` }, 500);
  }
});

engagement.post("/make-server-5ed426e6/memory-wall", async (c) => {
  try {
    const body = await c.req.json();
    const { id, author, avatarId, title, description, imageUrl, category, timestamp, userId } = body;
    if (!id || !author) {
      return c.json({ error: "Missing required fields (id, author)" }, 400);
    }
    const key = `ik26:memory-wall:${id}`;
    await kv.set(key, { id, author, avatarId, title, description, imageUrl, category, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving memory wall post:", err);
    return c.json({ error: `Failed to save memory wall post: ${err}` }, 500);
  }
});

// ─── Flavor Fusion ────────────────────────────────────────────
// KV key pattern: ik26:flavor-fusion:{id}

engagement.get("/make-server-5ed426e6/flavor-fusion", async (c) => {
  try {
    const ideas = await kv.getByPrefix("ik26:flavor-fusion:");
    ideas.sort((a: any, b: any) => (b.id || "").localeCompare(a.id || ""));
    return c.json({ ideas });
  } catch (err) {
    console.log("Error loading flavor fusion:", err);
    return c.json({ error: `Failed to load flavor fusion: ${err}` }, 500);
  }
});

engagement.post("/make-server-5ed426e6/flavor-fusion", async (c) => {
  try {
    const body = await c.req.json();
    const { id, ingredientA, ingredientB, author, avatarId, idea, timestamp, userId } = body;
    if (!id || !author) {
      return c.json({ error: "Missing required fields (id, author)" }, 400);
    }
    const key = `ik26:flavor-fusion:${id}`;
    await kv.set(key, { id, ingredientA, ingredientB, author, avatarId, idea, timestamp, userId });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving flavor fusion idea:", err);
    return c.json({ error: `Failed to save flavor fusion idea: ${err}` }, 500);
  }
});

// ─── Trivia Answers ───────────────────────────────────────────
// KV key pattern: ik26:trivia:{triviaId}:{id}

engagement.get("/make-server-5ed426e6/trivia-answers/:triviaId", async (c) => {
  try {
    const triviaId = c.req.param("triviaId");
    const answers = await kv.getByPrefix(`ik26:trivia:${triviaId}:`);
    return c.json({ answers });
  } catch (err) {
    console.log("Error loading trivia answers:", err);
    return c.json({ error: `Failed to load trivia answers: ${err}` }, 500);
  }
});

engagement.post("/make-server-5ed426e6/trivia-answers", async (c) => {
  try {
    const body = await c.req.json();
    const { triviaId, id, author, avatarId, answerId, userId } = body;
    if (!triviaId || !id) {
      return c.json({ error: "Missing required fields (triviaId, id)" }, 400);
    }
    const key = `ik26:trivia:${triviaId}:${id}`;
    await kv.set(key, { triviaId, id, author, avatarId, answerId, userId, timestamp: new Date().toISOString() });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving trivia answer:", err);
    return c.json({ error: `Failed to save trivia answer: ${err}` }, 500);
  }
});

// ─── All Prompt Responses (aggregate) ─────────────────────────
engagement.get("/make-server-5ed426e6/all-prompt-responses", async (c) => {
  try {
    const responses = await kv.getByPrefix("ik26:prompt-resp:");
    responses.sort((a: any, b: any) => (b.id || "").localeCompare(a.id || ""));
    return c.json({ responses });
  } catch (err) {
    console.log("Error loading all prompt responses:", err);
    return c.json({ error: `Failed to load all prompt responses: ${err}` }, 500);
  }
});

// ─── Engagement Stats (aggregate) ─────────────────────────────
engagement.get("/make-server-5ed426e6/engagement-stats", async (c) => {
  try {
    const [messages, voiceNotes, memoryPosts, fusionIdeas, promptResponses, recipeSpins] = await Promise.all([
      kv.getByPrefix("ik26:msg:"),
      kv.getByPrefix("ik26:voice:"),
      kv.getByPrefix("ik26:memory-wall:"),
      kv.getByPrefix("ik26:flavor-fusion:"),
      kv.getByPrefix("ik26:prompt-resp:"),
      kv.getByPrefix("ik26:recipe-spin:"),
    ]);
    
    // Count unique users who answered prompts today
    const today = new Date().toISOString().split("T")[0];
    const dailyPromptUsers = new Set(
      promptResponses
        .filter((r: any) => r.timestamp?.startsWith(today))
        .map((r: any) => r.userId)
    ).size;
    
    return c.json({
      messageCount: messages.length,
      voiceNoteCount: voiceNotes.length,
      memoryPostCount: memoryPosts.length,
      fusionIdeaCount: fusionIdeas.length,
      promptResponseCount: promptResponses.length,
      recipeSpinCount: recipeSpins.length,
      dailyPromptUsers,
      totalEngagement: messages.length + voiceNotes.length + memoryPosts.length + fusionIdeas.length + promptResponses.length + recipeSpins.length,
    });
  } catch (err) {
    console.log("Error loading engagement stats:", err);
    return c.json({ error: `Failed to load engagement stats: ${err}` }, 500);
  }
});

// ─── Recipe Roulette Spins ────────────────────────────────────
// KV key pattern: ik26:recipe-spin:{id}

engagement.post("/make-server-5ed426e6/recipe-spins", async (c) => {
  try {
    const body = await c.req.json();
    const { id, userId, recipe, timestamp } = body;
    if (!id) {
      return c.json({ error: "Missing required field: id" }, 400);
    }
    const key = `ik26:recipe-spin:${id}`;
    await kv.set(key, { id, userId, recipe, timestamp: timestamp || new Date().toISOString() });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving recipe spin:", err);
    return c.json({ error: `Failed to save recipe spin: ${err}` }, 500);
  }
});

engagement.get("/make-server-5ed426e6/recipe-spins", async (c) => {
  try {
    const spins = await kv.getByPrefix("ik26:recipe-spin:");
    spins.sort((a: any, b: any) => (b.timestamp || "").localeCompare(a.timestamp || ""));
    return c.json({ spins, count: spins.length });
  } catch (err) {
    console.log("Error loading recipe spins:", err);
    return c.json({ error: `Failed to load recipe spins: ${err}` }, 500);
  }
});

// ─── TIER 4A: Analytics Engagement Tracking ──────────────────────
// KV key pattern: ik26:analytics:engagement:{id}

engagement.post("/make-server-5ed426e6/analytics/engagement", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, eventType, metadata } = body;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const key = `ik26:analytics:engagement:${id}`;
    await kv.set(key, {
      id,
      userId: userId || "anonymous",
      eventType,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });
    return c.json({ ok: true });
  } catch (err) {
    console.log("Error saving engagement event:", err);
    return c.json({ error: `Failed to save engagement event: ${err}` }, 500);
  }
});

engagement.get("/make-server-5ed426e6/analytics/engagement-summary", async (c) => {
  try {
    const [events, messages, memoryPosts, triviaAnswers, promptResponses] = await Promise.all([
      kv.getByPrefix("ik26:analytics:engagement:"),
      kv.getByPrefix("ik26:msg:"),
      kv.getByPrefix("ik26:memory-wall:"),
      kv.getByPrefix("ik26:trivia:"),
      kv.getByPrefix("ik26:prompt-resp:"),
    ]);

    let triviaCount = 0;
    let memoryCount = 0;
    const activeUserSet = new Set<string>();

    for (const evt of events) {
      if (evt.eventType === "trivia_answered") triviaCount++;
      if (evt.eventType === "memory_shared") memoryCount++;
      if (evt.userId && evt.userId !== "anonymous") activeUserSet.add(evt.userId);
    }

    const finalTrivia = triviaCount || triviaAnswers.length;
    const finalMemories = memoryCount || memoryPosts.length;

    for (const m of messages) {
      if (m.userId) activeUserSet.add(m.userId);
    }
    for (const p of promptResponses) {
      if (p.userId) activeUserSet.add(p.userId);
    }

    const metrics = {
      triviaAnswered: finalTrivia,
      memoriesShared: finalMemories,
      messagesPosted: messages.length,
      activeUsers: activeUserSet.size,
      totalInteractions: finalTrivia + finalMemories + messages.length + promptResponses.length,
    };

    return c.json({ metrics });
  } catch (err) {
    console.log("Error loading engagement summary:", err);
    return c.json({ error: `Failed to load engagement summary: ${err}` }, 500);
  }
});

// ─── TIER 3B: Discord Bridge for Comms Chat ─────────────────────
engagement.post("/make-server-5ed426e6/comms/discord-bridge", async (c) => {
  try {
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!webhookUrl) {
      return c.json({ ok: false, skipped: true, reason: "No DISCORD_WEBHOOK_URL configured" });
    }

    const { author, channel, message } = await c.req.json();
    if (!author || !message) {
      return c.json({ error: "Missing author or message" }, 400);
    }

    const payload = {
      username: "IK26 Comms Bridge",
      avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
      embeds: [{
        title: `#${channel || "general"}`,
        description: message,
        color: 0x2E4F52,
        footer: { text: `Sent by ${author} via IK26 Comms` },
        timestamp: new Date().toISOString(),
      }],
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      console.log("Discord webhook failed:", resp.status, await resp.text());
      return c.json({ ok: false, error: "Discord webhook failed" });
    }

    return c.json({ ok: true });
  } catch (err) {
    console.log("Error in Discord bridge:", err);
    return c.json({ ok: false, error: `Discord bridge error: ${err}` });
  }
});

// ─── TIER 3A: Milestone Completion Sync ─────────────────────────
engagement.post("/make-server-5ed426e6/task/milestone-complete", async (c) => {
  try {
    const { milestoneId } = await c.req.json();
    if (!milestoneId) {
      return c.json({ error: "Missing milestoneId" }, 400);
    }

    const notionKey = Deno.env.get("NOTION_API_KEY");
    if (!notionKey) {
      return c.json({ error: "NOTION_API_KEY not configured" }, 500);
    }

    // Update the Notion page status to "Done"
    const resp = await fetch(`https://api.notion.com/v1/pages/${milestoneId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        properties: {
          Status: { status: { name: "Done" } },
        },
      }),
    });

    if (!resp.ok) {
      const resp2 = await fetch(`https://api.notion.com/v1/pages/${milestoneId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${notionKey}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          properties: {
            Status: { select: { name: "Done" } },
          },
        }),
      });

      if (!resp2.ok) {
        const errText = await resp2.text();
        console.log("Notion milestone update failed:", errText);
        return c.json({ error: `Notion update failed: ${errText}` }, 500);
      }
    }

    return c.json({ ok: true, milestoneId });
  } catch (err) {
    console.log("Error completing milestone:", err);
    return c.json({ error: `Failed to complete milestone: ${err}` }, 500);
  }
});

export { engagement };