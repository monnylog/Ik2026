import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const expenses = new Hono();

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
}

// ─── Expense & Reimbursement System ────────────────────────────
// KV key pattern: ik26:expense:{id}
// Receipt files stored in Supabase Storage bucket

export const EXPENSE_BUCKET = "make-5ed426e6-receipts";

// Ensure receipt bucket exists on startup
(async () => {
  try {
    const admin = getAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === EXPENSE_BUCKET);
    if (!bucketExists) {
      await admin.storage.createBucket(EXPENSE_BUCKET, { public: false });
      console.log(`Created storage bucket: ${EXPENSE_BUCKET}`);
    }
  } catch (err) {
    console.log("Error ensuring receipt bucket:", err);
  }
})();

// Submit new expense
expenses.post("/make-server-5ed426e6/expenses", async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, submitted_by, role_team, expense_category, description, amount, receipt_base64, receipt_filename, date_submitted, notes } = body;

    if (!submitted_by || !expense_category || !amount) {
      return c.json({ error: "Missing required fields: submitted_by, expense_category, amount" }, 400);
    }

    const id = crypto.randomUUID();
    let receipt_url = "";

    // Upload receipt if provided (base64 encoded)
    if (receipt_base64 && receipt_filename) {
      try {
        const admin = getAdminClient();
        const ext = receipt_filename.split(".").pop() || "jpg";
        const filePath = `receipts/${id}.${ext}`;

        // Decode base64 to Uint8Array
        const binaryString = atob(receipt_base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const contentTypes: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
          webp: "image/webp", gif: "image/gif", pdf: "application/pdf",
        };
        const contentType = contentTypes[ext.toLowerCase()] || "application/octet-stream";

        const { error: uploadError } = await admin.storage
          .from(EXPENSE_BUCKET)
          .upload(filePath, bytes, { contentType, upsert: true });

        if (uploadError) {
          console.log("Receipt upload error:", uploadError);
        } else {
          const { data: signedData } = await admin.storage
            .from(EXPENSE_BUCKET)
            .createSignedUrl(filePath, 60 * 60 * 24 * 365);
          if (signedData) receipt_url = signedData.signedUrl;
        }
      } catch (uploadErr) {
        console.log("Receipt upload failed:", uploadErr);
      }
    }

    const expense = {
      id,
      user_id: user_id || "",
      submitted_by,
      role_team: role_team || "",
      expense_category,
      description: description || "",
      amount: parseFloat(amount),
      receipt_url,
      status: "Pending",
      approved_by: "",
      date_submitted: date_submitted || new Date().toISOString(),
      date_paid: "",
      notes: notes || "",
      created_at: new Date().toISOString(),
    };

    await kv.set(`ik26:expense:${id}`, expense);
    console.log(`Expense saved: ${id} by ${submitted_by} ($${amount})`);

    return c.json({ success: true, expense });
  } catch (err) {
    console.log("Error saving expense:", err);
    return c.json({ error: `Failed to save expense: ${err}` }, 500);
  }
});

// Get all expenses
expenses.get("/make-server-5ed426e6/expenses", async (c) => {
  try {
    const expenseList = await kv.getByPrefix("ik26:expense:");
    const sorted = (expenseList || [])
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json({ expenses: sorted });
  } catch (err) {
    console.log("Error loading expenses:", err);
    return c.json({ error: `Failed to load expenses: ${err}` }, 500);
  }
});

// Get expenses by user
expenses.get("/make-server-5ed426e6/expenses/user/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const expenseList = await kv.getByPrefix("ik26:expense:");
    const filtered = (expenseList || [])
      .filter((e: any) => e && (e.user_id === userId || e.submitted_by === userId))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return c.json({ expenses: filtered });
  } catch (err) {
    console.log("Error loading user expenses:", err);
    return c.json({ error: `Failed to load user expenses: ${err}` }, 500);
  }
});

// Update expense status (leadership: approve/deny/pay)
expenses.put("/make-server-5ed426e6/expenses/:id/status", async (c) => {
  try {
    const id = c.req.param("id");
    const { status, approved_by, notes } = await c.req.json();

    if (!status || !["Pending", "Approved", "Denied", "Paid"].includes(status)) {
      return c.json({ error: "Invalid status. Must be: Pending, Approved, Denied, Paid" }, 400);
    }

    const expense = await kv.get(`ik26:expense:${id}`);
    if (!expense) {
      return c.json({ error: "Expense not found" }, 404);
    }

    (expense as any).status = status;
    if (approved_by) (expense as any).approved_by = approved_by;
    if (notes !== undefined) (expense as any).notes = notes;
    if (status === "Paid") (expense as any).date_paid = new Date().toISOString();

    await kv.set(`ik26:expense:${id}`, expense);
    console.log(`Expense ${id} status updated to ${status}`);

    return c.json({ success: true, expense });
  } catch (err) {
    console.log("Error updating expense status:", err);
    return c.json({ error: `Failed to update expense: ${err}` }, 500);
  }
});

// Delete expense
expenses.delete("/make-server-5ed426e6/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`ik26:expense:${id}`);
    console.log(`Expense ${id} deleted`);
    return c.json({ success: true });
  } catch (err) {
    console.log("Error deleting expense:", err);
    return c.json({ error: `Failed to delete expense: ${err}` }, 500);
  }
});

// Expense summary (for finance dashboard cards)
expenses.get("/make-server-5ed426e6/expenses/summary", async (c) => {
  try {
    const expenseList = await kv.getByPrefix("ik26:expense:");
    const all = (expenseList || []).filter(Boolean);

    let totalAmount = 0, pendingAmount = 0, approvedAmount = 0, paidAmount = 0, deniedAmount = 0;
    let pendingCount = 0, approvedCount = 0, paidCount = 0, deniedCount = 0;
    const byCategory: Record<string, number> = {};
    const byPerson: Record<string, { total: number; pending: number; approved: number; paid: number; denied: number; count: number }> = {};

    for (const e of all) {
      const exp = e as any;
      const amt = exp.amount || 0;
      totalAmount += amt;

      if (exp.status === "Pending") { pendingAmount += amt; pendingCount++; }
      else if (exp.status === "Approved") { approvedAmount += amt; approvedCount++; }
      else if (exp.status === "Paid") { paidAmount += amt; paidCount++; }
      else if (exp.status === "Denied") { deniedAmount += amt; deniedCount++; }

      const cat = exp.expense_category || "Misc";
      byCategory[cat] = (byCategory[cat] || 0) + amt;

      const person = exp.submitted_by || "Unknown";
      if (!byPerson[person]) {
        byPerson[person] = { total: 0, pending: 0, approved: 0, paid: 0, denied: 0, count: 0 };
      }
      byPerson[person].total += amt;
      byPerson[person].count++;
      if (exp.status === "Pending") byPerson[person].pending += amt;
      else if (exp.status === "Approved") byPerson[person].approved += amt;
      else if (exp.status === "Paid") byPerson[person].paid += amt;
      else if (exp.status === "Denied") byPerson[person].denied += amt;
    }

    return c.json({
      total: all.length,
      totalAmount,
      pending: { count: pendingCount, amount: pendingAmount },
      approved: { count: approvedCount, amount: approvedAmount },
      paid: { count: paidCount, amount: paidAmount },
      denied: { count: deniedCount, amount: deniedAmount },
      byCategory,
      byPerson,
    });
  } catch (err) {
    console.log("Error loading expense summary:", err);
    return c.json({ error: `Failed to load expense summary: ${err}` }, 500);
  }
});

export { expenses };
