
# IK26 OPS CENTER — FULL DEPLOYMENT PROMPT
# Source of Truth: Notion → Integrations → Front End
# Owner & sole backend admin: Monica Blanco (mb@tablante.com / monica.istorya@gmail.com)
# Date: March 14, 2026 | Event: Isang Kusina 2026 — May 22, 2026

---

## 1. ENVIRONMENT & ACCOUNTS

### Google Workspace (monica.istorya@gmail.com)
- Gmail: team comms, sponsor outreach, partner replies, vendor coordination
- Google Calendar: IK26 milestones, chef calls, venue walkthroughs, deadlines
- Google Drive: shared decks, contracts, creative briefs, media kits
- Google Sheets: financial projections, comp calculator, sponsor tracking mirror, sync logs
- Google Apps Script: "Istorya Sync Engine" project (ID: 1XylnFtLQqakJH3wmnKLrWUK1WpINihuCp3U4RoHAmQdGpGgUmPVRBOb0)
  - Existing triggers: 6 running (syncFigmaToNotion, etc.)
  - Existing script properties: NOTION_API_KEY, NOTION_LEADS_DB (2df36223d6d64f5385a4f22571c135df), NOTION_INVOICES_DB (323dc6047d2d80a490bdf69032195513), FIGMA_FILE_KEY (matches AGENCY v1), FIGMA_TOKEN (needs personal access token)

### Notion (Take Home Studio / ISTORYA workspace)
- Take Home Studio Home: https://www.notion.so/MUSEO-Home-ba12b036a43749bab395d644b9409bf3
- IK26 Ops Center: https://www.notion.so/b60f493a780e4c5ca053f14b3ca5ad23?v=31edc6047d2d80fcab76000c628f8aae
- Integration: "Istorya Sync Engine" (connected to Leader Hub, Projects, Team Hub, Invoice DB, Brand Deals & Collabs)
- Integration: "Isang Kusina" (connected to IK26 databases under ISTORYA teamspace)

### Supabase
- Project: "Istorya app"
- Edge function: make-server-5ed426e6
- Secrets configured: NOTION_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
- Tables: projects, team_members, sync_log (+ IK26 tables as needed)
- RLS: service_role = full write; anon = read-only
- 8 edge function routes: /ik26-path and variants for roster, courses, team, comms, milestones, budget, sponsors, announcements, schedule, decisions

### Figma Make (IK26 App / AGENCY v1)
- App preview: connected to Supabase edge function
- Notion Admin panel: Settings tab with "Auto-Configure All" for 11 content types
- All pages are read-only in-app; editing happens in Notion only
- Version history: v236–v286+ (backend, UI, Notion sync, QuickBooks links)

### QuickBooks
- Istorya LLC account
- Receipt forwarding: istorya_llc+expenses@assist.intuit.com

---

## 2. NOTION DATABASE SCHEMA (5 databases under IK26 Ops Center)

### DB 1: Organizations
| Property | Type | Notes |
|----------|------|-------|
| Name | title | Org name (Tock, Resorts World, PAL, etc.) |
| Type | select | Sponsor, Media, Community Org, Vendor, Partner, Venue, Other |
| Priority | select | A, B, C |
| Region / Market | select | Las Vegas, National, Philippines, Other |
| IK Chapter | select | Origins, Year 2, Year 3 (Fil-Am), Residency |
| Partner Tier | select | Community Ally, Cultural Partner, Anchor Sponsor, In-Kind Supporter, Media Partner |
| In-Kind vs Cash | select | Cash, In-Kind, Both |
| Community Impact | multi_select | Education, Heritage, Mutual Aid, Youth, Arts, Food Access |
| Website | url | |
| Notes | rich_text | |
| Relationship Story | rich_text | Why this partner matters to IK/Istorya narrative |
| Contacts | relation → Contacts | |
| Opportunities | relation → Opportunities | |

### DB 2: Contacts
| Property | Type | Notes |
|----------|------|-------|
| Name | title | Full name |
| Organization | relation → Organizations | |
| Role / Title | rich_text | |
| Email | email | |
| Phone | phone_number | |
| Channel | select | Email, SMS, IG, WhatsApp, In-person, Slack, Other |
| Notes | rich_text | |
| Opportunities | relation → Opportunities | |
| Activities | relation → Activities | |

### DB 3: Opportunities
| Property | Type | Notes |
|----------|------|-------|
| Name | title | Outcome-oriented label (e.g., "Tock x IK26 Sponsorship") |
| Organization | relation → Organizations | |
| Primary Contact | relation → Contacts | |
| Type | select | Sponsorship, Partnership, Media/PR, Community/Cultural, Vendor, Internal |
| Stage | select | New lead, Drafting outreach, Outreach sent, Waiting on reply, Call booked, In negotiation, Confirmed, Declined / Closed |
| Potential Value | number | Currency (USD) |
| Expected Close Date | date | |
| Confidence % | number | 0–100; backend can write this |
| Projected Value | number | Backend-computed; safe for script write-back |
| Priority Rank | number | Backend-computed; safe for script write-back |
| Next Action | rich_text | |
| Next Action Date | date | |
| Source | select | Warm intro, Cold outreach, Referral, Returning partner, Other |
| IK Chapter | select | Origins, Year 2, Year 3 (Fil-Am), Residency |
| Community Impact Type | multi_select | Education, Heritage, Mutual Aid, Youth, Arts, Food Access |
| Partner Tier | select | Community Ally, Cultural Partner, Anchor Sponsor, In-Kind Supporter, Media Partner |
| In-Kind vs Cash | select | Cash, In-Kind, Both |
| Relationship Story | rich_text | PROTECTED — never overwritten by automation |
| Content Needs | multi_select | Reel, Carousel, Photo set, PR release, Menu note, Signage |
| Fulfillment Checklist | multi_select | Logo on menu, Opening remarks, Tagged on IG, Deliverable sent, Payment received |
| Visibility Score | select | Low, Medium, High |
| Program Segment | relation → (future Run of Show DB) | Optional |
| Content Assets | relation → (Posts DB) | Optional |
| Activities | relation → Activities | |

### DB 4: Activities
| Property | Type | Notes |
|----------|------|-------|
| Name | title | Short description ("Email re: benefits deck") |
| Date | date | |
| Type | select | Email, Call, Meeting, DM, In-person, Internal note, Other |
| Opportunity | relation → Opportunities | |
| Contact | relation → Contacts | |
| Outcome | select | Sent, Reply received, Follow-up needed, Completed, No response |
| Notes | rich_text | |
| Next Follow-up Date | date | |

### DB 5: Sync Log (read-only for team)
| Property | Type | Notes |
|----------|------|-------|
| Name | title | Auto-generated: "{action} — {db} — {timestamp}" |
| Timestamp | date | |
| Action | select | Create, Update, Write-back, Upsert to Supabase, Notification sent, Error |
| Database | select | Organizations, Contacts, Opportunities, Activities |
| Record ID | rich_text | Notion page ID |
| Source Tool | select | Apps Script, Make, Notion Form, Manual |
| Result | select | Success, Failed, Skipped |
| Details | rich_text | Error message or summary |

---

## 3. NOTION VIEWS (on IK26 Ops Center page)

### Opportunities views:
- "Pipeline Board" — Board grouped by Stage
- "This Week Actions" — Table filtered: Next Action Date is within 7 days
- "High-Value Targets" — Table filtered: Potential Value > threshold AND Stage not in (Confirmed, Declined)
- "Media / PR" — Table filtered: Type = Media/PR
- "New Intake (Last 7 Days)" — Table filtered: Created time is within 7 days

### Activities views:
- "Recent Activity" — Table sorted by Date desc, limit 20
- "Today's Follow-ups" — Table filtered: Next Follow-up Date = today

### Sync Log view:
- "Recent Syncs" — Table sorted by Timestamp desc, limit 10, read-only for team

---

## 4. NOTION FORMS

### Form 1: Partner / Sponsor Interest
- Target DB: Opportunities (Stage auto-set to "New lead")
- Also creates: Contact record if email doesn't exist in Contacts
- Fields exposed: Organization name, Contact name, Email, Phone, Type (Sponsorship / Partnership / Media / Community / Other), How did you hear about IK?, Notes
- URL: public, shareable

### Form 2: Volunteer / Collaborator Interest
- Target DB: Contacts
- Fields exposed: Name, Email, Phone, Role interest, Availability, Notes
- URL: public, shareable

### Form 3: Internal Team Log (Activity)
- Target DB: Activities
- Fields exposed: Description, Date, Type, Opportunity (relation picker), Contact (relation picker), Outcome, Notes
- URL: internal, team only

---

## 5. GOOGLE APPS SCRIPT FLOWS (project: "Istorya Sync Engine" or new "IK26 Ops Sync")

### Credentials (Script Properties):
- NOTION_API_KEY: Istorya Sync Engine / Isang Kusina integration token
- NOTION_ORGS_DB: {Organizations database ID}
- NOTION_CONTACTS_DB: {Contacts database ID}
- NOTION_OPPS_DB: {Opportunities database ID}
- NOTION_ACTIVITIES_DB: {Activities database ID}
- NOTION_SYNCLOG_DB: {Sync Log database ID}
- SUPABASE_URL: {existing}
- SUPABASE_SERVICE_KEY: {existing}
- SHEET_ID: {IK26 Ops Mirror spreadsheet ID}

### Flow A — Notion → Sheets Mirror (timed trigger: every 4 hours)
1. Query Opportunities and Activities from Notion API (paginated, filter by last_edited_time > last sync)
2. Upsert rows into Sheets tabs "Opportunities" and "Activities" matched by Notion page ID (column A)
3. Column mapping:

Opportunities Sheet columns:
A: notion_page_id | B: name | C: org_name | D: primary_contact | E: type | F: stage | G: potential_value | H: expected_close | I: confidence_pct | J: projected_value | K: priority_rank | L: next_action | M: next_action_date | N: source | O: ik_chapter | P: partner_tier | Q: in_kind_cash | R: visibility_score | S: fulfillment_status | T: last_synced

Activities Sheet columns:
A: notion_page_id | B: name | C: date | D: type | E: opp_name | F: contact_name | G: outcome | H: next_followup | I: last_synced

4. Log each sync run to Sync Log DB in Notion and "sync_log" tab in Sheets

### Flow B — Sheets → Notion Write-back (timed trigger: every 6 hours, after Flow A)
1. Read columns I (confidence_pct), J (projected_value), K (priority_rank) from Opportunities sheet
2. For each row where these values differ from Notion, PATCH the Notion page
3. NEVER write to: Name, Notes, Relationship Story, relations, Stage, or any rich_text field
4. Log each write-back to Sync Log

### Flow C — Notion → Supabase Upsert (timed trigger: every 4 hours OR event-driven via Make)
1. Query Opportunities where Stage = "Confirmed"
2. Upsert into Supabase table "ik26_sponsors": id (notion_page_id), org_name, type, partner_tier, logo_url, story_blurb, visibility_score
3. Query related Organizations for confirmed opps and upsert into "ik26_orgs"
4. Supabase RLS: service_role key only; anon/public = SELECT only
5. Log to Sync Log

### Flow D — Notifications (timed trigger: daily 8:00 AM PT)
1. Query Opportunities where Next Action Date = today AND Stage not in (Confirmed, Declined)
2. Send single digest email to monica.istorya@gmail.com with list of overdue/due-today items
3. On Stage change to "Confirmed" or "In negotiation" (detected by comparing current vs last sync snapshot): send immediate email to monica.istorya@gmail.com
4. Optional: create Google Calendar event for "Confirmed" deals (calendar: monica.istorya@gmail.com)
5. Log to Sync Log

### Flow E — Gmail → Activities (optional enhancement)
1. Watch monica.istorya@gmail.com for threads matching known Contact emails (from Contacts DB)
2. When a reply is detected from a known contact, auto-create an Activity in Notion: Type = "Email", Outcome = "Reply received", Date = email date, Contact = matched contact, Opportunity = matched opportunity (by org)
3. NEVER auto-create if no match; log as "Skipped" in Sync Log
4. Requires Gmail API scope: gmail.readonly

### Flow F — Google Calendar ↔ Notion Milestones (optional enhancement)
1. Sync IK26-tagged calendar events from monica.istorya@gmail.com to a Notion "Milestones" database
2. Two-way: if a milestone is created in Notion with a date, create a calendar event; if a calendar event is created with "[IK26]" prefix, create a Notion milestone
3. Match by event ID stored as a Notion property

---

## 6. SUPABASE SCHEMA (IK26-specific tables)

### Table: ik26_sponsors
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Notion page ID |
| org_name | text | |
| type | text | Sponsorship, Partnership, etc. |
| partner_tier | text | |
| logo_url | text | nullable |
| story_blurb | text | From Relationship Story |
| visibility_score | text | Low/Medium/High |
| confirmed_date | timestamptz | |
| synced_at | timestamptz | |

### Table: ik26_orgs
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | Notion page ID |
| name | text | |
| type | text | |
| region | text | |
| ik_chapter | text | |
| community_impact | text[] | Array |
| synced_at | timestamptz | |

### RLS Policies:
- anon: SELECT only on ik26_sponsors and ik26_orgs
- service_role: ALL on everything
- No other roles; no team member has direct Supabase access

---

## 7. FIGMA MAKE (IK26 APP) INTEGRATION

- Edge function routes already handle 10+ content types including comms, sponsors, milestones, budget, schedule, decisions
- All pages in the app are READ-ONLY; no editing from the app UI
- Notion Admin → Settings → "Auto-Configure All" connects to the 11 content types
- When Supabase ik26_sponsors table updates (via Flow C), the app reflects confirmed sponsors automatically
- Monica is the only person who accesses the Supabase dashboard, deploys edge functions, or changes secrets
- FIGMA_TOKEN in Apps Script still needs a personal access token from Figma Settings → Security

---

## 8. ACCESS CONTROL MATRIX

| Tool | Monica | Walbert | Team | Public |
|------|--------|---------|------|--------|
| Notion (edit DBs) | Full | Full (shared Istorya space) | Edit: Orgs, Contacts, Opps, Activities; View: Sync Log | No access |
| Notion Forms | Admin | — | Can submit internal forms | Can submit public forms |
| Google Sheets (IK26 Mirror) | Full (all tabs) | View team-visible tabs | View: Pipeline Summary, Rate Card; No access: Admin, Comp, Sync Log | No access |
| Google Apps Script | Full | No access | No access | No access |
| Supabase Dashboard | Full | No access | No access | No access |
| Supabase (via app) | — | — | — | Read-only (confirmed data) |
| Figma Make App | Admin + deploy | View app | View app | View app (public pages) |
| QuickBooks | Full | No access | No access | No access |
| Google Calendar (IK26) | Full | View/edit shared IK26 calendar | View shared IK26 calendar | No access |
| Gmail (monica.istorya) | Full | No access | No access | No access |

---

## 9. PROTECTED FIELDS (never overwritten by any automation)

These fields are ONLY edited by humans in Notion:
- Name (all DBs)
- Notes (all DBs)
- Relationship Story (Organizations, Opportunities)
- All relation fields (manually set connections)
- Stage (Opportunities) — only humans move deals through the pipeline
- Contact details (email, phone, channel)
- Content Needs, Fulfillment Checklist (human checkpoints)

Automation MAY write to:
- Confidence % (number)
- Projected Value (number)
- Priority Rank (number)
- Sync Log entries (all fields)
- Activities (auto-created from Gmail, clearly tagged Source Tool = "Apps Script")

---

## 10. DEPLOYMENT SEQUENCE

1. **Create 5 Notion databases** under IK26 Ops Center with exact schema above; migrate existing Comms Tracker rows into Organizations, Contacts, and Opportunities
2. **Set Notion permissions**: team edit on DBs 1–4, team view-only on DB 5 (Sync Log)
3. **Create Notion Forms** (Partner Interest, Volunteer Interest, Internal Activity Log)
4. **Create Google Sheet** "IK26 Ops Mirror" with tabs: Opportunities, Activities, sync_log, Pipeline Summary (team-visible), Admin (hidden/protected)
5. **Add/update Apps Script properties** with all 5 Notion DB IDs and Sheet ID
6. **Write and test Flow A** (Notion → Sheets) first; confirm data appears correctly
7. **Write and test Flow B** (Sheets → Notion write-back) with only safe fields
8. **Write and test Flow C** (Notion → Supabase) for confirmed sponsors
9. **Write and test Flow D** (daily digest email)
10. **Optional: Write Flow E** (Gmail → Activities) and **Flow F** (Calendar ↔ Milestones)
11. **Create Supabase tables** ik26_sponsors and ik26_orgs with RLS policies
12. **Verify Figma Make app** reflects confirmed sponsors from Supabase
13. **Generate Figma personal access token** and update FIGMA_TOKEN in Script Properties
14. **Set all timed triggers**: Flow A every 4h, Flow B every 6h, Flow C every 4h, Flow D daily 8AM PT
15. **Run full end-to-end test**: create a test Opportunity in Notion → confirm it syncs to Sheets → change Stage to Confirmed → confirm it upserts to Supabase → confirm it appears in Figma Make app → confirm Sync Log records all steps

---

## 11. CONSTRAINTS & PRINCIPLES

- Notion is the only place humans edit records; all other tools create or mirror, never overwrite core fields
- If Supabase is removed, Notion + Sheets must still function independently
- All automations are idempotent: re-running never duplicates records (match by Notion page ID)
- Every automation logs to Sync Log (Notion DB) and sync_log (Sheets tab)
- Fewer integrations > more integrations; skip any flow that isn't critical
- Scripts prioritize clarity and maintainability over cleverness
- Monica (mb@tablante.com / monica.istorya@gmail.com) is the sole backend admin; no team member needs access to Apps Script, Supabase, or admin Sheets tabs
