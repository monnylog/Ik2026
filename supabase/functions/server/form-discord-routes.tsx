import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const formDiscord = new Hono();

// ─── Form URLs Configuration ────────────────────────────────────
// Stores Google Form/Doc URLs in KV so leadership can update them
// without code changes. Key: ik26:config:form-urls

const DEFAULT_FORM_URLS: Record<string, string> = {
  chefOnboarding:
    "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf",
  travelKitchenNeeds:
    "https://www.notion.so/IK26-Form-B-Travel-Kitchen-Needs-326dc6047d2d81cf97aace133f7ff9d8",
  mediaRelease:
    "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - placeholder
  riderAgreement:
    "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - placeholder
  teamFeedback:
    "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - placeholder
  volunteerWaiver:
    "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - placeholder
};

const PLACEHOLDER_MARKERS = ["PENDING", "Example", "1FAIpQLSfExample"];

function isPlaceholder(url: string): boolean {
  return PLACEHOLDER_MARKERS.some((m) => url.includes(m));
}

// GET current form URLs
formDiscord.get("/make-server-5ed426e6/form-urls", async (c) => {
  try {
    const stored: Record<string, string> | null = await kv.get("ik26:config:form-urls");
    const urls = stored || DEFAULT_FORM_URLS;

    // Compute status per URL
    const status: Record<string, { url: string; isPlaceholder: boolean }> = {};
    let placeholderCount = 0;
    for (const [key, url] of Object.entries(urls)) {
      const placeholder = isPlaceholder(url);
      if (placeholder) placeholderCount++;
      status[key] = { url, isPlaceholder: placeholder };
    }

    return c.json({
      urls,
      status,
      placeholderCount,
      totalCount: Object.keys(urls).length,
      allProduction: placeholderCount === 0,
    });
  } catch (err) {
    console.log("Error loading form URLs:", err);
    return c.json({ error: `Failed to load form URLs: ${err}` }, 500);
  }
});

// PUT update form URLs (leadership only)
formDiscord.put("/make-server-5ed426e6/form-urls", async (c) => {
  try {
    const body = await c.req.json();
    const { urls } = body;

    if (!urls || typeof urls !== "object") {
      return c.json({ error: "Missing urls object" }, 400);
    }

    // Merge with existing (allow partial updates)
    const existing: Record<string, string> =
      (await kv.get("ik26:config:form-urls")) || { ...DEFAULT_FORM_URLS };

    const validKeys = Object.keys(DEFAULT_FORM_URLS);
    let updated = 0;
    for (const [key, url] of Object.entries(urls)) {
      if (validKeys.includes(key) && typeof url === "string" && (url as string).startsWith("https://")) {
        existing[key] = url as string;
        updated++;
      }
    }

    await kv.set("ik26:config:form-urls", existing);

    // Compute new status
    let placeholderCount = 0;
    for (const url of Object.values(existing)) {
      if (isPlaceholder(url)) placeholderCount++;
    }

    return c.json({
      success: true,
      updated,
      urls: existing,
      placeholderCount,
      allProduction: placeholderCount === 0,
    });
  } catch (err) {
    console.log("Error updating form URLs:", err);
    return c.json({ error: `Failed to update form URLs: ${err}` }, 500);
  }
});

// ─── Discord Webhook Notifications ──────────────────────────────
// Sends structured messages to a Discord #bot-alerts channel

formDiscord.post("/make-server-5ed426e6/discord/notify", async (c) => {
  try {
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!webhookUrl) {
      return c.json({ error: "DISCORD_WEBHOOK_URL not configured" }, 500);
    }

    const { title, description, color, fields, footer } = await c.req.json();

    if (!title) {
      return c.json({ error: "Missing title" }, 400);
    }

    // Build Discord embed
    const embed: any = {
      title,
      description: description || "",
      color: color || 0xc9a96e, // Gold default
      timestamp: new Date().toISOString(),
      footer: {
        text: footer || "Isang Kusina 2026 Bot",
      },
    };

    if (fields && Array.isArray(fields)) {
      embed.fields = fields.map((f: any) => ({
        name: f.name || "",
        value: f.value || "",
        inline: f.inline ?? true,
      }));
    }

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "IK26 Ops Bot",
        avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
        embeds: [embed],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.log("Discord webhook error:", resp.status, errText);
      return c.json({ error: `Discord webhook failed: HTTP ${resp.status}` }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log("Error sending Discord notification:", err);
    return c.json({ error: `Discord notification failed: ${err}` }, 500);
  }
});

// Test Discord webhook connectivity
formDiscord.get("/make-server-5ed426e6/discord/test", async (c) => {
  try {
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!webhookUrl) {
      return c.json({ configured: false, error: "DISCORD_WEBHOOK_URL not set" });
    }

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "IK26 Ops Bot",
        embeds: [{
          title: "Connection Test",
          description: "Discord webhook is connected and working.",
          color: 0x7e9e78,
          timestamp: new Date().toISOString(),
          footer: { text: "Isang Kusina 2026 Bot" },
        }],
      }),
    });

    return c.json({
      configured: true,
      connected: resp.ok,
      status: resp.status,
    });
  } catch (err: any) {
    return c.json({ configured: true, connected: false, error: err.message });
  }
});

// ─── Discord Multi-Channel Webhook Management ───────────────────
// Store and manage multiple Discord webhook URLs for different channels

// GET all configured Discord webhooks
formDiscord.get("/make-server-5ed426e6/discord/webhooks", async (c) => {
  try {
    const webhooks: Record<string, string> = await kv.get("ik26:discord:webhooks") || {};
    const channels = ["leadership-sync", "general", "kitchen", "travel", "creative", "logistics", "urgent"];
    
    const status: Record<string, { configured: boolean; url?: string }> = {};
    for (const channel of channels) {
      status[channel] = {
        configured: !!webhooks[channel],
        url: webhooks[channel] || undefined,
      };
    }
    
    return c.json({ webhooks, status });
  } catch (err) {
    console.log("Error loading Discord webhooks:", err);
    return c.json({ error: `Failed to load webhooks: ${err}` }, 500);
  }
});

// PUT update Discord webhook for a specific channel
formDiscord.put("/make-server-5ed426e6/discord/webhooks/:channel", async (c) => {
  try {
    const channel = c.req.param("channel");
    const body = await c.req.json();
    const { webhookUrl } = body;
    
    if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      return c.json({ error: "Invalid Discord webhook URL" }, 400);
    }
    
    const webhooks: Record<string, string> = await kv.get("ik26:discord:webhooks") || {};
    webhooks[channel] = webhookUrl;
    await kv.set("ik26:discord:webhooks", webhooks);
    
    return c.json({ success: true, channel, configured: true });
  } catch (err) {
    console.log("Error updating Discord webhook:", err);
    return c.json({ error: `Failed to update webhook: ${err}` }, 500);
  }
});

// POST send message to a specific Discord channel
formDiscord.post("/make-server-5ed426e6/discord/send/:channel", async (c) => {
  try {
    const channel = c.req.param("channel");
    const { content, embeds, username } = await c.req.json();
    
    // Get webhook URL for this channel
    const webhooks: Record<string, string> = await kv.get("ik26:discord:webhooks") || {};
    const webhookUrl = webhooks[channel] || Deno.env.get("DISCORD_WEBHOOK_URL");
    
    if (!webhookUrl) {
      return c.json({ error: `No webhook configured for channel: ${channel}` }, 404);
    }
    
    const payload: any = {
      username: username || "IK26 Ops Bot",
      avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    };
    
    if (content) payload.content = content;
    if (embeds) payload.embeds = embeds;
    
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      console.log(`Discord send error (${channel}):`, resp.status, errText);
      return c.json({ error: `Discord send failed: HTTP ${resp.status}` }, resp.status);
    }
    
    return c.json({ success: true, channel });
  } catch (err) {
    console.log("Error sending to Discord:", err);
    return c.json({ error: `Send failed: ${err}` }, 500);
  }
});

// ─── Data Import / Restore ──────────────────────────────────────
// Accepts the JSON structure from /export/full and restores data to KV

formDiscord.post("/make-server-5ed426e6/import/restore", async (c) => {
  try {
    const body = await c.req.json();
    const { data, options } = body;

    if (!data || typeof data !== "object") {
      return c.json({ error: "Missing data object. Use the output from /export/full." }, 400);
    }

    const merge = options?.merge !== false; // Default: merge (don't overwrite existing)
    const dryRun = options?.dryRun === true;
    const results: Record<string, { count: number; skipped: number; errors: string[] }> = {};

    // Helper: restore an array of items with a key pattern
    async function restoreCollection(
      items: any[],
      keyFn: (item: any) => string,
      label: string,
    ) {
      const stat = { count: 0, skipped: 0, errors: [] as string[] };
      for (const item of items || []) {
        try {
          const key = keyFn(item);
          if (!key) { stat.skipped++; continue; }

          if (merge) {
            const existing = await kv.get(key);
            if (existing) { stat.skipped++; continue; }
          }

          if (!dryRun) {
            await kv.set(key, item);
          }
          stat.count++;
        } catch (err: any) {
          stat.errors.push(err.message);
        }
      }
      results[label] = stat;
    }

    // Restore profiles
    if (data.profiles) {
      await restoreCollection(
        data.profiles,
        (p) => p.id ? `ik26:profile:${p.id}` : "",
        "profiles",
      );
    }

    // Restore expenses
    if (data.expenses) {
      await restoreCollection(
        data.expenses,
        (e) => e.id ? `ik26:expense:${e.id}` : "",
        "expenses",
      );
    }

    // Restore messages
    if (data.messages) {
      await restoreCollection(
        data.messages,
        (m) => (m.channelId && m.id) ? `ik26:msg:${m.channelId}:${m.id}` : "",
        "messages",
      );
    }

    // Restore memory wall posts
    if (data.memoryPosts) {
      await restoreCollection(
        data.memoryPosts,
        (p) => p.id ? `ik26:memory-wall:${p.id}` : "",
        "memoryPosts",
      );
    }

    // Restore flavor fusion ideas
    if (data.fusionIdeas) {
      await restoreCollection(
        data.fusionIdeas,
        (i) => i.id ? `ik26:flavor-fusion:${i.id}` : "",
        "fusionIdeas",
      );
    }

    // Restore voice notes
    if (data.voiceNotes) {
      await restoreCollection(
        data.voiceNotes,
        (v) => v.id ? `ik26:voice:${v.id}` : "",
        "voiceNotes",
      );
    }

    // Restore prompt responses
    if (data.promptResponses) {
      await restoreCollection(
        data.promptResponses,
        (r) => (r.promptId && r.id) ? `ik26:prompt-resp:${r.promptId}:${r.id}` : "",
        "promptResponses",
      );
    }

    // Restore Notion config
    if (data.notionConfig && !dryRun) {
      if (!merge || !(await kv.get("ik26:notion:config"))) {
        await kv.set("ik26:notion:config", data.notionConfig);
        results["notionConfig"] = { count: 1, skipped: 0, errors: [] };
      } else {
        results["notionConfig"] = { count: 0, skipped: 1, errors: [] };
      }
    }

    const totalRestored = Object.values(results).reduce((s, r) => s + r.count, 0);
    const totalSkipped = Object.values(results).reduce((s, r) => s + r.skipped, 0);

    return c.json({
      success: true,
      dryRun,
      merge,
      totalRestored,
      totalSkipped,
      results,
      restoredAt: new Date().toISOString(),
    });
  } catch (err) {
    console.log("Import/restore error:", err);
    return c.json({ error: `Import failed: ${err}` }, 500);
  }
});

export { formDiscord };