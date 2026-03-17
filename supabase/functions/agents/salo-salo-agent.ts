// ════════════════════════════════════════════════════════════════
// IK26 AGENT: SALO-SALO (Gathering to Eat Together)
// ════════════════════════════════════════════════════════════════
// Ensures every chef arrives at the table cared for.
// Monitors onboarding progress, sends warm nudges for stalled steps,
// tracks travel status, and flags expense issues.
//
// Deployment: Supabase Edge Function (Deno)
// Trigger: Daily cron via pg_cron or external scheduler
// Stack: Supabase (PostgreSQL, pgmq email queue), Gemini API
// ════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// ── Types ──────────────────────────────────────────────────────
interface Chef {
  id: string;
  name: string;
  city: string | null;
  restaurant: string | null;
  confirmed: boolean | null;
}

interface ChefOnboarding {
  id: string;
  chef_id: string;
  full_name: string | null;
  email: string | null;
  current_step: number | null;
  completed: boolean | null;
  updated_at: string;
  headshot_url: string | null;
  bio: string | null;
  culinary_story: string | null;
  e_signature: string | null;
}

interface TravelLodging {
  id: string;
  chef_id: string;
  chef_name: string;
  origin_city: string | null;
  flight_status: string;
  lodging_status: string;
  arrival_date: string | null;
  departure_date: string | null;
}

interface ChefExpense {
  id: string;
  chef_id: string;
  category: string;
  amount: number;
  receipt_url: string | null;
  status: string;
  date: string | null;
}

// ── Step Definitions ───────────────────────────────────────────
const ONBOARDING_STEPS: Record<number, { name: string; description: string }> = {
  1: { name: "About You", description: "basic profile info (name, pronouns, restaurant, contact)" },
  2: { name: "Your Story", description: "culinary story and bio" },
  3: { name: "Travel Details", description: "travel city, airport, arrival and departure dates" },
  4: { name: "Lodging Preferences", description: "lodging preferences and dietary needs" },
  5: { name: "Media & Headshot", description: "headshot upload and media release consent" },
  6: { name: "Acknowledgments", description: "food safety acknowledgment, code of conduct, and e-signature" },
};

// ── Configuration ──────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const STALL_THRESHOLD_HOURS = 48;
const EVENT_DATE = "May 22, 2026";
const LEADERSHIP_EMAIL = "monica.istorya@gmail.com";

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Only accept POST (for cron triggers) or GET (for manual testing)
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const results = {
    nudgesSent: 0,
    travelAlerts: 0,
    expenseFlags: 0,
    errors: [] as string[],
  };

  try {
    const db = getAdminClient();

    // 1. Check onboarding progress and send nudges
    await checkOnboardingProgress(db, results);

    // 2. Check travel status
    await checkTravelStatus(db, results);

    // 3. Check expenses for missing receipts
    await checkExpenses(db, results);

    // 4. Send leadership summary if there are items to report
    if (results.nudgesSent > 0 || results.travelAlerts > 0 || results.expenseFlags > 0) {
      await sendLeadershipSummary(db, results);
    }

    console.log(`[Salo-Salo] Complete: ${results.nudgesSent} nudges, ${results.travelAlerts} travel alerts, ${results.expenseFlags} expense flags`);

    return new Response(JSON.stringify({
      ok: true,
      agent: "salo-salo",
      ...results,
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("[Salo-Salo] Fatal error:", err);
    return new Response(JSON.stringify({
      ok: false,
      agent: "salo-salo",
      error: err.message,
      ...results,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ── 1. Check Onboarding Progress ───────────────────────────────
async function checkOnboardingProgress(
  db: ReturnType<typeof createClient>,
  results: typeof Object.prototype
) {
  // Get all chefs
  const { data: chefs, error: chefsErr } = await db
    .from("chefs")
    .select("id, name, city, restaurant, confirmed")
    .eq("confirmed", true);

  if (chefsErr || !chefs) {
    results.errors.push(`Failed to fetch chefs: ${chefsErr?.message}`);
    return;
  }

  // Get all onboarding records
  const { data: onboardings, error: onbErr } = await db
    .from("chef_onboarding")
    .select("*");

  if (onbErr || !onboardings) {
    results.errors.push(`Failed to fetch onboarding: ${onbErr?.message}`);
    return;
  }

  const onboardingMap = new Map(
    onboardings.map((o: ChefOnboarding) => [o.chef_id, o])
  );

  const now = Date.now();

  for (const chef of chefs as Chef[]) {
    const onboarding = onboardingMap.get(chef.id) as ChefOnboarding | undefined;

    // Case 1: Chef has no onboarding record at all
    if (!onboarding) {
      await sendNudgeEmail(db, {
        chefName: chef.name,
        chefEmail: null, // We don't have their email yet
        step: 0,
        stepName: "Getting Started",
        message: `${chef.name} from ${chef.city || "their city"} hasn't started onboarding yet. They may need the onboarding link.`,
        isLeadershipOnly: true,
      });
      results.nudgesSent++;
      continue;
    }

    // Case 2: Already completed
    if (onboarding.completed) continue;

    // Case 3: Stalled on a step
    const updatedAt = new Date(onboarding.updated_at).getTime();
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

    if (hoursSinceUpdate >= STALL_THRESHOLD_HOURS) {
      const currentStep = onboarding.current_step || 1;
      const stepInfo = ONBOARDING_STEPS[currentStep] || { name: `Step ${currentStep}`, description: "this section" };

      // Generate a warm nudge using Gemini
      const nudgeBody = await generateNudge(chef.name, stepInfo.name, stepInfo.description, Math.round(hoursSinceUpdate));

      await sendNudgeEmail(db, {
        chefName: chef.name,
        chefEmail: onboarding.email,
        step: currentStep,
        stepName: stepInfo.name,
        message: nudgeBody,
        isLeadershipOnly: !onboarding.email, // Only notify leadership if we don't have chef's email
      });
      results.nudgesSent++;
    }
  }
}

// ── 2. Check Travel Status ─────────────────────────────────────
async function checkTravelStatus(
  db: ReturnType<typeof createClient>,
  results: typeof Object.prototype
) {
  const { data: travel, error: travelErr } = await db
    .from("travel_lodging")
    .select("*")
    .or("flight_status.eq.TBD,lodging_status.eq.TBD");

  if (travelErr || !travel) {
    results.errors.push(`Failed to fetch travel: ${travelErr?.message}`);
    return;
  }

  // Flag any travel records that are still TBD and the event is within 30 days
  const eventDate = new Date("2026-05-22");
  const daysUntilEvent = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilEvent <= 60) {
    for (const record of travel as TravelLodging[]) {
      const issues: string[] = [];
      if (record.flight_status === "TBD") issues.push("flight not booked");
      if (record.lodging_status === "TBD") issues.push("lodging not confirmed");

      if (issues.length > 0) {
        // Log to activity_feed
        await db.from("activity_feed").insert({
          chef_id: record.chef_id,
          message: `[Salo-Salo] Travel alert for ${record.chef_name}: ${issues.join(", ")}. ${daysUntilEvent} days until event.`,
          type: "travel_alert",
          metadata: { agent: "salo-salo", issues, daysUntilEvent },
        });
        results.travelAlerts++;
      }
    }
  }
}

// ── 3. Check Expenses ──────────────────────────────────────────
async function checkExpenses(
  db: ReturnType<typeof createClient>,
  results: typeof Object.prototype
) {
  // Find submitted expenses without receipts
  const { data: expenses, error: expErr } = await db
    .from("chef_expenses")
    .select("*, chefs(name)")
    .eq("status", "submitted")
    .is("receipt_url", null);

  if (expErr || !expenses) {
    results.errors.push(`Failed to fetch expenses: ${expErr?.message}`);
    return;
  }

  for (const expense of expenses as (ChefExpense & { chefs: { name: string } })[]) {
    // Log to activity_feed
    await db.from("activity_feed").insert({
      chef_id: expense.chef_id,
      message: `[Salo-Salo] Expense "${expense.category}" ($${expense.amount}) from ${expense.chefs?.name || "a chef"} is missing a receipt.`,
      type: "expense_flag",
      metadata: { agent: "salo-salo", expenseId: expense.id, amount: expense.amount },
    });
    results.expenseFlags++;
  }
}

// ── Generate Warm Nudge via Gemini ─────────────────────────────
async function generateNudge(
  chefName: string,
  stepName: string,
  stepDescription: string,
  hoursSinceUpdate: number
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return getDefaultNudge(chefName, stepName);
  }

  const prompt = `Write a short, warm email nudge (under 120 words) from the Isang Kusina 2026 team to a chef named ${chefName}. They've been on the "${stepName}" step of their onboarding for about ${hoursSinceUpdate} hours. This step involves ${stepDescription}.

The tone should be caring, not nagging. Like a friend checking in, not a corporate reminder. Reference the event date (${EVENT_DATE}) gently if it helps create urgency. No em dashes. No generic AI language. Start with "Hi ${chefName.split(" ")[0]}," and end naturally before a sign-off.

This is for Isang Kusina, a collaborative Filipino dinner event celebrating heritage through food. The team genuinely cares about each chef's experience.`;

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
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.error("[Salo-Salo] Gemini error:", err);
  }

  return getDefaultNudge(chefName, stepName);
}

function getDefaultNudge(chefName: string, stepName: string): string {
  const firstName = chefName.split(" ")[0];
  return `Hi ${firstName},\n\nJust checking in on your Isang Kusina onboarding. We noticed you're on the "${stepName}" section. No rush at all, but we want to make sure you have everything you need to move forward. If you have questions or need help with anything, just reply to this email.\n\nWe're so excited to have you at the table.\n\nWarmly,\nThe Isang Kusina Team`;
}

// ── Send Nudge Email via pgmq ──────────────────────────────────
async function sendNudgeEmail(
  db: ReturnType<typeof createClient>,
  opts: {
    chefName: string;
    chefEmail: string | null;
    step: number;
    stepName: string;
    message: string;
    isLeadershipOnly: boolean;
  }
) {
  const subject = opts.step === 0
    ? `[IK26] Onboarding not started: ${opts.chefName}`
    : `Isang Kusina 2026: Your onboarding (${opts.stepName})`;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; font-size: 14px; color: #1a1a1a;">
      ${opts.isLeadershipOnly ? `<div style="background: #fef3c7; border-left: 3px solid #d97706; padding: 8px 12px; margin-bottom: 16px; font-size: 12px; color: #92400e;">
        <strong>[Salo-Salo Agent]</strong> Leadership-only alert. Chef email not available.
      </div>` : ""}
      ${opts.message.replace(/\n/g, "<br>")}
      <br><br>
      <span style="color: #6b7280; font-size: 12px;">Isang Kusina 2026 | ${EVENT_DATE} | Las Vegas, NV</span>
    </div>
  `;

  // If we have the chef's email, send to them; otherwise alert leadership
  const toEmail = opts.isLeadershipOnly ? LEADERSHIP_EMAIL : opts.chefEmail!;

  // Use the pgmq email queue if available, otherwise insert into activity_feed
  try {
    const { error } = await db.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: toEmail,
        subject: subject,
        html: htmlBody,
        text: opts.message,
        from_name: "Isang Kusina Team",
        tags: ["salo-salo-agent", "onboarding-nudge"],
      },
    });

    if (error) {
      console.log(`[Salo-Salo] pgmq enqueue failed (${error.message}), logging to activity_feed instead`);
      // Fallback: log to activity_feed for manual follow-up
      await logToActivityFeed(db, opts);
    }
  } catch {
    // pgmq may not be set up; fall back to activity_feed
    await logToActivityFeed(db, opts);
  }
}

async function logToActivityFeed(
  db: ReturnType<typeof createClient>,
  opts: { chefName: string; step: number; stepName: string; message: string }
) {
  await db.from("activity_feed").insert({
    message: `[Salo-Salo] Onboarding nudge for ${opts.chefName} (stalled on step ${opts.step}: ${opts.stepName})`,
    type: "onboarding_nudge",
    metadata: { agent: "salo-salo", step: opts.step, stepName: opts.stepName },
  });
}

// ── Leadership Summary ─────────────────────────────────────────
async function sendLeadershipSummary(
  db: ReturnType<typeof createClient>,
  results: { nudgesSent: number; travelAlerts: number; expenseFlags: number; errors: string[] }
) {
  const subject = `[IK26] Salo-Salo Daily: ${results.nudgesSent} nudges, ${results.travelAlerts} travel alerts, ${results.expenseFlags} expense flags`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 8px; font-size: 16px;">
        Salo-Salo Daily Summary
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Onboarding Nudges Sent</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">${results.nudgesSent}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Travel Alerts</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">${results.travelAlerts}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Expense Flags</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; text-align: right;">${results.expenseFlags}</td></tr>
      </table>
      ${results.errors.length > 0 ? `<p style="color: #dc2626; font-size: 12px;">Errors: ${results.errors.join("; ")}</p>` : ""}
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Salo-Salo Agent | IK26 Ops Center</p>
    </div>
  `;

  try {
    await db.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: LEADERSHIP_EMAIL,
        subject,
        html,
        text: `Salo-Salo Daily: ${results.nudgesSent} nudges, ${results.travelAlerts} travel alerts, ${results.expenseFlags} expense flags`,
        from_name: "IK26 Salo-Salo Agent",
        tags: ["salo-salo-agent", "daily-summary"],
      },
    });
  } catch (err) {
    console.log("[Salo-Salo] Could not send leadership summary via pgmq:", err);
  }
}
