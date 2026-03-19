import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const chefRoutes = new Hono();

// ─── Chef Profile Management ─────────────────────────────────────
// Handles chef onboarding and profile data

// GET chef profile by ID
chefRoutes.get("/make-server-5ed426e6/chef/profile/:chefId", async (c) => {
  try {
    const chefId = c.req.param("chefId");
    const profile = await kv.get(`ik26:chef-profile:${chefId}`);
    
    if (!profile) {
      return c.json({ error: "Chef profile not found" }, 404);
    }
    
    return c.json({ profile });
  } catch (err) {
    console.log("Error loading chef profile:", err);
    return c.json({ error: `Failed to load chef profile: ${err}` }, 500);
  }
});

// POST create/update chef profile (TIER 2A)
chefRoutes.post("/make-server-5ed426e6/chef/profile", async (c) => {
  try {
    const body = await c.req.json();
    const { chefId, fullName, restaurant, city, instagram, bio, headshotUrl, onboardingStage, notionPageId } = body;
    
    if (!chefId || !fullName) {
      return c.json({ error: "Missing required fields: chefId, fullName" }, 400);
    }
    
    const profile = {
      chefId,
      fullName,
      restaurant: restaurant || "",
      city: city || "",
      instagram: instagram || "",
      bio: bio || "",
      headshotUrl: headshotUrl || "",
      onboardingStage: onboardingStage || "Profile Complete",
      notionPageId: notionPageId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const key = `ik26:chef-profile:${chefId}`;
    await kv.set(key, profile);
    
    return c.json({ success: true, profile });
  } catch (err) {
    console.log("Error saving chef profile:", err);
    return c.json({ error: `Failed to save chef profile: ${err}` }, 500);
  }
});

// GET all chef profiles
chefRoutes.get("/make-server-5ed426e6/chef/profiles", async (c) => {
  try {
    const profiles = await kv.getByPrefix("ik26:chef-profile:");
    return c.json({ profiles, count: profiles.length });
  } catch (err) {
    console.log("Error loading chef profiles:", err);
    return c.json({ error: `Failed to load chef profiles: ${err}` }, 500);
  }
});

// ─── Dish Concept Submissions (TIER 2B) ──────────────────────────

// POST submit dish concept
chefRoutes.post("/make-server-5ed426e6/chef/dish-submission", async (c) => {
  try {
    const body = await c.req.json();
    const { chefId, chefName, dishName, description, historicalAnchor, dietaryFlags, notionPageId, timestamp } = body;
    
    if (!chefId || !dishName) {
      return c.json({ error: "Missing required fields: chefId, dishName" }, 400);
    }
    
    const submission = {
      chefId,
      chefName: chefName || "",
      dishName,
      description: description || "",
      historicalAnchor: historicalAnchor || "",
      dietaryFlags: dietaryFlags || [],
      notionPageId: notionPageId || null,
      timestamp: timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const key = `ik26:dish-submission:${chefId}`;
    await kv.set(key, submission);
    
    // Update submission count in dashboard metrics
    const metrics = await kv.get("ik26:dashboard-metrics") || {};
    metrics.chefSubmissions = (metrics.chefSubmissions || 0) + 1;
    await kv.set("ik26:dashboard-metrics", metrics);
    
    return c.json({ success: true, submission });
  } catch (err) {
    console.log("Error saving dish submission:", err);
    return c.json({ error: `Failed to save dish submission: ${err}` }, 500);
  }
});

// GET dish submission by chef ID
chefRoutes.get("/make-server-5ed426e6/chef/dish-submission/:chefId", async (c) => {
  try {
    const chefId = c.req.param("chefId");
    const submission = await kv.get(`ik26:dish-submission:${chefId}`);
    
    if (!submission) {
      return c.json({ submission: null });
    }
    
    return c.json({ submission });
  } catch (err) {
    console.log("Error loading dish submission:", err);
    return c.json({ error: `Failed to load dish submission: ${err}` }, 500);
  }
});

// GET all dish submissions
chefRoutes.get("/make-server-5ed426e6/chef/dish-submissions", async (c) => {
  try {
    const submissions = await kv.getByPrefix("ik26:dish-submission:");
    return c.json({ submissions, count: submissions.length });
  } catch (err) {
    console.log("Error loading dish submissions:", err);
    return c.json({ error: `Failed to load dish submissions: ${err}` }, 500);
  }
});

// ─── Travel Data Mirror (TIER 2C) ─────────────────────────────────
// When travel data is saved, we also mirror it to this endpoint for Notion sync

chefRoutes.post("/make-server-5ed426e6/chef/travel-mirror", async (c) => {
  try {
    const body = await c.req.json();
    const { chefId, chefName, arrivalDate, departureDate, travelMethod, hotel, notionPageId } = body;
    
    if (!chefId) {
      return c.json({ error: "Missing required field: chefId" }, 400);
    }
    
    const travelData = {
      chefId,
      chefName: chefName || "",
      arrivalDate: arrivalDate || "",
      departureDate: departureDate || "",
      travelMethod: travelMethod || "",
      hotel: hotel || "",
      notionPageId: notionPageId || null,
      lastSyncedAt: new Date().toISOString(),
    };
    
    const key = `ik26:chef-travel:${chefId}`;
    await kv.set(key, travelData);
    
    return c.json({ success: true, travelData });
  } catch (err) {
    console.log("Error saving chef travel data:", err);
    return c.json({ error: `Failed to save chef travel data: ${err}` }, 500);
  }
});

// GET chef travel data
chefRoutes.get("/make-server-5ed426e6/chef/travel/:chefId", async (c) => {
  try {
    const chefId = c.req.param("chefId");
    const travelData = await kv.get(`ik26:chef-travel:${chefId}`);
    
    return c.json({ travelData: travelData || null });
  } catch (err) {
    console.log("Error loading chef travel data:", err);
    return c.json({ error: `Failed to load chef travel data: ${err}` }, 500);
  }
});

// ─── Dashboard Metrics (for TIER 4A) ──────────────────────────────

chefRoutes.get("/make-server-5ed426e6/chef/dashboard-metrics", async (c) => {
  try {
    const [profiles, submissions, dishSubmissions] = await Promise.all([
      kv.getByPrefix("ik26:chef-profile:"),
      kv.getByPrefix("ik26:dish-submission:"),
      kv.getByPrefix("ik26:dish-submission:"),
    ]);
    
    // Count completed profiles
    const completedProfiles = profiles.filter((p: any) => p.onboardingStage === "Profile Complete").length;
    
    // Count milestones complete (placeholder - would need to query Notion or KV)
    const milestonesComplete = 0; // TODO: implement milestone tracking
    
    return c.json({
      chefSubmissions: submissions.length,
      chefOnboarding: completedProfiles,
      milestonesComplete,
      criticalItems: 0, // TODO: implement critical items tracking
    });
  } catch (err) {
    console.log("Error loading dashboard metrics:", err);
    return c.json({ error: `Failed to load dashboard metrics: ${err}` }, 500);
  }
});

export { chefRoutes };
