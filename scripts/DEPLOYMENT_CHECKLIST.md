# IK26 OPS CENTER — DEPLOYMENT CHECKLIST

**Owner:** Monica Blanco (monica.istorya@gmail.com)  
**Date:** March 14, 2026  
**Event:** Isang Kusina 2026 — May 22, 2026

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Notion Database Setup

- [ ] **Create 5 Notion databases** under IK26 Ops Center page:
  - [ ] Organizations (with schema from deployment prompt Section 2)
  - [ ] Contacts (with schema from deployment prompt Section 2)
  - [ ] Opportunities (with schema from deployment prompt Section 2)
  - [ ] Activities (with schema from deployment prompt Section 2)
  - [ ] Sync Log (with schema from deployment prompt Section 2)

- [ ] **Set Notion permissions:**
  - [ ] Team: Edit access on Organizations, Contacts, Opportunities, Activities
  - [ ] Team: View-only access on Sync Log
  - [ ] Monica: Full admin access on all databases

- [ ] **Create Notion views** (from deployment prompt Section 3):
  - [ ] Opportunities: Pipeline Board (grouped by Stage)
  - [ ] Opportunities: This Week Actions (filtered by Next Action Date)
  - [ ] Opportunities: High-Value Targets
  - [ ] Opportunities: Media / PR (filtered by Type)
  - [ ] Opportunities: New Intake (Last 7 Days)
  - [ ] Activities: Recent Activity (sorted by Date desc)
  - [ ] Activities: Today's Follow-ups (filtered by Next Follow-up Date)
  - [ ] Sync Log: Recent Syncs (sorted by Timestamp desc, limit 10)

- [ ] **Create Notion Forms** (from deployment prompt Section 4):
  - [ ] Partner / Sponsor Interest form (public URL)
  - [ ] Volunteer / Collaborator Interest form (public URL)
  - [ ] Internal Team Log (Activity) form (team-only URL)

- [ ] **Copy database IDs:**
  ```
  NOTION_ORGS_DB: ___________________________
  NOTION_CONTACTS_DB: ___________________________
  NOTION_OPPS_DB: ___________________________
  NOTION_ACTIVITIES_DB: ___________________________
  NOTION_SYNCLOG_DB: ___________________________
  ```

---

### 2. Google Sheets Setup

- [ ] **Create Google Sheet:** "IK26 Ops Mirror"
  - [ ] Share with: monica.istorya@gmail.com (owner), Walbert (view)

- [ ] **Create tabs:**
  - [ ] Opportunities (will be auto-populated by Flow A)
  - [ ] Activities (will be auto-populated by Flow A)
  - [ ] sync_log (will be auto-populated by all flows)
  - [ ] Pipeline Summary (manual/formula-based team view)
  - [ ] Admin (hidden/protected, Monica only)

- [ ] **Copy Sheet ID from URL:**
  ```
  https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
  
  SHEET_ID: ___________________________
  ```

---

### 3. Google Apps Script Setup

- [ ] **Create new Apps Script project:** "IK26 Ops Sync"
  - OR reuse existing: "Istorya Sync Engine" (ID: 1XylnFtLQqakJH3wmnKLrWUK1WpINihuCp3U4RoHAmQdGpGgUmPVRBOb0)

- [ ] **Add Script Properties** (Project Settings → Script Properties):
  ```
  NOTION_API_KEY: [from Notion integration "Istorya Sync Engine" or "Isang Kusina"]
  NOTION_ORGS_DB: [from step 1]
  NOTION_CONTACTS_DB: [from step 1]
  NOTION_OPPS_DB: [from step 1]
  NOTION_ACTIVITIES_DB: [from step 1]
  NOTION_SYNCLOG_DB: [from step 1]
  NOTION_MILESTONES_DB: [optional, for Flow F]
  SUPABASE_URL: [existing]
  SUPABASE_SERVICE_KEY: [existing]
  SHEET_ID: [from step 2]
  ```

- [ ] **Copy script files from `/scripts/` to Apps Script:**
  - [ ] `apps-script-flow-a-notion-to-sheets.gs`
  - [ ] `apps-script-flow-b-sheets-to-notion.gs`
  - [ ] `apps-script-flow-c-notion-to-supabase.gs`
  - [ ] `apps-script-flow-d-daily-digest.gs`
  - [ ] `apps-script-flow-e-gmail-to-activities.gs` (optional)
  - [ ] `apps-script-flow-f-calendar-milestones.gs` (optional)

- [ ] **Enable Advanced Google Services** (if using Flow E or F):
  - [ ] Gmail API (for Flow E)
  - [ ] Calendar API (for Flow F — auto-enabled)

---

### 4. Supabase Setup

- [ ] **Run migration:**
  ```bash
  # From project root:
  supabase db push
  
  # Or manually execute:
  # /supabase/migrations/20260314_create_ik26_tables.sql
  ```

- [ ] **Verify tables exist:**
  - [ ] `ik26_sponsors` (with RLS policies)
  - [ ] `ik26_orgs` (with RLS policies)

- [ ] **Test RLS policies:**
  ```sql
  -- As anon (should work):
  SELECT * FROM ik26_sponsors;
  
  -- As anon (should fail):
  INSERT INTO ik26_sponsors (id, org_name) VALUES ('test', 'Test Org');
  ```

- [ ] **Deploy edge function update** (if needed):
  ```bash
  supabase functions deploy make-server-5ed426e6
  ```

- [ ] **Test new routes:**
  ```bash
  # GET sponsors:
  curl https://[PROJECT_ID].supabase.co/functions/v1/make-server-5ed426e6/ik26/sponsors \
    -H "Authorization: Bearer [ANON_KEY]"
  
  # POST sponsors (service_role only):
  curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/make-server-5ed426e6/ik26/sponsors/upsert \
    -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
    -H "Content-Type: application/json" \
    -d '{"sponsors": [{"id": "test", "org_name": "Test", "type": "Sponsorship"}]}'
  ```

---

## 🚀 DEPLOYMENT SEQUENCE

### Step 1: Test Flow A (Notion → Sheets)

- [ ] **Manually run:** `syncNotionToSheets()` from Apps Script
- [ ] **Verify:**
  - [ ] Opportunities tab populated with data from Notion
  - [ ] Activities tab populated with data from Notion
  - [ ] sync_log tab has an entry
  - [ ] Notion Sync Log database has a new entry

- [ ] **Set up trigger:**
  - [ ] Run `setupFlowATrigger()` once
  - [ ] Verify trigger appears in Apps Script Triggers panel (runs every 4 hours)

---

### Step 2: Test Flow B (Sheets → Notion)

- [ ] **Manually edit** a row in Opportunities sheet:
  - [ ] Change `confidence_pct` to a test value (e.g., 75)
  - [ ] Change `projected_value` to a test value (e.g., 5000)
  - [ ] Change `priority_rank` to a test value (e.g., 3)

- [ ] **Manually run:** `syncSheetsToNotion()` from Apps Script
- [ ] **Verify:**
  - [ ] Notion Opportunity page shows updated values
  - [ ] Protected fields (Name, Stage, etc.) were NOT changed
  - [ ] sync_log tab has an entry
  - [ ] Notion Sync Log database has a new entry

- [ ] **Set up trigger:**
  - [ ] Run `setupFlowBTrigger()` once
  - [ ] Verify trigger appears (runs every 6 hours)

---

### Step 3: Test Flow C (Notion → Supabase)

- [ ] **Create a test Opportunity in Notion:**
  - [ ] Set Stage = "Confirmed"
  - [ ] Fill in Organization, Partner Tier, Visibility Score

- [ ] **Manually run:** `syncNotionToSupabase()` from Apps Script
- [ ] **Verify:**
  - [ ] Supabase `ik26_sponsors` table has a new row
  - [ ] Supabase `ik26_orgs` table has the related organization
  - [ ] Notion Sync Log database has a new entry

- [ ] **Set up trigger:**
  - [ ] Run `setupFlowCTrigger()` once
  - [ ] Verify trigger appears (runs every 4 hours)

---

### Step 4: Test Flow D (Daily Digest)

- [ ] **Create a test Opportunity with Next Action Date = today**
- [ ] **Manually run:** `sendDailyDigest()` from Apps Script
- [ ] **Verify:**
  - [ ] Email received at monica.istorya@gmail.com
  - [ ] Email contains the test opportunity
  - [ ] Notion Sync Log database has a new entry

- [ ] **Set up triggers:**
  - [ ] Run `setupFlowDTriggers()` once
  - [ ] Verify 2 triggers appear:
    - `sendDailyDigest` (daily at 8:00 AM PT)
    - `checkStageChanges` (every 4 hours)

---

### Step 5: (Optional) Test Flow E (Gmail → Activities)

⚠️ **Only if you want automatic email tracking**

- [ ] **Enable Gmail API** in Apps Script Advanced Services
- [ ] **Send a test email** from a known contact to monica.istorya@gmail.com
- [ ] **Manually run:** `syncGmailToActivities()` from Apps Script
- [ ] **Verify:**
  - [ ] New Activity created in Notion with Type = "Email"
  - [ ] Activity is linked to the correct Contact
  - [ ] Notion Sync Log database has a new entry

- [ ] **Set up trigger:**
  - [ ] Run `setupFlowETrigger()` once
  - [ ] Verify trigger appears (runs every 15 minutes)

---

### Step 6: (Optional) Test Flow F (Calendar ↔ Milestones)

⚠️ **Only if you want calendar sync**

- [ ] **Add custom property to Milestones database:**
  - [ ] Property name: `Calendar Event ID`
  - [ ] Property type: Rich Text

- [ ] **Create a test calendar event:**
  - [ ] Title: `[IK26] Test Milestone`
  - [ ] Calendar: monica.istorya@gmail.com

- [ ] **Manually run:** `syncCalendarMilestones()` from Apps Script
- [ ] **Verify:**
  - [ ] New Milestone created in Notion with title "Test Milestone"
  - [ ] Notion Sync Log database has a new entry

- [ ] **Create a test Milestone in Notion with a date:**
- [ ] **Manually run:** `syncCalendarMilestones()` from Apps Script
- [ ] **Verify:**
  - [ ] New calendar event created with `[IK26]` prefix
  - [ ] Milestone in Notion has Calendar Event ID populated

- [ ] **Set up trigger:**
  - [ ] Run `setupFlowFTrigger()` once
  - [ ] Verify trigger appears (runs every 30 minutes)

---

### Step 7: Figma Make App Integration

- [ ] **Verify edge function routes:**
  ```bash
  # Test GET sponsors:
  curl https://[PROJECT_ID].supabase.co/functions/v1/make-server-5ed426e6/ik26/sponsors \
    -H "Authorization: Bearer [ANON_KEY]"
  
  # Should return confirmed sponsors from Supabase
  ```

- [ ] **Check app renders sponsors:**
  - [ ] Open Figma Make app
  - [ ] Navigate to Sponsors page (if exists)
  - [ ] Verify confirmed sponsors appear

---

### Step 8: End-to-End Test

- [ ] **Create a full test workflow:**
  1. [ ] Create new Organization in Notion (e.g., "Test Sponsor Co")
  2. [ ] Create new Contact in Notion linked to that org
  3. [ ] Create new Opportunity in Notion:
     - [ ] Link to Organization and Contact
     - [ ] Set Type = "Sponsorship"
     - [ ] Set Stage = "New lead"
     - [ ] Set Next Action Date = today
     - [ ] Set Potential Value = $10,000
  4. [ ] Wait for Flow A to sync (or run manually)
  5. [ ] Verify Opportunity appears in Sheets
  6. [ ] Edit `confidence_pct` in Sheets (e.g., set to 80)
  7. [ ] Wait for Flow B to sync (or run manually)
  8. [ ] Verify Confidence % updated in Notion
  9. [ ] Change Stage in Notion to "Confirmed"
  10. [ ] Wait for Flow C to sync (or run manually)
  11. [ ] Verify sponsor appears in Supabase `ik26_sponsors` table
  12. [ ] Verify sponsor appears in Figma Make app
  13. [ ] Verify Sync Log has entries for all 3 flows

- [ ] **Clean up test data:**
  - [ ] Delete test Opportunity from Notion
  - [ ] Delete test Organization and Contact
  - [ ] Remove test rows from Sheets
  - [ ] Remove test rows from Supabase

---

## 📋 POST-DEPLOYMENT

### Data Migration

- [ ] **Migrate existing Comms Tracker data:**
  - [ ] Export current Comms Tracker database
  - [ ] Map rows to Organizations, Contacts, and Opportunities
  - [ ] Import into new databases
  - [ ] Verify no data loss

### Team Training

- [ ] **Share documentation with team:**
  - [ ] How to create Opportunities
  - [ ] How to log Activities
  - [ ] How to use Pipeline Board view
  - [ ] Public form URLs for intake

### Monitoring

- [ ] **Set up execution log monitoring:**
  - [ ] Review Apps Script execution logs weekly
  - [ ] Check Notion Sync Log for errors
  - [ ] Monitor Supabase edge function logs

- [ ] **Create dashboard/report:**
  - [ ] Pipeline Summary sheet with formulas
  - [ ] KPIs: Total opps, Confirmed value, Conversion rate

---

## 🛑 ROLLBACK PLAN

If anything breaks:

1. **Disable all triggers:**
   - Go to Apps Script → Triggers
   - Delete all IK26 Ops Sync triggers

2. **Revert to manual workflow:**
   - Continue using Notion as source of truth
   - Manually update Sheets if needed

3. **Debug:**
   - Check Apps Script execution logs
   - Check Notion Sync Log for error details
   - Check Supabase edge function logs

4. **Re-enable one flow at a time** after fixes

---

## 📞 SUPPORT

**Owner:** Monica Blanco  
**Email:** monica.istorya@gmail.com  
**Notion Workspace:** Take Home Studio / ISTORYA  
**Apps Script Project:** IK26 Ops Sync  
**Supabase Project:** Istorya app

---

## ✅ FINAL SIGN-OFF

- [ ] All 5 Notion databases created and configured
- [ ] All required Apps Script triggers running
- [ ] Supabase tables deployed with RLS
- [ ] End-to-end test passed
- [ ] Team trained on new workflow
- [ ] Documentation shared

**Deployment completed by:** _________________  
**Date:** _________________  
**Notes:** _________________
