// ════════════════════════════════════════════════════════════════
// IK26 AGENT: MATA (Eye / To See)
// ════════════════════════════════════════════════════════════════
// The production eye of Isang Kusina. Mata sees the whole arc:
// from pre-production planning through day-of capture to
// post-production synthesis. It generates shot lists, interview
// questions rooted in each chef's storytelling data, documentary
// narrative treatments, scene logs, rough cut notes, and a
// content calendar for the social pipeline.
//
// Named for the Tagalog word for "eye" — because the documentary
// is how we see each other, and how the world sees us.
//
// Deployment: Supabase Edge Function (Deno)
// Trigger: Manual / cron / webhook depending on action
// Stack: Supabase (PostgreSQL, Storage), Gemini API, Perplexity API
// Companion: apps-script-flow-g-mata-media.gs (Google Drive management)
// ════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ── Configuration ──────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const SONAR_API_KEY = Deno.env.get("SONAR_API_KEY") || "";
const LEADERSHIP_EMAIL = "monica.istorya@gmail.com";

// Event constants
const EVENT_DATE = "2026-05-22";
const EVENT_NAME = "Isang Kusina 2026";
const DOCUMENTARY_TITLE = "Take Home: An Isang Kusina Documentary";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── Types ──────────────────────────────────────────────────────

interface Chef {
  id: string;
  name: string;
  city: string | null;
  restaurant: string | null;
  course: string | null;
  dish_name: string | null;
  dish_description: string | null;
  confirmed: boolean | null;
}

interface ChefStorytelling {
  id: string;
  chef_id: string;
  your_roots: string | null;
  your_journey: string | null;
  for_the_record: string | null;
  your_voice: string | null;
  documentary_consent: boolean | null;
  private_topics: string | null;
  review_before_publish: boolean | null;
  voice_memo_url: string | null;
  completed: boolean | null;
}

interface ChefCulinary {
  id: string;
  chef_id: string;
  dish_name: string | null;
  dish_story: string | null;
  ingredients: any | null;
  equipment: string[] | null;
  allergen_tags: string[] | null;
  sourcing_notes: string | null;
  completed: boolean | null;
}

interface PulseCheck {
  id: string;
  chef_id: string;
  feeling_score: number;
  needs_text: string | null;
  week_label: string | null;
  created_at: string;
}

interface PromptResponse {
  id: string;
  chef_id: string;
  prompt_id: string;
  response_text: string | null;
  photo_url: string | null;
  voice_memo_url: string | null;
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
  notes: string | null;
}

interface SceneLog {
  scene_id: string;
  timestamp: string;
  scene_type: string;
  description: string;
  chef_id?: string;
  chef_name?: string;
  location: string;
  camera_notes: string;
  audio_notes: string;
  emotional_beat: string;
  usable_for: string[];
  broll_tags: string[];
}

interface ShotListItem {
  priority: "must_have" | "nice_to_have" | "bonus";
  scene_type: string;
  description: string;
  subject: string;
  location: string;
  timing: string;
  camera_notes: string;
  audio_notes: string;
  narrative_purpose: string;
}

interface ContentCalendarItem {
  publish_date: string;
  phase: "pre_event" | "day_of" | "post_event";
  platform: string;
  content_type: string;
  title: string;
  description: string;
  source_material: string;
  caption_draft: string;
  hashtags: string[];
  status: "planned" | "drafted" | "approved" | "published";
}

interface MataResults {
  action: string;
  shotListItems: number;
  interviewQuestions: number;
  scenesLogged: number;
  roughCutNotes: number;
  contentCalendarItems: number;
  narrativeTreatment: boolean;
  errors: string[];
}

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "status";

  const results: MataResults = {
    action,
    shotListItems: 0,
    interviewQuestions: 0,
    scenesLogged: 0,
    roughCutNotes: 0,
    contentCalendarItems: 0,
    narrativeTreatment: false,
    errors: [],
  };

  try {
    const db = getAdminClient();

    switch (action) {
      // ── PRE-PRODUCTION ────────────────────────────────────
      case "shot-list":
        await generateShotList(db, results);
        break;

      case "interviews":
        // Generate personalized interview questions for each chef
        const chefId = url.searchParams.get("chef_id");
        await generateInterviewQuestions(db, results, chefId || undefined);
        break;

      case "narrative-treatment":
        // Generate the full documentary narrative treatment
        await generateNarrativeTreatment(db, results);
        break;

      case "scene-plan":
        // Generate scene/sequence plan for the documentary
        await generateScenePlan(db, results);
        break;

      // ── DAY-OF PRODUCTION ─────────────────────────────────
      case "log-scene": {
        // Log a scene during production (called by Ayce or team)
        if (req.method !== "POST") {
          return new Response("POST required for scene logging", { status: 405 });
        }
        const body = await req.json();
        await logScene(db, body, results);
        break;
      }

      case "runsheet":
        // Generate the production runsheet from milestones
        await generateRunsheet(db, results);
        break;

      case "shot-tracker":
        // Check shot list completion against logged scenes
        await checkShotTracker(db, results);
        break;

      // ── POST-PRODUCTION ───────────────────────────────────
      case "rough-cut":
        // Generate rough cut notes from logged scenes
        await generateRoughCutNotes(db, results);
        break;

      case "chapters":
        // Suggest documentary chapter/segment structure
        await suggestChapters(db, results);
        break;

      case "broll-tags":
        // Generate b-roll tagging recommendations
        await generateBrollTags(db, results);
        break;

      // ── CONTENT PIPELINE ──────────────────────────────────
      case "content-calendar":
        // Generate the full content calendar
        await generateContentCalendar(db, results);
        break;

      case "clip-schedule":
        // Generate short-form clip schedule from logged footage
        await generateClipSchedule(db, results);
        break;

      case "captions":
        // Generate caption drafts for upcoming content
        const platform = url.searchParams.get("platform") || "instagram";
        await generateCaptions(db, results, platform);
        break;

      // ── STATUS / FULL RUN ─────────────────────────────────
      case "full-preproduction":
        // Run all pre-production tasks
        await generateShotList(db, results);
        await generateInterviewQuestions(db, results);
        await generateNarrativeTreatment(db, results);
        await generateScenePlan(db, results);
        await generateContentCalendar(db, results);
        break;

      case "full-postproduction":
        // Run all post-production tasks
        await generateRoughCutNotes(db, results);
        await suggestChapters(db, results);
        await generateBrollTags(db, results);
        await generateClipSchedule(db, results);
        break;

      case "status":
      default:
        return new Response(JSON.stringify({
          ok: true,
          agent: "mata",
          name: "Mata (Eye / To See)",
          description: "Production and media agent for the Isang Kusina 2026 documentary and content pipeline",
          actions: [
            "shot-list", "interviews", "narrative-treatment", "scene-plan",
            "log-scene", "runsheet", "shot-tracker",
            "rough-cut", "chapters", "broll-tags",
            "content-calendar", "clip-schedule", "captions",
            "full-preproduction", "full-postproduction",
          ],
          event_date: EVENT_DATE,
        }), { headers: { "Content-Type": "application/json" } });
    }

    // Log the run to activity_feed
    await db.from("activity_feed").insert({
      message: `[Mata] ${action}: ${results.shotListItems} shots, ${results.interviewQuestions} questions, ${results.scenesLogged} scenes logged, ${results.roughCutNotes} cut notes, ${results.contentCalendarItems} calendar items`,
      type: "mata_agent_run",
      metadata: { agent: "mata", ...results },
    });

    console.log(`[Mata] Complete (${action}):`, results);

    return new Response(JSON.stringify({ ok: true, agent: "mata", ...results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[Mata] Fatal error:", err);
    return new Response(JSON.stringify({ ok: false, agent: "mata", error: err.message, ...results }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});


// ════════════════════════════════════════════════════════════════
// PRE-PRODUCTION
// ════════════════════════════════════════════════════════════════

// ── Shot List Generator ────────────────────────────────────────
async function generateShotList(db: ReturnType<typeof createClient>, results: MataResults) {
  try {
    const { data: chefs } = await db
      .from("chefs")
      .select("id, name, city, restaurant, course, dish_name, dish_description")
      .eq("confirmed", true);

    const { data: culinary } = await db
      .from("chef_culinary")
      .select("chef_id, dish_name, dish_story, ingredients, equipment")
      .eq("completed", true);

    const { data: milestones } = await db
      .from("milestones")
      .select("*")
      .order("due_date", { ascending: true });

    if (!chefs || chefs.length === 0) {
      results.errors.push("No confirmed chefs found for shot list");
      return;
    }

    const culinaryMap = new Map((culinary || []).map((c: any) => [c.chef_id, c]));

    // Build the chef context for the shot list
    const chefDescriptions = chefs.map((chef: Chef) => {
      const dish = culinaryMap.get(chef.id);
      return `- Chef ${chef.name} (${chef.city || "TBD"}, ${chef.restaurant || "Independent"})
  Course: ${chef.course || "TBD"}
  Dish: ${dish?.dish_name || chef.dish_name || "TBD"}
  Story: ${dish?.dish_story || "Not yet shared"}
  Equipment: ${(dish?.equipment || []).join(", ") || "Standard"}`;
    }).join("\n");

    const milestoneContext = (milestones || [])
      .filter((m: Milestone) => m.workstream === "Production" || m.workstream === "Content" || m.division === "Creative")
      .map((m: Milestone) => `- ${m.title} (${m.status}, due: ${m.due_date || "TBD"})`)
      .join("\n");

    const shotListPrompt = `You are the production planner for "${DOCUMENTARY_TITLE}", a documentary about ${EVENT_NAME}, a collaborative Filipino dinner event on ${EVENT_DATE} in Las Vegas.

CONFIRMED CHEFS:
${chefDescriptions}

PRODUCTION MILESTONES:
${milestoneContext || "No production milestones set yet"}

Generate a comprehensive shot list organized by phase. For each shot, include:
- Priority (must_have / nice_to_have / bonus)
- Scene type (interview, cooking, prep, arrival, plating, service, reaction, atmosphere, b-roll, behind-scenes)
- Description (specific, visual)
- Subject (who/what)
- Location (kitchen, dining room, prep area, exterior, etc.)
- Timing (pre-event, morning-of, service, post-service)
- Camera notes (angle, movement, lens suggestion)
- Audio notes (nat sound, interview audio, ambient)
- Narrative purpose (why this shot matters to the documentary arc)

Organize into these sections:
1. PRE-EVENT (chef arrivals, prep day, walkthroughs, team meetings)
2. MORNING OF (kitchen setup, ingredient prep, team energy)
3. SERVICE (cooking, plating, passing, dining room reactions)
4. POST-SERVICE (cleanup, exhaustion, celebration, quiet moments)
5. INTERVIEWS (each chef individually, team group, Monica + Walbert)
6. B-ROLL ESSENTIALS (hands, ingredients, fire, steam, faces, details)

Return as a JSON array of objects with these fields: priority, scene_type, description, subject, location, timing, camera_notes, audio_notes, narrative_purpose.

Be specific to Filipino culinary culture. Include shots that capture the sensory details: the sound of sizzling, steam rising from rice, hands shaping food, the colors of calamansi and ube. Think about what makes this event different from any other dinner: it's about heritage, memory, and the act of feeding people as love.`;

    const shotListJson = await callGeminiJson(shotListPrompt);

    if (shotListJson && Array.isArray(shotListJson)) {
      // Store in activity_feed with full shot list
      await db.from("activity_feed").insert({
        message: `[Mata] Shot list generated: ${shotListJson.length} shots across all phases`,
        type: "shot_list",
        metadata: {
          agent: "mata",
          documentary: DOCUMENTARY_TITLE,
          shotCount: shotListJson.length,
          shots: shotListJson,
          generatedAt: new Date().toISOString(),
          mustHave: shotListJson.filter((s: any) => s.priority === "must_have").length,
          niceToHave: shotListJson.filter((s: any) => s.priority === "nice_to_have").length,
          bonus: shotListJson.filter((s: any) => s.priority === "bonus").length,
        },
      });
      results.shotListItems = shotListJson.length;
    }
  } catch (err: any) {
    results.errors.push(`Shot list error: ${err.message}`);
  }
}


// ── Interview Question Generator ───────────────────────────────
async function generateInterviewQuestions(
  db: ReturnType<typeof createClient>,
  results: MataResults,
  specificChefId?: string
) {
  try {
    // Get chefs with storytelling and culinary data
    let chefsQuery = db
      .from("chefs")
      .select("id, name, city, restaurant, course, dish_name")
      .eq("confirmed", true);

    if (specificChefId) {
      chefsQuery = chefsQuery.eq("id", specificChefId);
    }

    const { data: chefs } = await chefsQuery;
    if (!chefs || chefs.length === 0) {
      results.errors.push("No confirmed chefs found for interview questions");
      return;
    }

    const { data: storytelling } = await db
      .from("chef_storytelling")
      .select("*");

    const { data: culinary } = await db
      .from("chef_culinary")
      .select("*");

    const { data: pulseChecks } = await db
      .from("chef_pulse_checks")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: promptResponses } = await db
      .from("prompt_responses")
      .select("*, prompt_roulette(prompt_text)")
      .not("response_text", "is", null);

    const storyMap = new Map((storytelling || []).map((s: any) => [s.chef_id, s]));
    const culinaryMap = new Map((culinary || []).map((c: any) => [c.chef_id, c]));
    const pulseMap = new Map<string, PulseCheck[]>();
    (pulseChecks || []).forEach((p: PulseCheck) => {
      if (!pulseMap.has(p.chef_id)) pulseMap.set(p.chef_id, []);
      pulseMap.get(p.chef_id)!.push(p);
    });
    const responseMap = new Map<string, any[]>();
    (promptResponses || []).forEach((r: any) => {
      if (!responseMap.has(r.chef_id)) responseMap.set(r.chef_id, []);
      responseMap.get(r.chef_id)!.push(r);
    });

    for (const chef of chefs) {
      const story: ChefStorytelling | undefined = storyMap.get(chef.id);
      const dish: ChefCulinary | undefined = culinaryMap.get(chef.id);
      const pulses = pulseMap.get(chef.id) || [];
      const responses = responseMap.get(chef.id) || [];

      // Respect documentary consent
      if (story && story.documentary_consent === false) {
        console.log(`[Mata] Skipping Chef ${chef.name}: documentary consent not given`);
        continue;
      }

      // Build a rich context profile for this chef
      const privateTopics = story?.private_topics || "";
      const promptResponseContext = responses
        .slice(0, 5)
        .map((r: any) => `Q: "${r.prompt_roulette?.prompt_text || "Unknown prompt"}" A: "${r.response_text}"`)
        .join("\n");

      const pulseContext = pulses
        .slice(0, 3)
        .map((p: PulseCheck) => `Week ${p.week_label || "?"}: ${p.feeling_score}/5${p.needs_text ? ` ("${p.needs_text}")` : ""}`)
        .join("\n");

      const interviewPrompt = `You are preparing interview questions for a documentary about ${EVENT_NAME}. This is for Chef ${chef.name} from ${chef.city || "their city"}${chef.restaurant ? `, ${chef.restaurant}` : ""}.

WHAT WE KNOW ABOUT THIS CHEF:

Storytelling Profile:
- Your Roots: ${story?.your_roots || "Not yet shared"}
- Your Journey: ${story?.your_journey || "Not yet shared"}
- For the Record: ${story?.for_the_record || "Not yet shared"}
- Your Voice: ${story?.your_voice || "Not yet shared"}
- Voice Memo: ${story?.voice_memo_url ? "Yes (submitted)" : "No"}
- Review before publish: ${story?.review_before_publish ? "Yes" : "No preference"}

Culinary Profile:
- Dish: ${dish?.dish_name || chef.dish_name || "TBD"}
- Dish Story: ${dish?.dish_story || "Not yet shared"}
- Ingredients: ${dish?.ingredients ? JSON.stringify(dish.ingredients) : "Not listed"}
- Sourcing Notes: ${dish?.sourcing_notes || "None"}

Prompt Responses (from community prompts):
${promptResponseContext || "No responses yet"}

Recent Pulse Checks:
${pulseContext || "No pulse data"}

${privateTopics ? `IMPORTANT: The chef has marked these as private topics to AVOID: "${privateTopics}". Do NOT ask about these.` : ""}

Generate 12-15 interview questions organized into these categories:

1. ROOTS & IDENTITY (3-4 questions)
   Draw from their "your_roots" and "your_journey" data. Ask about specific details they've already shared to show you've been listening. Go deeper, not wider.

2. THE DISH (3-4 questions)
   Connect the dish to memory, family, place. If they shared a dish story, reference it and ask what they left out. Ask about the sensory experience of making it.

3. THE GATHERING (2-3 questions)
   What does cooking alongside other Filipino chefs mean to them? What do they want the people eating their food to feel? What does "isang kusina" (one kitchen) mean in their life?

4. FOR THE RECORD (2-3 questions)
   These are the legacy questions. What do they want documented? What story hasn't been told? If their grandchildren watched this documentary, what should they see?

5. THE MOMENT (1-2 questions)
   Quick, spontaneous questions for day-of energy. These should be answerable in under 30 seconds and capture raw feeling.

For each question, include:
- The question itself
- A brief note to the interviewer about WHY this question matters for this specific chef
- Suggested follow-up if the answer goes in a particular direction
- Whether this is best asked pre-event, day-of, or post-event

Return as JSON: { "chef_name": "...", "chef_id": "...", "questions": [{ "category": "...", "question": "...", "interviewer_note": "...", "follow_up": "...", "timing": "pre_event|day_of|post_event" }] }

Write questions that honor what the chef has already shared. Do not ask them to repeat themselves. Go deeper. The tone should feel like a conversation between people who already know each other, not a cold interview.`;

      const questionsJson = await callGeminiJson(interviewPrompt);

      if (questionsJson && questionsJson.questions) {
        await db.from("activity_feed").insert({
          chef_id: chef.id,
          message: `[Mata] Interview guide for Chef ${chef.name}: ${questionsJson.questions.length} questions`,
          type: "interview_guide",
          metadata: {
            agent: "mata",
            chefName: chef.name,
            chefId: chef.id,
            questionCount: questionsJson.questions.length,
            questions: questionsJson.questions,
            hasDocumentaryConsent: story?.documentary_consent !== false,
            reviewBeforePublish: story?.review_before_publish || false,
            privateTopicsNoted: !!privateTopics,
            generatedAt: new Date().toISOString(),
          },
        });
        results.interviewQuestions += questionsJson.questions.length;
      }
    }
  } catch (err: any) {
    results.errors.push(`Interview questions error: ${err.message}`);
  }
}


// ── Narrative Treatment Generator ──────────────────────────────
async function generateNarrativeTreatment(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    // Gather ALL narrative source material
    const { data: chefs } = await db
      .from("chefs")
      .select("*")
      .eq("confirmed", true);

    const { data: storytelling } = await db
      .from("chef_storytelling")
      .select("*")
      .eq("completed", true);

    const { data: culinary } = await db
      .from("chef_culinary")
      .select("*")
      .eq("completed", true);

    const { data: pulseChecks } = await db
      .from("chef_pulse_checks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: promptResponses } = await db
      .from("prompt_responses")
      .select("*, prompt_roulette(prompt_text, category)")
      .not("response_text", "is", null)
      .limit(100);

    const { data: milestones } = await db
      .from("milestones")
      .select("*")
      .order("due_date", { ascending: true });

    // Build the full narrative context
    const chefProfiles = (chefs || []).map((chef: Chef) => {
      const story = (storytelling || []).find((s: ChefStorytelling) => s.chef_id === chef.id);
      const dish = (culinary || []).find((c: ChefCulinary) => c.chef_id === chef.id);
      return {
        name: chef.name,
        city: chef.city,
        restaurant: chef.restaurant,
        course: chef.course,
        dish: dish?.dish_name || chef.dish_name,
        dishStory: dish?.dish_story,
        roots: story?.your_roots,
        journey: story?.your_journey,
        forTheRecord: story?.for_the_record,
        voice: story?.your_voice,
        consent: story?.documentary_consent,
      };
    });

    // Anonymize prompt responses for the treatment
    const thematicResponses = (promptResponses || []).reduce((acc: Record<string, string[]>, r: any) => {
      const category = r.prompt_roulette?.category || "general";
      if (!acc[category]) acc[category] = [];
      acc[category].push(r.response_text);
      return acc;
    }, {});

    // Pulse check emotional arc
    const pulseArc = (pulseChecks || []).reduce((acc: Record<string, number[]>, p: PulseCheck) => {
      const week = p.week_label || "unknown";
      if (!acc[week]) acc[week] = [];
      acc[week].push(p.feeling_score);
      return acc;
    }, {});

    const treatmentPrompt = `You are writing a documentary narrative treatment for "${DOCUMENTARY_TITLE}".

THE EVENT: ${EVENT_NAME}, May 22, 2026, Las Vegas. A collaborative Filipino dinner event where chefs from across the country come together to cook one meal, telling the story of Filipino food in America through their dishes.

THE TEAM: Istorya, a culinary and creative agency co-founded by Monica and Walbert. Ayce is the video production partner. This is Year 3 of the event.

CHEF PROFILES (${chefProfiles.length} confirmed):
${JSON.stringify(chefProfiles, null, 2)}

COMMUNITY PROMPT THEMES:
${Object.entries(thematicResponses).map(([cat, responses]) => `${cat}: ${(responses as string[]).length} responses`).join("\n")}

EMOTIONAL ARC (pulse checks by week):
${Object.entries(pulseArc).map(([week, scores]) => {
  const avg = (scores as number[]).reduce((a, b) => a + b, 0) / (scores as number[]).length;
  return `${week}: avg ${avg.toFixed(1)}/5 (${(scores as number[]).length} responses)`;
}).join("\n")}

MILESTONES:
${(milestones || []).slice(0, 15).map((m: Milestone) => `- ${m.title} [${m.status}] ${m.due_date || ""}`).join("\n")}

Write a full documentary narrative treatment that includes:

1. LOGLINE (1-2 sentences)
2. SYNOPSIS (150-200 words)
3. NARRATIVE ARC
   - Act 1: The Gathering (pre-event, arrivals, prep, anticipation)
   - Act 2: The Kitchen (day-of, cooking, tension, collaboration, the meal)
   - Act 3: The Table (service, reactions, what it means, what stays)
   - Epilogue: Take Home (what each chef carries back, what the audience carries forward)
4. CHARACTER THREADS (one paragraph per chef, focusing on what makes their story unique and how it weaves into the larger narrative)
5. THEMATIC PILLARS (3-4 themes that run through the documentary)
6. VISUAL LANGUAGE (what the documentary looks and feels like: color, pacing, texture)
7. SOUND DESIGN NOTES (the role of sound: kitchen noise, music, silence, language switching)
8. INTERVIEW APPROACH (how interviews are conducted, the tone, the setting)

The treatment should feel like it was written by someone who has read every chef's story, who understands that this documentary is not about food. It's about what food carries: memory, migration, love, loss, and the act of feeding someone as the most basic form of care.

No em dashes. No generic documentary language. Write like you know these people.

Return as JSON: { "logline": "...", "synopsis": "...", "narrative_arc": { "act1": "...", "act2": "...", "act3": "...", "epilogue": "..." }, "character_threads": [{ "chef_name": "...", "thread": "..." }], "thematic_pillars": [{ "title": "...", "description": "..." }], "visual_language": "...", "sound_design": "...", "interview_approach": "..." }`;

    const treatment = await callGeminiJson(treatmentPrompt);

    if (treatment) {
      await db.from("activity_feed").insert({
        message: `[Mata] Documentary narrative treatment generated for "${DOCUMENTARY_TITLE}"`,
        type: "narrative_treatment",
        metadata: {
          agent: "mata",
          documentary: DOCUMENTARY_TITLE,
          treatment,
          chefCount: chefProfiles.length,
          promptResponseCount: (promptResponses || []).length,
          generatedAt: new Date().toISOString(),
        },
      });
      results.narrativeTreatment = true;
    }
  } catch (err: any) {
    results.errors.push(`Narrative treatment error: ${err.message}`);
  }
}


// ── Scene/Sequence Plan ────────────────────────────────────────
async function generateScenePlan(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    const { data: chefs } = await db
      .from("chefs")
      .select("id, name, city, course, dish_name")
      .eq("confirmed", true);

    const { data: milestones } = await db
      .from("milestones")
      .select("*")
      .order("due_date", { ascending: true });

    const scenePlanPrompt = `Create a scene-by-scene shooting plan for "${DOCUMENTARY_TITLE}" on ${EVENT_DATE}.

CHEFS: ${(chefs || []).map((c: Chef) => `${c.name} (${c.course || "TBD"}: ${c.dish_name || "TBD"})`).join(", ")}

MILESTONES: ${(milestones || []).filter((m: Milestone) => m.due_date === EVENT_DATE || m.workstream === "Production").map((m: Milestone) => m.title).join(", ")}

Create a timeline of scenes from 6:00 AM to midnight, organized as a shooting schedule. For each scene:
- Time window
- Scene number and name
- Location
- Subjects
- What's happening narratively
- Camera setup (A cam, B cam if applicable)
- Audio setup
- Key moments to capture
- Transition to next scene

Include buffer time for setup, meals, and unexpected moments. The best documentary footage often comes from the in-between moments: the quiet before service, the first taste, the look between two people who just pulled off something impossible.

Return as JSON array: [{ "time": "06:00-07:00", "scene_number": 1, "scene_name": "...", "location": "...", "subjects": "...", "narrative": "...", "camera_setup": "...", "audio_setup": "...", "key_moments": ["..."], "transition": "..." }]`;

    const scenePlan = await callGeminiJson(scenePlanPrompt);

    if (scenePlan && Array.isArray(scenePlan)) {
      await db.from("activity_feed").insert({
        message: `[Mata] Scene plan generated: ${scenePlan.length} scenes for ${EVENT_DATE}`,
        type: "scene_plan",
        metadata: {
          agent: "mata",
          sceneCount: scenePlan.length,
          scenes: scenePlan,
          eventDate: EVENT_DATE,
          generatedAt: new Date().toISOString(),
        },
      });
      results.shotListItems += scenePlan.length;
    }
  } catch (err: any) {
    results.errors.push(`Scene plan error: ${err.message}`);
  }
}


// ════════════════════════════════════════════════════════════════
// DAY-OF PRODUCTION
// ════════════════════════════════════════════════════════════════

// ── Scene Logger ───────────────────────────────────────────────
async function logScene(
  db: ReturnType<typeof createClient>,
  body: any,
  results: MataResults
) {
  try {
    const sceneLog: SceneLog = {
      scene_id: crypto.randomUUID(),
      timestamp: body.timestamp || new Date().toISOString(),
      scene_type: body.scene_type || "general",
      description: body.description || "",
      chef_id: body.chef_id,
      chef_name: body.chef_name,
      location: body.location || "main_kitchen",
      camera_notes: body.camera_notes || "",
      audio_notes: body.audio_notes || "",
      emotional_beat: body.emotional_beat || "",
      usable_for: body.usable_for || ["documentary"],
      broll_tags: body.broll_tags || [],
    };

    await db.from("activity_feed").insert({
      chef_id: sceneLog.chef_id || null,
      message: `[Mata] Scene logged: ${sceneLog.scene_type} - ${sceneLog.description.substring(0, 80)}`,
      type: "scene_log",
      metadata: {
        agent: "mata",
        ...sceneLog,
      },
    });

    results.scenesLogged++;
  } catch (err: any) {
    results.errors.push(`Scene log error: ${err.message}`);
  }
}


// ── Production Runsheet Generator ──────────────────────────────
async function generateRunsheet(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    const { data: milestones } = await db
      .from("milestones")
      .select("*")
      .order("due_date", { ascending: true });

    const { data: chefs } = await db
      .from("chefs")
      .select("id, name, course, dish_name")
      .eq("confirmed", true);

    // Get the scene plan if one exists
    const { data: existingPlan } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "scene_plan")
      .order("created_at", { ascending: false })
      .limit(1);

    const scenePlan = existingPlan?.[0]?.metadata?.scenes || [];

    const runsheetPrompt = `Create a production runsheet for the video team at ${EVENT_NAME} on ${EVENT_DATE}.

This is a working document for Ayce (video production lead) and the camera team. It should be practical, minute-by-minute where needed, and tied to both the event timeline and the documentary shooting plan.

EVENT MILESTONES:
${(milestones || []).map((m: Milestone) => `- ${m.title} [${m.status}] ${m.due_date || ""} (${m.owner || "unassigned"})`).join("\n")}

CHEFS AND COURSES:
${(chefs || []).map((c: Chef) => `- ${c.name}: ${c.course || "TBD"} / ${c.dish_name || "TBD"}`).join("\n")}

${scenePlan.length > 0 ? `EXISTING SCENE PLAN:\n${JSON.stringify(scenePlan.slice(0, 10), null, 2)}` : ""}

Create a runsheet with:
- Time blocks (15-30 min increments)
- What's happening (event side)
- What we're shooting (production side)
- Who needs to be where (crew assignments)
- Equipment notes (camera, audio, lighting changes)
- Call-outs for critical moments that cannot be missed
- Meal breaks for crew
- Battery/card swap reminders

Return as JSON array: [{ "time": "...", "event_action": "...", "production_action": "...", "crew_notes": "...", "equipment": "...", "critical": true/false, "notes": "..." }]`;

    const runsheet = await callGeminiJson(runsheetPrompt);

    if (runsheet && Array.isArray(runsheet)) {
      await db.from("activity_feed").insert({
        message: `[Mata] Production runsheet generated: ${runsheet.length} time blocks`,
        type: "production_runsheet",
        metadata: {
          agent: "mata",
          blockCount: runsheet.length,
          runsheet,
          eventDate: EVENT_DATE,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    results.errors.push(`Runsheet error: ${err.message}`);
  }
}


// ── Shot Tracker ───────────────────────────────────────────────
async function checkShotTracker(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    // Get the shot list
    const { data: shotListEntry } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "shot_list")
      .order("created_at", { ascending: false })
      .limit(1);

    // Get all logged scenes
    const { data: sceneLogs } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "scene_log")
      .order("created_at", { ascending: false });

    const shotList = shotListEntry?.[0]?.metadata?.shots || [];
    const loggedScenes = (sceneLogs || []).map((s: any) => s.metadata);

    if (shotList.length === 0) {
      results.errors.push("No shot list found. Run 'shot-list' action first.");
      return;
    }

    // Match logged scenes against shot list items
    const completedShots: string[] = [];
    const missingShots: any[] = [];

    for (const shot of shotList) {
      const matched = loggedScenes.some((scene: any) =>
        scene.scene_type === shot.scene_type &&
        (scene.description?.toLowerCase().includes(shot.subject?.toLowerCase()) ||
         scene.chef_name?.toLowerCase().includes(shot.subject?.toLowerCase()))
      );

      if (matched) {
        completedShots.push(shot.description);
      } else {
        missingShots.push(shot);
      }
    }

    const completion = Math.round((completedShots.length / shotList.length) * 100);

    await db.from("activity_feed").insert({
      message: `[Mata] Shot tracker: ${completion}% complete (${completedShots.length}/${shotList.length})`,
      type: "shot_tracker",
      metadata: {
        agent: "mata",
        totalShots: shotList.length,
        completedCount: completedShots.length,
        missingCount: missingShots.length,
        completionPercent: completion,
        missingMustHave: missingShots.filter((s: any) => s.priority === "must_have"),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    results.errors.push(`Shot tracker error: ${err.message}`);
  }
}


// ════════════════════════════════════════════════════════════════
// POST-PRODUCTION
// ════════════════════════════════════════════════════════════════

// ── Rough Cut Notes Generator ──────────────────────────────────
async function generateRoughCutNotes(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    // Get all logged scenes
    const { data: sceneLogs } = await db
      .from("activity_feed")
      .select("metadata, created_at")
      .eq("type", "scene_log")
      .order("created_at", { ascending: true });

    if (!sceneLogs || sceneLogs.length === 0) {
      results.errors.push("No scene logs found. Log scenes during production first.");
      return;
    }

    // Get the narrative treatment for context
    const { data: treatmentEntry } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "narrative_treatment")
      .order("created_at", { ascending: false })
      .limit(1);

    const treatment = treatmentEntry?.[0]?.metadata?.treatment;
    const scenes = sceneLogs.map((s: any) => s.metadata);

    const roughCutPrompt = `You are the editor reviewing logged footage for "${DOCUMENTARY_TITLE}".

LOGGED SCENES (${scenes.length} total):
${JSON.stringify(scenes.slice(0, 50), null, 2)}

${treatment ? `NARRATIVE TREATMENT:\nLogline: ${treatment.logline}\nArc: Act 1 (${treatment.narrative_arc?.act1?.substring(0, 100)}...), Act 2 (${treatment.narrative_arc?.act2?.substring(0, 100)}...), Act 3 (${treatment.narrative_arc?.act3?.substring(0, 100)}...)` : "No narrative treatment available"}

Generate rough cut notes that include:

1. ASSEMBLY ORDER
   Suggest the order scenes should be assembled in, following the narrative arc. Group by act.

2. SELECTS
   Flag the scenes most likely to contain the strongest footage based on emotional_beat and description. Mark as "A-roll priority" or "B-roll priority."

3. GAPS
   Identify what's missing from the logged footage. What scenes from the shot list weren't captured? What narrative beats need additional material (voiceover, archival, graphics)?

4. PACING NOTES
   Suggest where the edit should breathe (slow, contemplative) vs. where it should move (montage, energy). Note transitions between acts.

5. SOUND DESIGN MARKERS
   Flag scenes where natural sound should lead, where music should enter, and where silence would be most powerful.

6. INTERVIEW PLACEMENT
   Suggest where interview clips should be woven in based on the emotional arc of the logged scenes.

Return as JSON: { "assembly_order": [{ "act": "...", "scene_ids": ["..."], "notes": "..." }], "selects": [{ "scene_id": "...", "priority": "A-roll|B-roll", "reason": "..." }], "gaps": [{ "description": "...", "suggestion": "..." }], "pacing": [{ "section": "...", "tempo": "...", "notes": "..." }], "sound_markers": [{ "scene_id": "...", "sound_note": "..." }], "interview_placement": [{ "location_in_edit": "...", "suggested_chef": "...", "topic": "..." }] }`;

    const roughCut = await callGeminiJson(roughCutPrompt);

    if (roughCut) {
      await db.from("activity_feed").insert({
        message: `[Mata] Rough cut notes generated from ${scenes.length} logged scenes`,
        type: "rough_cut_notes",
        metadata: {
          agent: "mata",
          sceneCount: scenes.length,
          roughCut,
          generatedAt: new Date().toISOString(),
        },
      });
      results.roughCutNotes = 1;
    }
  } catch (err: any) {
    results.errors.push(`Rough cut notes error: ${err.message}`);
  }
}


// ── Chapter/Segment Suggestions ────────────────────────────────
async function suggestChapters(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    const { data: treatmentEntry } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "narrative_treatment")
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: sceneLogs } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "scene_log")
      .order("created_at", { ascending: true });

    const { data: chefs } = await db
      .from("chefs")
      .select("id, name, course, dish_name")
      .eq("confirmed", true);

    const treatment = treatmentEntry?.[0]?.metadata?.treatment;
    const scenes = (sceneLogs || []).map((s: any) => s.metadata);

    const chapterPrompt = `Suggest chapter/segment structure for "${DOCUMENTARY_TITLE}".

${treatment ? `TREATMENT:\n${JSON.stringify(treatment, null, 2)}` : "No treatment available"}

LOGGED SCENES: ${scenes.length}
CHEFS: ${(chefs || []).map((c: Chef) => `${c.name} (${c.course || "TBD"})`).join(", ")}

Suggest 6-8 chapters for the documentary. Each chapter should:
- Have a title that feels like a chapter in a book (not a generic documentary segment name)
- Have a clear emotional arc within itself
- Feature 1-2 primary chef stories while weaving in others
- Include estimated runtime
- Note the key footage needed

The chapter structure should mirror the courses of the meal itself: the way a Filipino dinner builds from something light to something rich to something sweet to something that lingers.

Return as JSON: [{ "chapter_number": 1, "title": "...", "subtitle": "...", "estimated_runtime_minutes": 0, "emotional_arc": "...", "primary_chefs": ["..."], "key_footage": ["..."], "music_mood": "...", "opens_with": "...", "closes_with": "..." }]`;

    const chapters = await callGeminiJson(chapterPrompt);

    if (chapters && Array.isArray(chapters)) {
      await db.from("activity_feed").insert({
        message: `[Mata] Documentary chapters suggested: ${chapters.length} chapters`,
        type: "chapter_suggestions",
        metadata: {
          agent: "mata",
          chapterCount: chapters.length,
          chapters,
          totalEstimatedMinutes: chapters.reduce((sum: number, c: any) => sum + (c.estimated_runtime_minutes || 0), 0),
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    results.errors.push(`Chapter suggestions error: ${err.message}`);
  }
}


// ── B-Roll Tagging Recommendations ─────────────────────────────
async function generateBrollTags(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    const { data: sceneLogs } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "scene_log")
      .order("created_at", { ascending: true });

    const scenes = (sceneLogs || []).map((s: any) => s.metadata);
    const brollScenes = scenes.filter((s: any) =>
      s.scene_type === "b-roll" || s.scene_type === "atmosphere" ||
      (s.broll_tags && s.broll_tags.length > 0)
    );

    const tagPrompt = `Review these logged b-roll and atmosphere scenes from "${DOCUMENTARY_TITLE}" and generate a comprehensive tagging system.

SCENES:
${JSON.stringify(brollScenes.length > 0 ? brollScenes : scenes.slice(0, 30), null, 2)}

Create a tagging taxonomy and tag each scene. Categories should include:
- Subject (hands, face, ingredient, tool, flame, steam, plate, table, crowd)
- Emotion (joy, focus, tension, relief, pride, nostalgia, anticipation)
- Sensory (visual_texture, sound_rich, movement, stillness, close_up, wide)
- Narrative use (opening, transition, montage, closing, chapter_break, title_card)
- Chef association (which chef or dish this relates to)
- Reusability (social_clip, trailer, highlight_reel, full_doc_only)

Return as JSON: { "taxonomy": { "categories": [{ "name": "...", "tags": ["..."] }] }, "tagged_scenes": [{ "scene_id": "...", "tags": { "subject": ["..."], "emotion": ["..."], "sensory": ["..."], "narrative_use": ["..."], "chef": "...", "reusability": ["..."] } }] }`;

    const brollTags = await callGeminiJson(tagPrompt);

    if (brollTags) {
      await db.from("activity_feed").insert({
        message: `[Mata] B-roll tagging complete: ${brollScenes.length || scenes.length} scenes tagged`,
        type: "broll_tags",
        metadata: {
          agent: "mata",
          sceneCount: brollScenes.length || scenes.length,
          brollTags,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (err: any) {
    results.errors.push(`B-roll tagging error: ${err.message}`);
  }
}


// ════════════════════════════════════════════════════════════════
// CONTENT PIPELINE
// ════════════════════════════════════════════════════════════════

// ── Content Calendar Generator ─────────────────────────────────
async function generateContentCalendar(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    const { data: chefs } = await db
      .from("chefs")
      .select("id, name, city, restaurant, course, dish_name")
      .eq("confirmed", true);

    const { data: storytelling } = await db
      .from("chef_storytelling")
      .select("chef_id, your_roots, your_voice, completed")
      .eq("completed", true);

    const { data: milestones } = await db
      .from("milestones")
      .select("title, due_date, status, workstream")
      .order("due_date", { ascending: true });

    const today = new Date().toISOString().split("T")[0];

    const calendarPrompt = `Create a content calendar for ${EVENT_NAME} (${EVENT_DATE}) starting from ${today}.

CHEFS: ${(chefs || []).map((c: Chef) => `${c.name} (${c.course || "TBD"}: ${c.dish_name || "TBD"})`).join(", ")}

CHEFS WITH COMPLETED STORIES: ${(storytelling || []).length}

MILESTONES:
${(milestones || []).slice(0, 15).map((m: Milestone) => `- ${m.title} [${m.status}] ${m.due_date || ""}`).join("\n")}

Create a content calendar with 3 phases:

1. PRE-EVENT (now through May 21)
   - Chef spotlight posts (1-2 per week, rotating chefs)
   - Behind-the-scenes content (prep, planning, arrivals)
   - Countdown content
   - Community engagement (polls, questions, throwbacks to previous years)
   - Teaser clips if video content is available

2. DAY-OF (May 22)
   - Real-time stories/reels (kitchen energy, plating, service)
   - Live updates
   - Guest reaction captures

3. POST-EVENT (May 23 through June 30)
   - Recap content (photos, video highlights)
   - Chef thank-you posts
   - Documentary teaser/trailer
   - Behind-the-scenes series
   - Community response roundup
   - "Take Home" series (what each chef took home from the experience)

For each piece of content, include:
- Publish date
- Phase
- Platform (Instagram, Substack, YouTube, TikTok)
- Content type (reel, carousel, story, post, article, video)
- Title/concept
- Description
- Source material needed
- Draft caption (for Instagram posts)
- Hashtags
- Status (planned)

Return as JSON array of content calendar items.

The calendar should feel intentional, not like a content mill. Each post should serve the narrative arc of the event. The pre-event content builds anticipation by introducing the people. The day-of content captures energy. The post-event content processes meaning. Think of it as the documentary's social media companion.`;

    const calendar = await callGeminiJson(calendarPrompt);

    if (calendar && Array.isArray(calendar)) {
      await db.from("activity_feed").insert({
        message: `[Mata] Content calendar generated: ${calendar.length} items across 3 phases`,
        type: "content_calendar",
        metadata: {
          agent: "mata",
          itemCount: calendar.length,
          calendar,
          preEvent: calendar.filter((c: any) => c.phase === "pre_event").length,
          dayOf: calendar.filter((c: any) => c.phase === "day_of").length,
          postEvent: calendar.filter((c: any) => c.phase === "post_event").length,
          generatedAt: new Date().toISOString(),
        },
      });
      results.contentCalendarItems = calendar.length;
    }
  } catch (err: any) {
    results.errors.push(`Content calendar error: ${err.message}`);
  }
}


// ── Short-Form Clip Schedule ───────────────────────────────────
async function generateClipSchedule(
  db: ReturnType<typeof createClient>,
  results: MataResults
) {
  try {
    const { data: sceneLogs } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "scene_log")
      .order("created_at", { ascending: true });

    const { data: brollEntry } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "broll_tags")
      .order("created_at", { ascending: false })
      .limit(1);

    const scenes = (sceneLogs || []).map((s: any) => s.metadata);
    const brollTags = brollEntry?.[0]?.metadata?.brollTags;

    const clipPrompt = `From the logged footage of "${DOCUMENTARY_TITLE}", suggest a short-form content clip schedule.

LOGGED SCENES: ${scenes.length}
${brollTags ? `B-ROLL TAGS AVAILABLE: Yes (${brollTags.tagged_scenes?.length || 0} tagged scenes)` : "No b-roll tags yet"}

SCENE SUMMARY:
${scenes.slice(0, 20).map((s: any) => `- ${s.scene_type}: ${s.description} [${s.emotional_beat || "neutral"}]`).join("\n")}

Suggest 15-20 short-form clips (15-60 seconds each) that can be cut from the footage. For each clip:
- Title
- Duration (seconds)
- Platform (Instagram Reel, TikTok, YouTube Short)
- Source scenes (which logged scenes to pull from)
- Edit style (montage, single take, interview snippet, b-roll compilation)
- Music/sound suggestion
- Caption concept
- Publish timing (relative to event: day-of, 1 week after, 2 weeks after, etc.)
- Narrative purpose (what story does this clip tell on its own?)

Prioritize clips that:
1. Can stand alone without context
2. Show the sensory beauty of the food and cooking
3. Feature authentic human moments
4. Tease the full documentary

Return as JSON array.`;

    const clips = await callGeminiJson(clipPrompt);

    if (clips && Array.isArray(clips)) {
      await db.from("activity_feed").insert({
        message: `[Mata] Clip schedule generated: ${clips.length} short-form clips`,
        type: "clip_schedule",
        metadata: {
          agent: "mata",
          clipCount: clips.length,
          clips,
          generatedAt: new Date().toISOString(),
        },
      });
      results.contentCalendarItems += clips.length;
    }
  } catch (err: any) {
    results.errors.push(`Clip schedule error: ${err.message}`);
  }
}


// ── Caption Drafts ─────────────────────────────────────────────
async function generateCaptions(
  db: ReturnType<typeof createClient>,
  results: MataResults,
  platform: string
) {
  try {
    // Get the content calendar
    const { data: calendarEntry } = await db
      .from("activity_feed")
      .select("metadata")
      .eq("type", "content_calendar")
      .order("created_at", { ascending: false })
      .limit(1);

    const calendar = calendarEntry?.[0]?.metadata?.calendar || [];
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Filter to upcoming items for the requested platform
    const upcoming = calendar.filter((item: any) =>
      item.platform?.toLowerCase().includes(platform.toLowerCase()) &&
      item.publish_date >= today &&
      item.publish_date <= nextWeek &&
      item.status !== "published"
    );

    if (upcoming.length === 0) {
      results.errors.push(`No upcoming ${platform} content in the next 7 days`);
      return;
    }

    // Get chef data for context
    const { data: chefs } = await db
      .from("chefs")
      .select("id, name, city, restaurant, dish_name")
      .eq("confirmed", true);

    const { data: storytelling } = await db
      .from("chef_storytelling")
      .select("chef_id, your_roots, your_voice")
      .eq("completed", true);

    const storyMap = new Map((storytelling || []).map((s: any) => [s.chef_id, s]));

    for (const item of upcoming.slice(0, 5)) {
      const captionPrompt = `Write a ${platform} caption for this upcoming ${EVENT_NAME} content:

Title: ${item.title}
Type: ${item.content_type}
Description: ${item.description}
Phase: ${item.phase}
Source Material: ${item.source_material}
${item.caption_draft ? `Existing Draft: ${item.caption_draft}` : ""}

CHEFS: ${(chefs || []).map((c: Chef) => c.name).join(", ")}

Write a caption that:
- Fits ${platform} conventions (length, tone, formatting)
- Honors the Istorya brand voice: warm, grounded, culturally specific
- Includes a call to engagement (question, invitation, reflection)
- Ends with relevant hashtags (5-8 for Instagram, 3-5 for others)
- No em dashes. No generic AI language.
- If referencing a specific chef, include something specific to their story

Return as JSON: { "caption": "...", "hashtags": ["..."], "alt_text": "...", "best_posting_time": "..." }`;

      const caption = await callGeminiJson(captionPrompt);

      if (caption) {
        await db.from("activity_feed").insert({
          message: `[Mata] Caption drafted for ${platform}: "${item.title}"`,
          type: "caption_draft",
          metadata: {
            agent: "mata",
            platform,
            contentTitle: item.title,
            publishDate: item.publish_date,
            caption: caption.caption,
            hashtags: caption.hashtags,
            altText: caption.alt_text,
            bestPostingTime: caption.best_posting_time,
            status: "pending_review",
            generatedAt: new Date().toISOString(),
          },
        });
        results.contentCalendarItems++;
      }
    }
  } catch (err: any) {
    results.errors.push(`Caption generation error: ${err.message}`);
  }
}


// ════════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ════════════════════════════════════════════════════════════════

// ── Gemini API (JSON mode) ─────────────────────────────────────
async function callGeminiJson(prompt: string): Promise<any | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[Mata] No GEMINI_API_KEY configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/[\[{][\s\S]*[\]}]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
    return null;
  } catch (err: any) {
    console.error("[Mata] Gemini API error:", err.message);
    return null;
  }
}

// ── Gemini API (text mode) ─────────────────────────────────────
async function callGeminiText(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.warn("[Mata] No GEMINI_API_KEY configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err: any) {
    console.error("[Mata] Gemini text API error:", err.message);
    return null;
  }
}

// ── Perplexity Sonar (for research-grounded content) ───────────
async function callPerplexity(prompt: string): Promise<string | null> {
  if (!SONAR_API_KEY) {
    console.warn("[Mata] No SONAR_API_KEY configured");
    return null;
  }

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
            content: "You are a researcher specializing in Filipino American culinary culture, documentary filmmaking, and cultural storytelling. Provide grounded, specific information.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err: any) {
    console.error("[Mata] Perplexity API error:", err.message);
    return null;
  }
}
