// ════════════════════════════════════════════════════════════════
// IK26 — KUWENTO AGENT (Tagalog: Story / To Tell a Story)
// ════════════════════════════════════════════════════════════════
// Role: Narrative weaver — synthesizes chef prompt responses,
//       generates social media drafts and content, populates
//       trivia content, and drips storytelling questions to chefs
//       over the weeks leading up to the event.
//
// Triggers:
//   - Daily cron (content synthesis + trivia seeding)
//   - Webhook (on new prompt_response insert)
//   - Weekly drip (Monday 9AM PT — sends one storytelling question
//     to each chef who has incomplete chef_storytelling responses)
//
// Story Drip Logic:
//   - Onboarding asks questions 1 and 2 only (heritage + dish truth)
//   - Kuwento drips questions 3–6 weekly, one per week
//   - Questions are sent via the notifications table (in-app)
//   - Stops automatically once all 6 responses are complete
//
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ── Storytelling Questions (questions 3–6 are dripped by Kuwento)
const STORY_QUESTIONS = [
  // Questions 1 & 2 are asked during onboarding — Kuwento does not re-send these
  null,
  null,
  // Question 3 — Week 1 drip
  "In Filipino culture, feeding someone is often an unspoken act of care. Where in your kitchen or service do we see that care most clearly?",
  // Question 4 — Week 2 drip
  "What's a Filipino dish you don't know how to make?",
  // Question 5 — Week 3 drip
  "How do you balance the tension between the 'authentic' flavors you remember and the reality of the ingredients available to you here?",
  // Question 6 — Week 4 drip
  "What is a flavor or a kitchen habit you find yourself defending or explaining most often to people who didn't grow up with it?",
];

const STORY_QUESTION_KEYS = [
  null,
  null,
  'care_expression',
  'dish_you_cant_make',
  'authenticity_tension',
  'flavor_you_defend',
];

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "drip";

  try {
    switch (action) {
      case "drip":
        return await handleStoryDrip(supabase);
      case "synthesize":
        return await handleContentSynthesis(supabase);
      case "trivia":
        return await handleTriviaSeed(supabase);
      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("Kuwento error:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
});

// ════════════════════════════════════════════════════════════════
// STORY DRIP: Send next unanswered storytelling question
// ════════════════════════════════════════════════════════════════
async function handleStoryDrip(supabase: ReturnType<typeof createClient>) {
  console.log("Kuwento: Running story drip...");

  // Get all confirmed chefs
  const { data: chefs, error: chefsErr } = await supabase
    .from("chefs")
    .select("id, name")
    .eq("confirmed", true);

  if (chefsErr || !chefs) {
    return Response.json({ error: "Could not fetch chefs", detail: chefsErr }, { status: 500 });
  }

  const results: { chef: string; action: string; question?: string }[] = [];

  for (const chef of chefs) {
    // Get their storytelling record
    const { data: story } = await supabase
      .from("chef_storytelling")
      .select("*")
      .eq("chef_id", chef.id)
      .single();

    // Find the next unanswered question (questions 3–6 only)
    let nextQuestionIndex: number | null = null;
    for (let i = 2; i <= 5; i++) {
      const key = STORY_QUESTION_KEYS[i];
      if (!key) continue;
      const alreadyAnswered = story && story[key] && String(story[key]).trim().length > 0;
      if (!alreadyAnswered) {
        nextQuestionIndex = i;
        break;
      }
    }

    if (nextQuestionIndex === null) {
      results.push({ chef: chef.name, action: "complete — all questions answered" });
      continue;
    }

    // Check if we already sent this question this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentNotif } = await supabase
      .from("notifications")
      .select("id")
      .eq("chef_id", chef.id)
      .eq("type", "story_drip")
      .eq("metadata->>question_index", String(nextQuestionIndex))
      .gte("created_at", oneWeekAgo)
      .single();

    if (recentNotif) {
      results.push({ chef: chef.name, action: "skipped — already sent this week" });
      continue;
    }

    const question = STORY_QUESTIONS[nextQuestionIndex]!;
    const weekNum = nextQuestionIndex - 1; // weeks 1–4

    // Insert notification
    const { error: notifErr } = await supabase.from("notifications").insert({
      chef_id: chef.id,
      type: "story_drip",
      title: `A question for you — Week ${weekNum}`,
      message: question,
      metadata: {
        question_index: nextQuestionIndex,
        question_key: STORY_QUESTION_KEYS[nextQuestionIndex],
        week: weekNum,
        source: "kuwento",
      },
      read: false,
    });

    if (notifErr) {
      results.push({ chef: chef.name, action: `error sending notification: ${notifErr.message}` });
    } else {
      results.push({ chef: chef.name, action: `sent question ${nextQuestionIndex}`, question: question.substring(0, 60) + "..." });

      // Log to activity_feed
      await supabase.from("activity_feed").insert({
        chef_id: chef.id,
        type: "kuwento_drip",
        content: `Kuwento sent story question ${nextQuestionIndex} to ${chef.name}`,
        metadata: {
          question_index: nextQuestionIndex,
          question_key: STORY_QUESTION_KEYS[nextQuestionIndex],
          source: "kuwento",
          requires_human: false,
        },
      });
    }
  }

  console.log(`Kuwento drip complete: ${results.length} chefs processed`);
  return Response.json({ action: "drip", results, total: results.length });
}

// ════════════════════════════════════════════════════════════════
// CONTENT SYNTHESIS: Generate social media drafts from responses
// ════════════════════════════════════════════════════════════════
async function handleContentSynthesis(supabase: ReturnType<typeof createClient>) {
  console.log("Kuwento: Running content synthesis...");

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return Response.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  // Get prompt responses from the last 24 hours that haven't been synthesized
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: responses } = await supabase
    .from("prompt_responses")
    .select("id, chef_id, prompt_id, response_text, created_at, chefs(name, course_assignment)")
    .gte("created_at", oneDayAgo)
    .is("synthesized_at", null)
    .limit(10);

  if (!responses || responses.length === 0) {
    return Response.json({ action: "synthesize", message: "No new responses to synthesize" });
  }

  const drafts: { chef: string; draft: string }[] = [];

  for (const resp of responses) {
    const chefName = (resp.chefs as { name: string })?.name || "Chef";
    const course = (resp.chefs as { course_assignment: string })?.course_assignment || "";
    const responseText = resp.response_text;

    const prompt = `You are writing social media content for Isang Kusina 2026 — a Filipino-American culinary dinner on May 22, 2026 in Las Vegas, produced by Istorya.

Chef: ${chefName}${course ? ` (${course})` : ""}
Their response: "${responseText}"

Write a single social media caption (Instagram-ready, max 150 words). Warm, specific, culturally grounded. Do not use generic food clichés. Do not start with "Meet" or "Introducing". Capture the specific voice and detail in their response. End with a line that connects their story to the larger IK26 theme of Filipino migration and food as heritage.`;

    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 250, temperature: 0.6 },
          }),
        }
      );
      const geminiData = await geminiRes.json();
      const draft = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (draft) {
        // Write draft to activity_feed for Content Studio review
        await supabase.from("activity_feed").insert({
          chef_id: resp.chef_id,
          type: "kuwento_content_draft",
          content: draft,
          metadata: {
            source_response_id: resp.id,
            source: "kuwento",
            requires_human: true, // Always requires human review before publishing
            draft_type: "social_caption",
          },
        });

        // Mark response as synthesized
        await supabase
          .from("prompt_responses")
          .update({ synthesized_at: new Date().toISOString() })
          .eq("id", resp.id);

        drafts.push({ chef: chefName, draft: draft.substring(0, 80) + "..." });
      }
    } catch (err) {
      console.error(`Kuwento synthesis error for ${chefName}:`, err);
    }
  }

  return Response.json({ action: "synthesize", drafts_created: drafts.length, drafts });
}

// ════════════════════════════════════════════════════════════════
// TRIVIA SEED: Populate trivia content from chef storytelling data
// ════════════════════════════════════════════════════════════════
async function handleTriviaSeed(supabase: ReturnType<typeof createClient>) {
  console.log("Kuwento: Running trivia seed...");

  // Get chefs with completed storytelling responses
  const { data: stories } = await supabase
    .from("chef_storytelling")
    .select("chef_id, heritage_truth, care_expression, flavor_you_defend, chefs(name, course_assignment)")
    .not("heritage_truth", "is", null)
    .limit(20);

  if (!stories || stories.length === 0) {
    return Response.json({ action: "trivia", message: "No storytelling data available yet" });
  }

  // Seed prompt_roulette with questions derived from chef stories
  const triviaItems: { question: string; answer_hint: string; chef_id: string }[] = [];

  for (const story of stories) {
    const chefName = (story.chefs as { name: string })?.name || "A chef";
    const course = (story.chefs as { course_assignment: string })?.course_assignment || "";

    if (story.heritage_truth) {
      triviaItems.push({
        question: `Which chef said: "${story.heritage_truth.substring(0, 80)}..."?`,
        answer_hint: chefName,
        chef_id: story.chef_id,
      });
    }
  }

  if (triviaItems.length > 0) {
    const { error } = await supabase.from("prompt_roulette").upsert(
      triviaItems.map(item => ({
        ...item,
        type: "trivia",
        source: "kuwento",
        active: true,
        created_at: new Date().toISOString(),
      })),
      { onConflict: "question" }
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ action: "trivia", seeded: triviaItems.length });
}
