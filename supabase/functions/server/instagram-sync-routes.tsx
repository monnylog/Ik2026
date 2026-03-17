// ─── Instagram → Notion Sync Routes ──────────────────────────────
// Receives Instagram webhook events or manual sync calls
// Writes post metrics back to Notion Social Content Tracker
// Route: POST /ik26/instagram/sync
// Route: GET  /ik26/instagram/posts
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const instagramSync = new Hono();

const NOTION_SOCIAL_DB = "b5659ca6b94d4f26839bcb125c694393";
const NOTION_ACTIVITIES_DB = "83bf686887be418eae9133ca3990061d";
const NOTION_SYNCLOG_DB = "ff79dd821e714e6d9106ceab32c1eeca";

function getNotionKey(): string | null {
  return Deno.env.get("NOTION_API_KEY") || null;
}

// ── Write to Notion Sync Log ──────────────────────────────────────
async function logToNotionSyncLog(
  source: string,
  message: string,
  status: "Success" | "Failed" | "Partial"
) {
  const notionKey = getNotionKey();
  if (!notionKey) return;
  try {
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_SYNCLOG_DB },
        properties: {
          Name: { title: [{ text: { content: `${source}: ${message}` } }] },
          Status: { select: { name: status } },
          Timestamp: { date: { start: new Date().toISOString() } },
          Source: { select: { name: "Instagram" } },
        },
      }),
    });
  } catch (e) {
    console.error("Failed to log to Notion Sync Log:", e);
  }
}

// ── Update Notion Social Content Tracker with Instagram metrics ──
async function updateNotionPostMetrics(
  notionPageId: string,
  instagramPostUrl: string,
  engagement: number,
  impressions: number,
  status: string
) {
  const notionKey = getNotionKey();
  if (!notionKey) throw new Error("NOTION_API_KEY not configured");

  const properties: any = {
    Status: { select: { name: status } },
    "Instagram Post URL": { url: instagramPostUrl },
    Engagement: { number: engagement },
    Impressions: { number: impressions },
  };

  const resp = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${notionKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Notion update failed: ${err}`);
  }
  return await resp.json();
}

// ── Create Activity in Notion for published post ──────────────────
async function createActivityForPost(postTitle: string, instagramUrl: string) {
  const notionKey = getNotionKey();
  if (!notionKey) return;
  try {
    await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_ACTIVITIES_DB },
        properties: {
          Name: { title: [{ text: { content: `Published: ${postTitle}` } }] },
          Type: { select: { name: "DM" } },
          "Source Tool": { select: { name: "Instagram" } },
          "External Link": { url: instagramUrl },
          "date:Date:start": { date: { start: new Date().toISOString() } },
          Outcome: { select: { name: "Completed" } },
        },
      }),
    });
  } catch (e) {
    console.error("Failed to create Activity for post:", e);
  }
}

// ── POST /ik26/instagram/sync ─────────────────────────────────────
// Accepts: { posts: [{ notion_page_id, instagram_post_url, engagement, impressions, status, post_title }] }
instagramSync.post("/ik26/instagram/sync", async (c) => {
  const notionKey = getNotionKey();
  if (!notionKey) {
    return c.json({ error: "NOTION_API_KEY not configured" }, 500);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const posts = body.posts || [];
  if (!Array.isArray(posts) || posts.length === 0) {
    return c.json({ error: "posts array is required" }, 400);
  }

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      await updateNotionPostMetrics(
        post.notion_page_id,
        post.instagram_post_url,
        post.engagement || 0,
        post.impressions || 0,
        post.status || "Published"
      );

      // Also write to Supabase instagram_posts table
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/instagram_posts`, {
          method: "POST",
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({
            id: post.notion_page_id,
            notion_page_id: post.notion_page_id,
            post_title: post.post_title,
            platform: "Instagram",
            status: post.status || "Published",
            instagram_post_url: post.instagram_post_url,
            engagement: post.engagement || 0,
            impressions: post.impressions || 0,
            synced_at: new Date().toISOString(),
          }),
        });
      }

      // Create an Activity entry for published posts
      if (post.status === "Published" && post.post_title) {
        await createActivityForPost(post.post_title, post.instagram_post_url);
      }

      successCount++;
    } catch (e: any) {
      failCount++;
      errors.push(`${post.notion_page_id}: ${e.message}`);
    }
  }

  const status = failCount === 0 ? "Success" : successCount > 0 ? "Partial" : "Failed";
  await logToNotionSyncLog(
    "Instagram Sync",
    `${successCount} posts synced, ${failCount} failed`,
    status
  );

  return c.json({ success: true, synced: successCount, failed: failCount, errors });
});

// ── GET /ik26/instagram/posts ─────────────────────────────────────
// Returns published posts from Supabase instagram_posts table
instagramSync.get("/ik26/instagram/posts", async (c) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return c.json({ error: "Supabase not configured" }, 500);
  }

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/instagram_posts?select=*&status=eq.Published&order=synced_at.desc`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!resp.ok) {
    return c.json({ error: "Failed to fetch posts" }, 500);
  }

  const posts = await resp.json();
  return c.json({ posts });
});

export { instagramSync };
