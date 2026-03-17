# IK26 OPS CENTER — INTEGRATION SUMMARY

**Comprehensive deployment completed for Notion-based CRM with Google Apps Script automation and Supabase public data layer**

---

## ✅ WHAT WAS COMPLETED

### A. App-Side Updates (Figma Make / Supabase Edge Functions)

**File:** `/supabase/functions/server/index.tsx`

**Added 4 new routes:**
1. `POST /make-server-5ed426e6/ik26/sponsors/upsert` — Upsert confirmed sponsors from Notion
2. `POST /make-server-5ed426e6/ik26/orgs/upsert` — Upsert organizations from Notion
3. `GET /make-server-5ed426e6/ik26/sponsors` — Public read access to confirmed sponsors
4. `GET /make-server-5ed426e6/ik26/orgs` — Public read access to organizations

**Purpose:**
- Apps Script Flow C calls the POST endpoints to sync confirmed sponsors to Supabase
- Figma Make app calls the GET endpoints to display sponsors publicly
- RLS enforced: anon = read-only, service_role = full write access

---

### B. Google Apps Script Templates (6 Flows)

**Location:** `/scripts/`

#### Flow A: Notion → Sheets Mirror
**File:** `apps-script-flow-a-notion-to-sheets.gs`  
**Trigger:** Every 4 hours  
**Purpose:** Syncs Opportunities and Activities from Notion to Google Sheets

**Features:**
- Queries Notion databases with pagination support
- Upserts rows to Sheets (matches by `notion_page_id`)
- Extracts all property types (title, rich_text, select, multi_select, date, number, relation)
- Logs to both Sheets `sync_log` tab and Notion Sync Log DB
- Idempotent: re-running never duplicates data

---

#### Flow B: Sheets → Notion Write-back
**File:** `apps-script-flow-b-sheets-to-notion.gs`  
**Trigger:** Every 6 hours (runs AFTER Flow A)  
**Purpose:** Syncs computed fields from Sheets back to Notion

**Features:**
- Writes ONLY safe fields: `confidence_pct`, `projected_value`, `priority_rank`
- NEVER touches protected fields (Name, Stage, Relations, Notes, Relationship Story)
- Rate limiting: 200ms pause between updates
- Comprehensive error handling with per-record logging

---

#### Flow C: Notion → Supabase Upsert
**File:** `apps-script-flow-c-notion-to-supabase.gs`  
**Trigger:** Every 4 hours  
**Purpose:** Syncs confirmed sponsors to Supabase for public-facing app

**Features:**
- Queries Opportunities where Stage = "Confirmed"
- Transforms to sponsor records with tier, visibility, story blurb
- Fetches related Organizations and syncs to `ik26_orgs` table
- Calls Supabase edge function `/ik26/sponsors/upsert` and `/ik26/orgs/upsert`
- Service role key authentication

---

#### Flow D: Daily Digest & Notifications
**File:** `apps-script-flow-d-daily-digest.gs`  
**Trigger:** Daily at 8:00 AM PT + every 4 hours  
**Purpose:** Sends action digest and stage change alerts

**Features:**
- **Daily digest:** Emails monica.istorya@gmail.com with:
  - Opportunities due today
  - Overdue opportunities
  - Formatted HTML email with Notion links
- **Stage change alerts:** Detects moves to "Confirmed" or "In negotiation" and sends immediate email
- Compares current Notion data with last Sheets snapshot to detect changes

---

#### Flow E: Gmail → Activities (Optional)
**File:** `apps-script-flow-e-gmail-to-activities.gs`  
**Trigger:** Every 15 minutes  
**Purpose:** Auto-creates Activity records when known contacts reply

**Features:**
- Scans unread emails in monica.istorya@gmail.com
- Matches sender email against Contacts database
- Creates Activity with Type = "Email", Outcome = "Reply received"
- Includes email snippet in Notes field
- Skips unknown senders (logs as "Skipped")
- Requires Gmail API enabled in Advanced Services

---

#### Flow F: Calendar ↔ Milestones (Optional)
**File:** `apps-script-flow-f-calendar-milestones.gs`  
**Trigger:** Every 30 minutes  
**Purpose:** Two-way sync between Google Calendar and Notion Milestones

**Features:**
- **Calendar → Notion:** Syncs events tagged with `[IK26]` to Milestones database
- **Notion → Calendar:** Creates calendar events for Milestones with dates
- Stores Calendar Event ID in Notion for deduplication
- Requires custom "Calendar Event ID" property in Milestones DB

---

### C. Supabase Schema Migration

**File:** `/supabase/migrations/20260314_create_ik26_tables.sql`

**Created 2 tables:**

#### Table: `ik26_sponsors`
```sql
Columns:
- id (TEXT, PK): Notion page ID
- org_name (TEXT, NOT NULL)
- type (TEXT): Sponsorship, Partnership, Media/PR, etc.
- partner_tier (TEXT): Community Ally, Cultural Partner, Anchor Sponsor, etc.
- logo_url (TEXT, nullable)
- story_blurb (TEXT): From "Relationship Story" in Notion
- visibility_score (TEXT): Low, Medium, High
- confirmed_date (TIMESTAMPTZ)
- synced_at (TIMESTAMPTZ)

Indexes:
- confirmed_date DESC
- partner_tier

RLS Policies:
- anon: SELECT only
- service_role: ALL
```

#### Table: `ik26_orgs`
```sql
Columns:
- id (TEXT, PK): Notion page ID
- name (TEXT, NOT NULL)
- type (TEXT): Sponsor, Media, Community Org, Vendor, etc.
- region (TEXT): Las Vegas, National, Philippines, Other
- ik_chapter (TEXT): Origins, Year 2, Year 3 (Fil-Am), Residency
- community_impact (TEXT[]): Array of tags
- synced_at (TIMESTAMPTZ)

Indexes:
- name
- type
- community_impact (GIN index for array searches)

RLS Policies:
- anon: SELECT only
- service_role: ALL
```

---

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTION (Source of Truth)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Organizations │  │   Contacts   │  │Opportunities │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  Activities  │  │  Sync Log    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│             GOOGLE APPS SCRIPT (Automation Layer)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Flow A: Notion → Sheets (every 4h)                  │   │
│  │  Flow B: Sheets → Notion (every 6h, safe fields)     │   │
│  │  Flow C: Notion → Supabase (every 4h, confirmed)     │   │
│  │  Flow D: Daily digest + stage alerts (8AM + 4h)      │   │
│  │  Flow E: Gmail → Activities (every 15m, optional)    │   │
│  │  Flow F: Calendar ↔ Milestones (every 30m, optional) │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           │                      │                     │
           ↓                      ↓                     ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  GOOGLE SHEETS   │  │    SUPABASE      │  │  GMAIL / GCAL    │
│                  │  │                  │  │                  │
│  Opportunities   │  │  ik26_sponsors   │  │  Digest emails   │
│  Activities      │  │  ik26_orgs       │  │  Stage alerts    │
│  sync_log        │  │  (RLS: public    │  │  Auto-activities │
│  Pipeline Summary│  │   read-only)     │  │  Calendar sync   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                              │
                              ↓
                  ┌──────────────────────┐
                  │   FIGMA MAKE APP     │
                  │                      │
                  │  • Sponsors page     │
                  │  • Orgs directory    │
                  │  • Public read-only  │
                  └──────────────────────┘
```

---

## 🔐 ACCESS CONTROL MATRIX

| Tool | Monica | Walbert | Team | Public |
|------|--------|---------|------|--------|
| **Notion DBs (edit)** | ✅ Full | ✅ Full (Take Home Studio space) | ✅ Orgs, Contacts, Opps, Activities | ❌ |
| **Notion Sync Log** | ✅ Full | ✅ View | ✅ View | ❌ |
| **Google Sheets** | ✅ All tabs | ✅ View (team tabs) | ✅ View (Pipeline Summary) | ❌ |
| **Apps Script** | ✅ Edit + deploy | ❌ | ❌ | ❌ |
| **Supabase Dashboard** | ✅ Full | ❌ | ❌ | ❌ |
| **Supabase Data (app)** | — | — | — | ✅ Read-only (confirmed) |
| **Figma Make App** | ✅ Admin | ✅ View | ✅ View | ✅ View (public pages) |
| **Gmail** | ✅ Full | ❌ | ❌ | ❌ |

---

## 🛡️ PROTECTED FIELDS

**These fields are NEVER overwritten by automation:**
- Name (all databases)
- Notes (all databases)
- Relationship Story (Organizations, Opportunities)
- All relation fields (manually set connections)
- Stage (Opportunities) — only humans move deals through the pipeline
- Contact details (email, phone, channel)
- Content Needs, Fulfillment Checklist (human checkpoints)

**Automation MAY write to:**
- Confidence % (number)
- Projected Value (number)
- Priority Rank (number)
- Sync Log entries (all fields)
- Activities (auto-created from Gmail, clearly tagged Source Tool = "Apps Script")

---

## 📋 DEPLOYMENT STEPS

### Prerequisites Completed ✅
1. Edge function routes added to `/supabase/functions/server/index.tsx`
2. 6 Apps Script files created in `/scripts/`
3. Supabase migration file created in `/supabase/migrations/`
4. Deployment checklist created: `/scripts/DEPLOYMENT_CHECKLIST.md`
5. README created: `/scripts/README.md`

### Next Steps for Monica 👉

#### 1. Create Notion Databases
- [ ] Organizations (with schema from deployment prompt)
- [ ] Contacts (with schema from deployment prompt)
- [ ] Opportunities (with schema from deployment prompt)
- [ ] Activities (with schema from deployment prompt)
- [ ] Sync Log (with schema from deployment prompt)
- [ ] Copy all 5 database IDs

#### 2. Run Supabase Migration
```bash
# From project root:
supabase db push

# Or manually execute:
# /supabase/migrations/20260314_create_ik26_tables.sql
```

#### 3. Setup Google Apps Script
- [ ] Open [script.google.com](https://script.google.com)
- [ ] Create "IK26 Ops Sync" project (or reuse "Istorya Sync Engine")
- [ ] Copy all 6 `.gs` files from `/scripts/` to Apps Script editor
- [ ] Add Script Properties with all database IDs and keys
- [ ] Run setup functions to create triggers:
  ```javascript
  setupFlowATrigger();
  setupFlowBTrigger();
  setupFlowCTrigger();
  setupFlowDTriggers();
  // Optional:
  setupFlowETrigger();
  setupFlowFTrigger();
  ```

#### 4. Create Google Sheet
- [ ] Create "IK26 Ops Mirror" spreadsheet
- [ ] Add tabs: Opportunities, Activities, sync_log, Pipeline Summary, Admin
- [ ] Share with team (view-only for most)
- [ ] Copy Sheet ID and add to Script Properties

#### 5. Test End-to-End
- [ ] Create test Opportunity in Notion
- [ ] Wait for Flow A sync (or run manually)
- [ ] Verify in Sheets
- [ ] Change Stage to "Confirmed"
- [ ] Wait for Flow C sync (or run manually)
- [ ] Verify in Supabase `ik26_sponsors` table
- [ ] Check Figma Make app renders sponsor

#### 6. Migrate Existing Data
- [ ] Export current Comms Tracker
- [ ] Map to Organizations, Contacts, Opportunities
- [ ] Import into new databases

---

## 📚 DOCUMENTATION

**All documentation is in `/scripts/`:**
- `DEPLOYMENT_CHECKLIST.md` — Step-by-step deployment guide with sign-off
- `README.md` — Comprehensive guide to all flows, configuration, debugging
- `apps-script-flow-*.gs` — 6 fully commented script files ready to copy

**Deployment prompt (original spec):**
- `/src/imports/IK26_Ops_Center_Deployment_Prompt.md`

---

## 🎯 SUCCESS CRITERIA

✅ **Integration is successful when:**
1. All 5 Notion databases created and configured
2. Supabase tables `ik26_sponsors` and `ik26_orgs` exist with RLS
3. All Apps Script triggers running (4 required, 2 optional)
4. End-to-end test passes:
   - Create Opportunity in Notion → syncs to Sheets → change Stage to Confirmed → syncs to Supabase → appears in app
5. Sync Log shows all successful syncs
6. Daily digest email received at monica.istorya@gmail.com
7. Team can edit Notion, view Sheets Pipeline Summary, and access app

---

## 🐛 TROUBLESHOOTING

**"Notion API error"**
→ Verify database IDs in Script Properties  
→ Share databases with Notion integration

**"Supabase error: permission denied"**
→ Use `SUPABASE_SERVICE_KEY`, not `SUPABASE_ANON_KEY`  
→ Verify RLS policies allow service_role writes

**"No data in Sheets"**
→ Check Apps Script execution logs for errors  
→ Verify Notion databases have data  
→ Run `syncNotionToSheets()` manually

**"Triggers not firing"**
→ Check Triggers panel in Apps Script  
→ Re-run setup functions to recreate triggers

---

## 📞 SUPPORT

**Owner:** Monica Blanco  
**Email:** monica.istorya@gmail.com / mb@tablante.com  
**Notion:** Take Home Studio / ISTORYA workspace  
**Apps Script:** IK26 Ops Sync  
**Supabase:** Istorya app  
**Figma Make:** IK26 App / AGENCY v1

---

## ✨ WHAT'S NEXT

**After deployment:**
1. Monitor Sync Log daily for first week
2. Train team on new workflow (Opportunities, Activities, Pipeline Board)
3. Share public Notion forms for partner/volunteer intake
4. Set up Pipeline Summary formulas in Sheets
5. Create KPI dashboard (total opps, confirmed value, conversion rate)

**Optional enhancements:**
- Flow E: Auto-create Activities from Gmail (if desired)
- Flow F: Calendar sync for milestones (if desired)
- Add logo fetching for sponsors (Clearbit API or manual upload)
- Create custom Notion views for different workstreams

---

**Deployment completed by:** Figma Make AI Assistant  
**Date:** March 14, 2026  
**Files created:** 10 (6 scripts + 3 docs + 1 migration)  
**Status:** ✅ Ready for deployment
