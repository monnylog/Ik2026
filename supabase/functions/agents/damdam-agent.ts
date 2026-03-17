// ════════════════════════════════════════════════════════════════
// IK26 AGENT: DAMDAM (To Feel / To Sense)
// ════════════════════════════════════════════════════════════════
// Holds the emotional temperature of the room.
// Analyzes chef pulse checks, monitors milestones, seeds daily
// prompts, and celebrates wins in the team chat.
//
// Deployment: Supabase Edge Function (Deno)
// Trigger: Weekly cron (pulse analysis) + DB webhook (milestones)
// Stack: Supabase (PostgreSQL, Realtime, KV Store), Gemini API
// ════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ── Configuration ──────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const LEADERSHIP_EMAIL = "monica.istorya@gmail.com";

// Pulse thresholds
const LOW_PULSE_THRESHOLD = 3; // On a 1-5 scale
const DISTRESS_KEYWORDS = [
  "overwhelmed", "confused", "stressed", "anxious", "lost",
  "behind", "struggling", "frustrated", "burned out", "burnout",
  "too much", "can't keep up", "falling behind", "need help",
];

// Realtime channel for celebrations
const GENERAL_CHANNEL = "general";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── Types ──────────────────────────────────────────────────────
interface PulseCheck {
  id: string;
  chef_id: string;
  feeling_score: number;
  needs_text: string | null;
  week_label: string | null;
  created_at: string;
}

interface Milestone {
  id: string;
  title: string;
  status: string;
  division: string | null;
  owner: string | null;
  workstream: string | null;
  due_date: string | null;
  week: string | null;
}

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "weekly";

  const results = {
    action,
    pulseAnalyzed: false,
    milestoneCelebrations: 0,
    promptsSeeded: 0,
    alerts: 0,
    errors: [] as string[],
  };

  try {
    const db = getAdminClient();

    switch (action) {
      case "pulse":
        // Analyze pulse checks (weekly)
        await analyzePulseChecks(db, results);
        break;

      case "milestone":
        // Celebrate a completed milestone (triggered by webhook)
        const milestoneId = url.searchParams.get("milestone_id");
        if (milestoneId) {
          await celebrateMilestone(db, milestoneId, results);
        } else {
          // Check for recently completed milestones
          await checkRecentMilestones(db, results);
        }
        break;

      case "seed-prompts":
        // Seed the prompt_roulette table with a schedule
        await seedPromptSchedule(db, results);
        break;

      case "weekly":
      default:
        // Full weekly run
        await analyzePulseChecks(db, results);
        await checkRecentMilestones(db, results);
        break;
    }

    console.log(`[Damdam] Complete (${action}): pulse=${results.pulseAnalyzed}, celebrations=${results.milestoneCelebrations}, alerts=${results.alerts}`);

    return new Response(JSON.stringify({ ok: true, agent: "damdam", ...results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[Damdam] Fatal error:", err);
    return new Response(JSON.stringify({ ok: false, agent: "damdam", error: err.message, ...results }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ── 1. Analyze Pulse Checks ───────────────────────────────────
async function analyzePulseChecks(db: ReturnType<typeof createClient>, results: any) {
  try {
    // Get pulse checks from the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: pulses, error } = await db
      .from("chef_pulse_checks")
      .select("*, chefs(name)")
      .gte("created_at", oneWeekAgo)
      .order("created_at", { ascending: false });

    if (error || !pulses || pulses.length === 0) {
      console.log("[Damdam] No pulse checks in the last 7 days");
      results.pulseAnalyzed = true;
      return;
    }

    // Calculate aggregate stats
    const scores = pulses.map((p: any) => p.feeling_score);
    const avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Check for distress signals in needs_text
    const distressFlags: { chefName: string; text: string; score: number; keywords: string[] }[] = [];

    for (const pulse of pulses as (PulseCheck & { chefs: { name: string } })[]) {
      if (pulse.needs_text) {
        const lowerText = pulse.needs_text.toLowerCase();
        const matchedKeywords = DISTRESS_KEYWORDS.filter(kw => lowerText.includes(kw));

        if (matchedKeywords.length > 0 || pulse.feeling_score <= 2) {
          distressFlags.push({
            chefName: pulse.chefs?.name || "Unknown",
            text: pulse.needs_text,
            score: pulse.feeling_score,
            keywords: matchedKeywords,
          });
        }
      }
    }

    // Determine if we need to alert leadership
    const needsAlert = avgScore < LOW_PULSE_THRESHOLD || distressFlags.length > 0;

    if (needsAlert) {
      await sendPulseAlert(db, {
        avgScore,
        minScore,
        maxScore,
        totalResponses: pulses.length,
        distressFlags,
      });
      results.alerts++;
    }

    // Generate a pulse summary using Gemini (for leadership context)
    if (GEMINI_API_KEY && pulses.length >= 3) {
      const needsTexts = pulses
        .filter((p: any) => p.needs_text)
        .map((p: any) => `- Score ${p.feeling_score}/5: "${p.needs_text}"`)
        .join("\n");

      const analysisPrompt = `Analyze these weekly pulse check responses from chefs preparing for Isang Kusina 2026 (a collaborative Filipino dinner event on May 22, 2026).

AGGREGATE DATA:
- ${pulses.length} responses this week
- Average feeling score: ${avgScore.toFixed(1)}/5
- Range: ${minScore} to ${maxScore}

INDIVIDUAL RESPONSES (anonymous to the reader, but you can see patterns):
${needsTexts || "No written responses this week."}

Write a brief (100-150 word) pulse summary for leadership. Identify:
1. The overall emotional temperature (one sentence)
2. Any patterns in what people need
3. One specific, actionable suggestion for the team

Be honest but not alarmist. This is a caring check-in, not a crisis report. No em dashes.`;

      const analysis = await callGemini(analysisPrompt);

      if (analysis) {
        await db.from("activity_feed").insert({
          message: `[Damdam] Weekly pulse analysis: avg ${avgScore.toFixed(1)}/5 from ${pulses.length} responses`,
          type: "pulse_analysis",
          metadata: {
            agent: "damdam",
            avgScore: parseFloat(avgScore.toFixed(1)),
            minScore,
            maxScore,
            totalResponses: pulses.length,
            distressFlagCount: distressFlags.length,
            analysis,
          },
        });
      }
    }

    results.pulseAnalyzed = true;

  } catch (err: any) {
    results.errors.push(`Pulse analysis error: ${err.message}`);
  }
}

// ── 2. Celebrate Milestones ────────────────────────────────────
async function checkRecentMilestones(db: ReturnType<typeof createClient>, results: any) {
  try {
    // Find milestones marked "Done" in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: milestones } = await db
      .from("milestones")
      .select("*")
      .eq("status", "Done")
      .gte("created_at", oneDayAgo);

    if (!milestones || milestones.length === 0) return;

    for (const milestone of milestones as Milestone[]) {
      // Check if we already celebrated this one
      const { data: existing } = await db
        .from("activity_feed")
        .select("id")
        .eq("type", "milestone_celebration")
        .ilike("message", `%${milestone.id}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await celebrateMilestone(db, milestone.id, results, milestone);
    }
  } catch (err: any) {
    results.errors.push(`Milestone check error: ${err.message}`);
  }
}

async function celebrateMilestone(
  db: ReturnType<typeof createClient>,
  milestoneId: string,
  results: any,
  milestone?: Milestone
) {
  try {
    // Fetch milestone if not provided
    if (!milestone) {
      const { data } = await db
        .from("milestones")
        .select("*")
        .eq("id", milestoneId)
        .single();
      milestone = data as Milestone;
    }

    if (!milestone) return;

    // Generate a celebration message
    let celebrationMsg = `${milestone.title} is DONE!`;

    if (GEMINI_API_KEY) {
      const prompt = `Write a one-line celebration message (under 30 words) for the Isang Kusina 2026 team. The milestone completed is: "${milestone.title}" (${milestone.workstream || "general"} workstream${milestone.owner ? `, led by ${milestone.owner}` : ""}).

Be warm, specific, and energizing. Reference the milestone by name. This will appear in the team chat. No em dashes. No generic "Great job team!" energy. Make it feel like a real person is celebrating.`;

      const generated = await callGemini(prompt);
      if (generated) celebrationMsg = generated.trim();
    }

    // Post to activity_feed (which can trigger Realtime)
    await db.from("activity_feed").insert({
      message: `[Damdam] Milestone celebration: ${celebrationMsg}`,
      type: "milestone_celebration",
      metadata: {
        agent: "damdam",
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        workstream: milestone.workstream,
        owner: milestone.owner,
        celebration: celebrationMsg,
      },
    });

    // Also post to the Realtime chat channel via KV (matching existing chat pattern)
    const chatMsgId = crypto.randomUUID();
    const chatMsg = {
      id: chatMsgId,
      channel: GENERAL_CHANNEL,
      author: "Damdam",
      avatarId: "star",
      text: celebrationMsg,
      timestamp: new Date().toISOString(),
      type: "celebration",
      metadata: { milestoneId: milestone.id, confetti: true },
    };

    // Store in KV using the existing chat message pattern
    // Pattern from index.tsx: ik26:chat:{channel}:{messageId}
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/server/make-server-5ed426e6/chat/${GENERAL_CHANNEL}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: chatMsgId,
          author: "Damdam",
          avatarId: "star",
          text: celebrationMsg,
        }),
      });

      if (!response.ok) {
        console.log(`[Damdam] Chat post returned ${response.status}, falling back to activity_feed only`);
      }
    } catch {
      console.log("[Damdam] Could not post to chat, celebration logged in activity_feed");
    }

    results.milestoneCelebrations++;

  } catch (err: any) {
    results.errors.push(`Milestone celebration error: ${err.message}`);
  }
}

// ── 3. Seed Prompt Schedule ────────────────────────────────────
async function seedPromptSchedule(db: ReturnType<typeof createClient>, results: any) {
  // Pre-event prompts organized by theme and timing
  const promptSchedule = [
    // Week of May 11 (11 days before): Anticipation & Roots
    { text: "What dish takes you home?", category: "roots" },
    { text: "Describe a kitchen sound that lives in your memory.", category: "memory" },
    { text: "Who taught you that food is love?", category: "roots" },

    // Week of May 18 (event week): Gathering & Identity
    { text: "What does it mean to cook for strangers who feel like family?", category: "identity" },
    { text: "If your hands could tell one story, what would it be?", category: "identity" },
    { text: "What flavor are you bringing to the table tonight?", category: "gathering" },
    { text: "What does 'isang kusina' (one kitchen) mean to you?", category: "gathering" },

    // Post-event (May 23+): Reflection & Legacy
    { text: "What will you carry home from this table?", category: "legacy" },
    { text: "What did you taste for the first time tonight?", category: "reflection" },
    { text: "If tonight had a flavor, what would it be?", category: "reflection" },
    { text: "What story did you hear that you want to remember?", category: "legacy" },
  ];

  let seeded = 0;

  for (const prompt of promptSchedule) {
    // Check if this prompt already exists
    const { data: existing } = await db
      .from("prompt_roulette")
      .select("id")
      .eq("prompt_text", prompt.text)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await db.from("prompt_roulette").insert({
      prompt_text: prompt.text,
      category: prompt.category,
      active: true,
    });

    if (!error) seeded++;
  }

  results.promptsSeeded = seeded;
  console.log(`[Damdam] Seeded ${seeded} new prompts`);
}

// ── Pulse Alert Email ──────────────────────────────────────────
async function sendPulseAlert(
  db: ReturnType<typeof createClient>,
  data: {
    avgScore: number;
    minScore: number;
    maxScore: number;
    totalResponses: number;
    distressFlags: { chefName: string; text: string; score: number; keywords: string[] }[];
  }
) {
  const scoreColor = data.avgScore < 2.5 ? "#dc2626" : data.avgScore < 3.5 ? "#d97706" : "#059669";

  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: ${scoreColor}; border-bottom: 2px solid ${scoreColor}; padding-bottom: 8px; font-size: 16px;">
        Damdam Pulse Alert
      </h2>
      <p style="font-size: 14px; color: #374151;">
        Average feeling score this week: <strong style="font-size: 20px; color: ${scoreColor};">${data.avgScore.toFixed(1)}/5</strong>
        (${data.totalResponses} responses, range ${data.minScore}-${data.maxScore})
      </p>
  `;

  if (data.distressFlags.length > 0) {
    html += `
      <h3 style="color: #dc2626; font-size: 14px; margin-top: 20px;">Flagged Responses (${data.distressFlags.length})</h3>
      <p style="font-size: 12px; color: #6b7280;">These responses contained distress signals. Names shown to leadership only.</p>
    `;

    for (const flag of data.distressFlags) {
      html += `
        <div style="margin: 8px 0; padding: 10px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px; font-size: 13px;">
          <strong>${flag.chefName}</strong> (score: ${flag.score}/5)<br>
          <span style="color: #374151;">"${flag.text}"</span>
          ${flag.keywords.length > 0 ? `<br><span style="color: #dc2626; font-size: 11px;">Keywords: ${flag.keywords.join(", ")}</span>` : ""}
        </div>
      `;
    }
  }

  html += `
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        Damdam Agent | IK26 Ops Center | This alert is private to leadership.
      </p>
    </div>
  `;

  const subject = data.distressFlags.length > 0
    ? `[IK26] Damdam Alert: ${data.distressFlags.length} flagged pulse response${data.distressFlags.length > 1 ? "s" : ""}`
    : `[IK26] Damdam: Weekly pulse avg ${data.avgScore.toFixed(1)}/5`;

  try {
    await db.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: LEADERSHIP_EMAIL,
        subject,
        html,
        text: `Damdam Pulse Alert: avg ${data.avgScore.toFixed(1)}/5, ${data.distressFlags.length} flags`,
        from_name: "IK26 Damdam Agent",
        tags: ["damdam-agent", "pulse-alert"],
      },
    });
  } catch (err) {
    console.log("[Damdam] Could not send pulse alert via pgmq:", err);
  }
}

// ── Gemini API Call ────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("[Damdam] Gemini error:", err);
    return null;
  }
}
