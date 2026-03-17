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