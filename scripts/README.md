# IK26 OPS CENTER — Google Apps Script Integration

**Notion → Google Sheets → Supabase sync flows**  
**Owner:** Monica Blanco (monica.istorya@gmail.com)  
**Project:** IK26 — Isang Kusina 2026

---

## 📂 Files Overview

| File | Description | Trigger | Status |
|------|-------------|---------|--------|
| `apps-script-flow-a-notion-to-sheets.gs` | Syncs Opportunities + Activities from Notion to Sheets | Every 4 hours | **Required** |
| `apps-script-flow-b-sheets-to-notion.gs` | Writes computed fields back to Notion (safe fields only) | Every 6 hours | **Required** |
| `apps-script-flow-c-notion-to-supabase.gs` | Upserts confirmed sponsors to Supabase tables | Every 4 hours | **Required** |
| `apps-script-flow-d-daily-digest.gs` | Sends daily action digest + stage change notifications | Daily 8AM PT + every 4h | **Required** |
| `apps-script-flow-e-gmail-to-activities.gs` | Auto-creates Activities from Gmail replies | Every 15 min | **Optional** |
| `apps-script-flow-f-calendar-milestones.gs` | Two-way sync between Google Calendar and Notion Milestones | Every 30 min | **Optional** |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment guide | N/A | Documentation |
| `README.md` | This file | N/A | Documentation |

---

## 🚀 Quick Start

### 1. Setup Apps Script Project

1. **Create new project** or open existing:
   - Go to [script.google.com](https://script.google.com)
   - Create "IK26 Ops Sync" (or reuse "Istorya Sync Engine")

2. **Copy all `.gs` files** from this directory to Apps Script editor

3. **Add Script Properties:**
   - Click ⚙️ Project Settings → Script Properties → Add
   - Add all required properties (see Configuration section below)

---

### 2. Configuration (Script Properties)

**Required for all flows:**
```
NOTION_API_KEY: [Your Notion integration token]
NOTION_ORGS_DB: [Organizations database ID]
NOTION_CONTACTS_DB: [Contacts database ID]
NOTION_OPPS_DB: [Opportunities database ID]
NOTION_ACTIVITIES_DB: [Activities database ID]
NOTION_SYNCLOG_DB: [Sync Log database ID]
SHEET_ID: [Google Sheets ID for mirror/backup]
SUPABASE_URL: [Your Supabase project URL]
SUPABASE_SERVICE_KEY: [Your Supabase service role key]
```

**Optional (for Flow F):**
```
NOTION_MILESTONES_DB: [Milestones database ID]
```

---

### 3. Install Triggers

After copying all scripts, run these setup functions **once** from Apps Script:

```javascript
// Flow A: Notion → Sheets (every 4 hours)
setupFlowATrigger();

// Flow B: Sheets → Notion (every 6 hours)
setupFlowBTrigger();

// Flow C: Notion → Supabase (every 4 hours)
setupFlowCTrigger();

// Flow D: Daily digest + notifications (daily 8AM PT + every 4h)
setupFlowDTriggers();

// Optional: Flow E (every 15 min)
setupFlowETrigger();

// Optional: Flow F (every 30 min)
setupFlowFTrigger();
```

**Verify triggers:**
- Click ⏰ Triggers (left sidebar)
- Confirm all functions are scheduled

---

## 📊 Flow Descriptions

### Flow A: Notion → Sheets Mirror
**Function:** `syncNotionToSheets()`  
**Schedule:** Every 4 hours  
**Purpose:** Syncs Opportunities and Activities from Notion to Google Sheets for analysis, reporting, and backup.

**What it does:**
- Queries Notion Opportunities and Activities databases
- Upserts rows into Sheets (matches by `notion_page_id`)
- Logs sync to Sheets `sync_log` tab and Notion Sync Log DB

**Sheet structure:**
- **Opportunities:** 20 columns (notion_page_id, name, org_name, stage, etc.)
- **Activities:** 9 columns (notion_page_id, name, date, type, etc.)

---

### Flow B: Sheets → Notion Write-back
**Function:** `syncSheetsToNotion()`  
**Schedule:** Every 6 hours (runs AFTER Flow A)  
**Purpose:** Allows team to edit computed fields in Sheets and sync back to Notion.

**What it does:**
- Reads `confidence_pct`, `projected_value`, `priority_rank` from Sheets
- Updates Notion Opportunities with these values
- **NEVER** touches protected fields (Name, Stage, Relations, Notes, etc.)

**Safe fields (can be written by automation):**
- Confidence %
- Projected Value
- Priority Rank

**Protected fields (NEVER written by automation):**
- Name, Notes, Relationship Story
- All relations
- Stage
- Content Needs, Fulfillment Checklist

---

### Flow C: Notion → Supabase
**Function:** `syncNotionToSupabase()`  
**Schedule:** Every 4 hours  
**Purpose:** Syncs CONFIRMED opportunities to Supabase for public-facing app.

**What it does:**
- Queries Opportunities where Stage = "Confirmed"
- Transforms to sponsor records
- Upserts to `ik26_sponsors` table in Supabase
- Fetches related Organizations and upserts to `ik26_orgs` table

**Supabase tables:**
- `ik26_sponsors`: Public read, service_role write
- `ik26_orgs`: Public read, service_role write

---

### Flow D: Daily Digest & Notifications
**Functions:** `sendDailyDigest()`, `checkStageChanges()`  
**Schedule:** Daily at 8:00 AM PT + every 4 hours  
**Purpose:** Sends action digest and stage change alerts to Monica.

**What it does:**
- **Daily digest (8AM PT):**
  - Queries Opportunities with Next Action Date = today
  - Queries overdue Opportunities
  - Sends formatted email to monica.istorya@gmail.com

- **Stage change alerts (every 4h):**
  - Compares current Notion data with last Sheet snapshot
  - Detects changes to "Confirmed" or "In negotiation"
  - Sends immediate email notification

**Email recipient:** monica.istorya@gmail.com

---

### Flow E: Gmail → Activities (Optional)
**Function:** `syncGmailToActivities()`  
**Schedule:** Every 15 minutes  
**Purpose:** Auto-creates Activity records when known contacts reply to emails.

**What it does:**
- Scans unread emails in monica.istorya@gmail.com
- Matches sender email against Contacts database
- Creates Activity in Notion with Type = "Email", Outcome = "Reply received"
- Skips unknown senders (logs as "Skipped" in Sync Log)

**Requirements:**
- Gmail API enabled in Apps Script Advanced Services
- Scope: `gmail.readonly`

---

### Flow F: Calendar ↔ Milestones (Optional)
**Function:** `syncCalendarMilestones()`  
**Schedule:** Every 30 minutes  
**Purpose:** Two-way sync between Google Calendar and Notion Milestones.

**What it does:**
- **Calendar → Notion:**
  - Finds events with `[IK26]` tag
  - Creates/updates Milestones in Notion
  
- **Notion → Calendar:**
  - Finds Milestones with dates
  - Creates/updates calendar events with `[IK26]` prefix

**Requirements:**
- Custom property in Milestones DB: `Calendar Event ID` (Rich Text)

---

## 🔒 Security & Access Control

### Who has access to what?

| Tool | Monica | Walbert | Team | Public |
|------|--------|---------|------|--------|
| Apps Script | Full (edit + deploy) | No access | No access | No access |
| Script Properties | Full | No access | No access | No access |
| Google Sheets | Full (all tabs) | View (team tabs only) | View (Pipeline Summary) | No access |
| Notion DBs | Full (edit) | Edit (Take Home Studio workspace) | Edit (Orgs, Contacts, Opps, Activities) | No access (forms only) |
| Supabase Dashboard | Full | No access | No access | No access |
| Supabase Data (via app) | — | — | — | Read-only (confirmed sponsors) |

### Protected Fields (Never Overwritten by Automation)

These fields are **ONLY** edited by humans in Notion:
- Name (all databases)
- Notes (all databases)
- Relationship Story (Organizations, Opportunities)
- All relation fields
- Stage (Opportunities) — only humans move deals through the pipeline
- Contact details (email, phone, channel)
- Content Needs, Fulfillment Checklist

### Safe Fields (May Be Written by Automation)

- Confidence % (number)
- Projected Value (number)
- Priority Rank (number)
- Sync Log entries (all fields)
- Activities (auto-created from Gmail, clearly tagged Source Tool = "Apps Script")

---

## 🐛 Debugging

### Check Execution Logs

1. **Apps Script Executions:**
   - Open Apps Script project
   - Click ⚡ Executions (left sidebar)
   - Review recent runs for errors

2. **Notion Sync Log:**
   - Open IK26 Ops Center in Notion
   - View Sync Log database
   - Filter by Result = "Failed"

3. **Google Sheets sync_log:**
   - Open IK26 Ops Mirror sheet
   - View `sync_log` tab
   - Check for error messages

### Common Issues

**"Notion API error: object is a database"**
- Cause: Using a page ID instead of database ID
- Fix: Verify database IDs in Script Properties

**"Supabase error: permission denied"**
- Cause: Using anon key instead of service_role key
- Fix: Verify `SUPABASE_SERVICE_KEY` in Script Properties

**"Gmail API not enabled"**
- Cause: Advanced Services not enabled for Flow E
- Fix: Apps Script → Services → Enable Gmail API

**"No data syncing from Notion"**
- Cause: Notion integration not connected to databases
- Fix: Share databases with "Istorya Sync Engine" or "Isang Kusina" integration

---

## 📈 Monitoring & Maintenance

### Weekly Tasks

- [ ] Review Apps Script execution logs for errors
- [ ] Check Notion Sync Log for failed syncs
- [ ] Verify Sheets data is up-to-date

### Monthly Tasks

- [ ] Audit Supabase `ik26_sponsors` table for accuracy
- [ ] Clean up old Sync Log entries (optional)
- [ ] Review trigger schedules (adjust if needed)

---

## 🔄 Making Changes

### To modify sync logic:

1. **Edit the `.gs` file** in Apps Script editor
2. **Save** (Ctrl+S or Cmd+S)
3. **Test manually** by running the function
4. **Deploy** — changes take effect immediately

### To change trigger schedules:

1. **Run the setup function again** (e.g., `setupFlowATrigger()`)
   - This deletes old trigger and creates new one
2. **Verify** in Triggers panel

### To add new fields:

1. **Add property to Notion database**
2. **Update column mapping** in Flow A
3. **Update extractors** if needed (e.g., `getNotionSelect()`)
4. **Test sync** manually before enabling trigger

---

## 📞 Support

**Owner:** Monica Blanco  
**Email:** monica.istorya@gmail.com  
**Notion:** Take Home Studio / ISTORYA workspace  
**Apps Script:** IK26 Ops Sync project  
**Supabase:** Istorya app project

---

## 📝 Change Log

| Date | Flow | Change | Author |
|------|------|--------|--------|
| 2026-03-14 | All | Initial deployment | Monica Blanco |
| | | | |
| | | | |

---

**Last updated:** March 14, 2026
