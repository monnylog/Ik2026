import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

const travel = new Hono();

// GET all travel records (leadership/team)
travel.get("/make-server-5ed426e6/travel/records", async (c) => {
  try {
    const records = await kv.getByPrefix("ik26:travel:record:");
    records.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
    return c.json({ records });
  } catch (err: any) {
    console.log("Error fetching travel records:", err);
    return c.json({ error: `Failed to fetch travel records: ${err.message}` }, 500);
  }
});

// GET a single travel record by ID
travel.get("/make-server-5ed426e6/travel/records/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const record = await kv.get(`ik26:travel:record:${id}`);
    if (!record) return c.json({ error: "Travel record not found" }, 404);
    return c.json({ record });
  } catch (err: any) {
    console.log("Error fetching travel record:", err);
    return c.json({ error: `Failed to fetch travel record: ${err.message}` }, 500);
  }
});

// GET chef's own itinerary by chefDirectoryId
travel.get("/make-server-5ed426e6/travel/my-itinerary", async (c) => {
  try {
    const chefId = c.req.query("chefId");
    if (!chefId) return c.json({ error: "Missing chefId parameter" }, 400);

    const records = await kv.getByPrefix("ik26:travel:record:");
    const myRecord = records.find((r: any) => r.chefDirectoryId === chefId);

    const vegasGuide = await kv.get("ik26:travel:vegas-guide");
    const announcements = await kv.get("ik26:travel:announcements");

    return c.json({
      itinerary: myRecord || null,
      vegasGuide: vegasGuide || null,
      announcements: announcements || null,
    });
  } catch (err: any) {
    console.log("Error fetching chef itinerary:", err);
    return c.json({ error: `Failed to fetch itinerary: ${err.message}` }, 500);
  }
});

// POST create/update a travel record
travel.post("/make-server-5ed426e6/travel/records", async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, role, chefDirectoryId, origin, flightStatus, flightDetails, arrivalDate, departureDate, lodgingStatus, lodgingDetails, groundTransport, notes, contactPhone, contactEmail } = body;

    if (!id || !name) return c.json({ error: "Missing required fields: id, name" }, 400);

    const record = {
      id,
      name,
      role: role || "chef",
      chefDirectoryId: chefDirectoryId || null,
      origin: origin || "",
      flightStatus: flightStatus || "pending",
      flightDetails: flightDetails || "",
      arrivalDate: arrivalDate || "",
      departureDate: departureDate || "",
      lodgingStatus: lodgingStatus || "pending",
      lodgingDetails: lodgingDetails || "",
      groundTransport: groundTransport || "",
      notes: notes || "",
      contactPhone: contactPhone || "",
      contactEmail: contactEmail || "",
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`ik26:travel:record:${id}`, record);
    return c.json({ record });
  } catch (err: any) {
    console.log("Error saving travel record:", err);
    return c.json({ error: `Failed to save travel record: ${err.message}` }, 500);
  }
});

// DELETE a travel record
travel.delete("/make-server-5ed426e6/travel/records/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`ik26:travel:record:${id}`);
    return c.json({ deleted: id });
  } catch (err: any) {
    console.log("Error deleting travel record:", err);
    return c.json({ error: `Failed to delete travel record: ${err.message}` }, 500);
  }
});

// GET vegas guide content
travel.get("/make-server-5ed426e6/travel/vegas-guide", async (c) => {
  try {
    const guide = await kv.get("ik26:travel:vegas-guide");
    return c.json({ guide: guide || null });
  } catch (err: any) {
    console.log("Error fetching vegas guide:", err);
    return c.json({ error: `Failed to fetch vegas guide: ${err.message}` }, 500);
  }
});

// POST update vegas guide content (leadership only)
travel.post("/make-server-5ed426e6/travel/vegas-guide", async (c) => {
  try {
    const body = await c.req.json();
    const guide = {
      ...body,
      updatedAt: new Date().toISOString(),
    };
    await kv.set("ik26:travel:vegas-guide", guide);
    return c.json({ guide });
  } catch (err: any) {
    console.log("Error saving vegas guide:", err);
    return c.json({ error: `Failed to save vegas guide: ${err.message}` }, 500);
  }
});

// GET travel announcements
travel.get("/make-server-5ed426e6/travel/announcements", async (c) => {
  try {
    const data = await kv.get("ik26:travel:announcements");
    return c.json({ announcements: data || { items: [] } });
  } catch (err: any) {
    console.log("Error fetching travel announcements:", err);
    return c.json({ error: `Failed to fetch announcements: ${err.message}` }, 500);
  }
});

// POST update travel announcements (leadership only)
travel.post("/make-server-5ed426e6/travel/announcements", async (c) => {
  try {
    const body = await c.req.json();
    const data = {
      items: body.items || [],
      updatedAt: new Date().toISOString(),
    };
    await kv.set("ik26:travel:announcements", data);
    return c.json({ announcements: data });
  } catch (err: any) {
    console.log("Error saving travel announcements:", err);
    return c.json({ error: `Failed to save announcements: ${err.message}` }, 500);
  }
});

export { travel };
