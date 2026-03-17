// ════════════════════════════════════════════════════════════════
// IK26 AGENT: KUWENTO (Story)
// ════════════════════════════════════════════════════════════════
// Weaves the narrative threads of the event.
// Synthesizes prompt responses, generates social media drafts
// from chef storytelling data, and populates trivia content.
//
// Deployment: Supabase Edge Function (Deno)
// Trigger: Daily cron (for content drafts) + webhook (for prompt synthesis)
// Stack: Supabase (PostgreSQL, KV Store), Gemini API, Perplexity API
// ════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ── Configuration ──────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const SONAR_API_KEY = Deno.env.get("SONAR_API_KEY") || "";
const LEADERSHIP_EMAIL = "monica.istorya@gmail.com";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── Types ──────────────────────────────────────────────────────
interface PromptResponse {
  id: string;
  prompt_id: string;
  chef_id: string;
  response_text: string | null;
  created_at: string;
}

interface ChefStorytelling {
  id: string;
  chef_id: string;
  your_roots: string | null;
  your_journey: string | null;
  for_the_record: string | null;
  your_voice: string | null;
  completed: boolean | null;
}

interface ChefCulinary {
  id: string;
  chef_id: string;
  dish_name: string | null;
  dish_story: string | null;
  completed: boolean | null;
}

interface ContentDraft {
  type: "instagram" | "substack" | "recap";
  title: string;
  body: string;
  source_chef_id?: string;
  source_prompt_id?: string;
  metadata: Record<string, any>;
}

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "daily";

  const results = {
    action,
    draftsCreated: 0,
    triviaGenerated: 0,
    promptsSynthesized: 0,
    errors: [] as string[],
  };

  try {
    const db = getAdminClient();

    switch (action) {
      case "synthesize":
        // Synthesize responses for a specific prompt (triggered by webhook or manual)
        const promptId = url.searchParams.get("prompt_id");
        if (promptId) {
          await synthesizePromptResponses(db, promptId, results);
        }
        break;

      case "trivia":
        // Generate trivia questions
        await generateTrivia(db, results);
        break;

      case "social":
        // Generate social media drafts from chef data
        await generateSocialDrafts(db, results);
        break;

      case "daily":
      default:
        // Full daily run: synthesize yesterday's prompt, generate social drafts, refresh trivia
        await runDailyKuwento(db, results);
        break;
    }

    console.log(`[Kuwento] Complete (${action}): ${results.draftsCreated} drafts, ${results.triviaGenerated} trivia, ${results.promptsSynthesized} syntheses`);

    return new Response(JSON.stringify({ ok: true, agent: "kuwento", ...results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[Kuwento] Fatal error:", err);
    return new Response(JSON.stringify({ ok: false, agent: "kuwento", error: err.message, ...results }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ── Daily Run ──────────────────────────────────────────────────
async function runDailyKuwento(db: ReturnType<typeof createClient>, results: any) {
  // 1. Synthesize yesterday's prompt responses
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const { data: recentPrompts } = await db
    .from("prompt_roulette")
    .select("id, prompt_text, category")
    .eq("active", true)
    .limit(5);

  if (recentPrompts && recentPrompts.length > 0) {
    for (const prompt of recentPrompts) {
      await synthesizePromptResponses(db, prompt.id, results);
    }
  }

  // 2. Generate social media drafts from completed chef storytelling
  await generateSocialDrafts(db, results);

  // 3. Generate fresh trivia
  await generateTrivia(db, results);

  // 4. Send summary to leadership
  await sendKuwentoSummary(db, results);
}

// ── Synthesize Prompt Responses ────────────────────────────────
async function synthesizePromptResponses(
  db: ReturnType<typeof createClient>,
  promptId: string,
  results: any
) {
  try {
    // Get the prompt text
    const { data: prompt } = await db
      .from("prompt_roulette")
      .select("id, prompt_text, category")
      .eq("id", promptId)
      .single();

    if (!prompt) {
      results.errors.push(`Prompt ${promptId} not found`);
      return;
    }

    // Get all responses for this prompt
    const { data: responses } = await db
      .from("prompt_responses")
      .select("id, response_text, chef_id, created_at")
      .eq("prompt_id", promptId)
      .not("response_text", "is", null);

    if (!responses || responses.length === 0) {
      console.log(`[Kuwento] No responses for prompt ${promptId}`);
      return;
    }

    // Synthesize using Gemini
    const responseTexts = responses
      .map((r: PromptResponse) => r.response_text)
      .filter(Boolean)
      .join("\n---\n");

    const synthesisPrompt = `You are synthesizing anonymous responses to a community prompt for Isang Kusina 2026, a collaborative Filipino dinner event. The prompt was:

"${prompt.prompt_text}"

Here are ${responses.length} anonymous responses:

${responseTexts}

Write a warm, poetic synthesis (150-200 words) that:
1. Identifies 2-3 recurring themes across the responses
2. Pulls out 1-2 standout lines or phrases (quote them directly)
3. Connects the themes back to the spirit of Isang Kusina: heritage, memory, and gathering

This will appear on the "Our Istoryas" recap page. Write in second person plural ("we," "our") to create a sense of shared experience. No em dashes. No generic AI language. The tone should feel like someone reading the room and reflecting back what they heard.`;

    const synthesis = await callGemini(synthesisPrompt);

    if (synthesis) {
      // Store the synthesis in KV for the recap page
      const kvKey = `ik26:prompt-synthesis:${promptId}`;
      // Use the Supabase KV pattern from the existing codebase
      await db.from("activity_feed").insert({
        message: `[Kuwento] Synthesized ${responses.length} responses for prompt: "${prompt.prompt_text.substring(0, 60)}..."`,
        type: "content_synthesis",
        metadata: {
          agent: "kuwento",
          promptId,
          promptText: prompt.prompt_text,
          responseCount: responses.length,
          synthesis: synthesis,
        },
      });

      results.promptsSynthesized++;
    }
  } catch (err: any) {
    results.errors.push(`Synthesis error for ${promptId}: ${err.message}`);
  }
}

// ── Generate Social Media Drafts ───────────────────────────────
async function generateSocialDrafts(db: ReturnType<typeof createClient>, results: any) {
  try {
    // Get completed chef storytelling entries
    const { data: stories } = await db
      .from("chef_storytelling")
      .select("*, chefs(name, city, restaurant)")
      .eq("completed", true);

    if (!stories || stories.length === 0) {
      console.log("[Kuwento] No completed chef stories to draft from");
      return;
    }

    // Get completed culinary entries
    const { data: culinary } = await db
      .from("chef_culinary")
      .select("*, chefs(name, city)")
      .eq("completed", true);

    const culinaryMap = new Map(
      (culinary || []).map((c: any) => [c.chef_id, c])
    );

    for (const story of stories) {
      const chef = story.chefs;
      if (!chef) continue;

      const dish = culinaryMap.get(story.chef_id);

      // Check if we already generated a draft for this chef (avoid duplicates)
      const { data: existing } = await db
        .from("activity_feed")
        .select("id")
        .eq("type", "social_draft")
        .ilike("message", `%${chef.name}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Generate Instagram caption
      const captionPrompt = `Write an Instagram caption (under 150 words) for Isang Kusina 2026 featuring Chef ${chef.name} from ${chef.city || "their city"}${chef.restaurant ? ` (${chef.restaurant})` : ""}.

CHEF'S STORY:
- Roots: ${story.your_roots || "Not shared yet"}
- Journey: ${story.your_journey || "Not shared yet"}
${dish ? `- Dish: ${dish.dish_name || "TBD"}\n- Dish Story: ${dish.dish_story || "Not shared yet"}` : ""}

Write in a warm, culturally grounded voice. This is for Istorya's Instagram. The caption should honor the chef's story without over-explaining it. Include a call to the reader's own memory or experience. End with 3-5 relevant hashtags.

No em dashes. No generic AI language. No "In a world where..." openings. Write like someone who knows this chef and is proud to introduce them.`;

      const caption = await callGemini(captionPrompt);

      if (caption) {
        await db.from("activity_feed").insert({
          chef_id: story.chef_id,
          message: `[Kuwento] Instagram draft for Chef ${chef.name}`,
          type: "social_draft",
          metadata: {
            agent: "kuwento",
            platform: "instagram",
            chefName: chef.name,
            chefCity: chef.city,
            draft: caption,
            status: "pending_review",
          },
        });
        results.draftsCreated++;
      }
    }
  } catch (err: any) {
    results.errors.push(`Social draft error: ${err.message}`);
  }
}

// ── Generate Trivia ────────────────────────────────────────────
async function generateTrivia(db: ReturnType<typeof createClient>, results: any) {
  try {
    // Use Perplexity Sonar for research-grounded trivia
    const topics = [
      "Filipino culinary history and traditional cooking methods",
      "Filipino American food culture and diaspora restaurants",
      "Regional Filipino dishes and their origins",
      "Filipino ingredients and their cultural significance",
      "History of Filipino restaurants in Las Vegas and the American West",
    ];

    const topic = topics[Math.floor(Math.random() * topics.length)];

    let triviaData: { question: string; options: string[]; correctIndex: number; funFact: string } | null = null;

    if (SONAR_API_KEY) {
      triviaData = await generateTriviaWithPerplexity(topic);
    }

    if (!triviaData && GEMINI_API_KEY) {
      triviaData = await generateTriviaWithGemini(topic);
    }

    if (triviaData) {
      // Store in KV via the existing trivia pattern
      const triviaId = crypto.randomUUID();
      await db.from("activity_feed").insert({
        message: `[Kuwento] New trivia generated: "${triviaData.question.substring(0, 60)}..."`,
        type: "trivia_generated",
        metadata: {
          agent: "kuwento",
          triviaId,
          question: triviaData.question,
          options: triviaData.options,
          correctIndex: triviaData.correctIndex,
          funFact: triviaData.funFact,
          topic,
          status: "pending_review",
        },
      });
      results.triviaGenerated++;
    }
  } catch (err: any) {
    results.errors.push(`Trivia generation error: ${err.message}`);
  }
}

// ── Perplexity Sonar for Research-Grounded Trivia ──────────────
async function generateTriviaWithPerplexity(topic: string) {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SONAR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "You are a Filipino culinary historian. Generate trivia questions that are educational, specific, and grounded in real history. Always respond in valid JSON.",
          },
          {
            role: "user",
            content: `Generate one trivia question about: ${topic}

Respond in this exact JSON format:
{
  "question": "The trivia question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "funFact": "A brief, interesting fact that expands on the answer (1-2 sentences)"
}

Make the question specific and educational. Avoid obvious or stereotypical questions. The fun fact should teach something new.`,
          },
        ],
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      // Parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    console.error("[Kuwento] Perplexity error:", err);
  }
  return null;
}

// ── Gemini Fallback for Trivia ─────────────────────────────────
async function generateTriviaWithGemini(topic: string) {
  const prompt = `Generate one trivia question about: ${topic}

This is for "X Marks the Spot," a trivia feature in the Isang Kusina 2026 app. The audience is Filipino Americans and food enthusiasts.

Respond in this exact JSON format (no markdown, just raw JSON):
{
  "question": "The trivia question",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "funFact": "A brief, interesting fact that expands on the answer (1-2 sentences)"
}

Make the question specific and educational. Avoid obvious or stereotypical questions.`;

  const text = await callGemini(prompt);
  if (text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.log("[Kuwento] Failed to parse trivia JSON from Gemini");
    }
  }
  return null;
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error("[Kuwento] Gemini error:", err);
    return null;
  }
}

// ── Leadership Summary ─────────────────────────────────────────
async function sendKuwentoSummary(db: ReturnType<typeof createClient>, results: any) {
  const subject = `[IK26] Kuwento Daily: ${results.draftsCreated} drafts, ${results.triviaGenerated} trivia, ${results.promptsSynthesized} syntheses`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; font-size: 16px;">
        Kuwento Daily Summary
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Social Media Drafts Created</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">${results.draftsCreated}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Trivia Questions Generated</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">${results.triviaGenerated}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Prompt Responses Synthesized</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">${results.promptsSynthesized}</td></tr>
      </table>
      <p style="color: #6b7280; font-size: 12px;">Social drafts and trivia are stored in the activity_feed with status "pending_review". Check the IK26 app to approve or edit.</p>
      ${results.errors.length > 0 ? `<p style="color: #dc2626; font-size: 12px;">Errors: ${results.errors.join("; ")}</p>` : ""}
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Kuwento Agent | IK26 Ops Center</p>
    </div>
  `;

  try {
    await db.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: LEADERSHIP_EMAIL,
        subject,
        html,
        text: subject,
        from_name: "IK26 Kuwento Agent",
        tags: ["kuwento-agent", "daily-summary"],
      },
    });
  } catch (err) {
    console.log("[Kuwento] Could not send summary via pgmq:", err);
  }
}
