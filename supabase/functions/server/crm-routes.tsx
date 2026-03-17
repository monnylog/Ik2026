import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const crm = new Hono();

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
}

function getAnonClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY")
  );
}

// Upsert IK26 sponsors table (confirmed opportunities only)
crm.post("/make-server-5ed426e6/ik26/sponsors/upsert", async (c) => {
  try {
    const body = await c.req.json();
    const { sponsors } = body;

    if (!Array.isArray(sponsors) || sponsors.length === 0) {
      return c.json({ error: "sponsors array is required" }, 400);
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();

    const results = [];
    for (const sponsor of sponsors) {
      const { error } = await admin
        .from("ik26_sponsors")
        .upsert({
          id: sponsor.id,
          org_name: sponsor.org_name,
          type: sponsor.type,
          partner_tier: sponsor.partner_tier,
          logo_url: sponsor.logo_url || null,
          story_blurb: sponsor.story_blurb || null,
          visibility_score: sponsor.visibility_score || null,
          confirmed_date: sponsor.confirmed_date || now,
          synced_at: now,
        }, { onConflict: 'id' });

      if (error) {
        console.log(`Error upserting sponsor ${sponsor.id}:`, error);
        results.push({ id: sponsor.id, success: false, error: error.message });
      } else {
        results.push({ id: sponsor.id, success: true });
      }
    }

    return c.json({ success: true, results, count: results.filter(r => r.success).length });
  } catch (err) {
    console.log("Error upserting IK26 sponsors:", err);
    return c.json({ error: `Sponsor upsert failed: ${err}` }, 500);
  }
});

// Upsert IK26 organizations table
crm.post("/make-server-5ed426e6/ik26/orgs/upsert", async (c) => {
  try {
    const body = await c.req.json();
    const { orgs } = body;

    if (!Array.isArray(orgs) || orgs.length === 0) {
      return c.json({ error: "orgs array is required" }, 400);
    }

    const admin = getAdminClient();
    const now = new Date().toISOString();

    const results = [];
    for (const org of orgs) {
      const { error } = await admin
        .from("ik26_orgs")
        .upsert({
          id: org.id,
          name: org.name,
          type: org.type,
          region: org.region || null,
          ik_chapter: org.ik_chapter || null,
          community_impact: org.community_impact || [],
          synced_at: now,
        }, { onConflict: 'id' });

      if (error) {
        console.log(`Error upserting org ${org.id}:`, error);
        results.push({ id: org.id, success: false, error: error.message });
      } else {
        results.push({ id: org.id, success: true });
      }
    }

    return c.json({ success: true, results, count: results.filter(r => r.success).length });
  } catch (err) {
    console.log("Error upserting IK26 orgs:", err);
    return c.json({ error: `Org upsert failed: ${err}` }, 500);
  }
});

// Get all confirmed sponsors (for public-facing app)
crm.get("/make-server-5ed426e6/ik26/sponsors", async (c) => {
  try {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from("ik26_sponsors")
      .select("*")
      .order("confirmed_date", { ascending: false });

    if (error) throw error;
    return c.json({ sponsors: data || [] });
  } catch (err) {
    console.log("Error fetching IK26 sponsors:", err);
    return c.json({ error: `Failed to fetch sponsors: ${err}` }, 500);
  }
});

// Get all organizations
crm.get("/make-server-5ed426e6/ik26/orgs", async (c) => {
  try {
    const anon = getAnonClient();
    const { data, error } = await anon
      .from("ik26_orgs")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return c.json({ orgs: data || [] });
  } catch (err) {
    console.log("Error fetching IK26 orgs:", err);
    return c.json({ error: `Failed to fetch orgs: ${err}` }, 500);
  }
});

export { crm };
