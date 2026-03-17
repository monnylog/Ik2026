# NOTION CONFIGURATION REFERENCE

**Quick reference for database IDs and mappings between Notion, Apps Script, and Figma Make app**

---

## 📋 CURRENT NOTION SYNC CONFIGURATION

**Source:** `/src/app/lib/notion-sync.ts`

### Existing Content Types (Already Configured)

| Content Type | Database ID | Label | isPageId | Notes |
|--------------|-------------|-------|----------|-------|
| `roster` | `924024e2b82048ed8d6923c2199abf2d` | 🍽️ Chefs, Menu & Beverage | ✅ true | Chef profiles, bios, cities |
| `courses` | `924024e2b82048ed8d6923c2199abf2d` | 🍽️ Chefs, Menu & Beverage (Courses view) | ✅ true | Course lineup, pairings |
| `team` | `ada2715ee86b4980a35d46450292b855` | 👥 Team Deploy | ✅ true | Team members, roles |
| `comms` | `320dc6047d2d80e0a635c01824b82ab2` | IK26 Comms Tracker | ❌ false | **Direct DB ID** — contacts, follow-ups |
| `milestones` | `b60f493a780e4c5ca053f14b3ca5ad23` | IK26 Milestones (inline DB) | ✅ true | Embedded in Ops Center page |
| `budget` | `964857d01c6647669a134a0375f6bcd2` | 💰 Money | ✅ true | Budget line items |
| `sponsors` | `320dc6047d2d80e0a635c01824b82ab2` | Sponsors (from Comms Tracker) | ❌ false | **Filtered from comms** — Communication Type: Sponsorship Outreach |
| `announcements` | `320dc6047d2d80e0a635c01824b82ab2` | IK26 Announcements | ✅ true | Team announcements |
| `schedule` | `89f4bb096f6e40229f7cd100cee489c7` | 📋 Event Day & FOH | ✅ true | Day-of schedule, timing |
| `decisions` | `dd700843bbe140ebbc43acb01b081dd6` | ⚠️ Risk Register & Decision Log | ✅ true | Open decisions, blockers |
| `warroom` | `c039a9bd04984885a1b96da9af7523dc` | 🔥 War Room | ✅ true | Critical alerts, escalations |

---

## 🆕 NEW CRM DATABASES (To Be Created)

**These are NEW databases for the IK26 Ops Center deployment:**

| Database Name | Type | Use In Apps Script | Figma Make Usage |
|---------------|------|-------------------|------------------|
| **Organizations** | Database | ✅ Flow A, C | Optional (if we add CRM view) |
| **Contacts** | Database | ✅ Flow A, E | Optional (if we add CRM view) |
| **Opportunities** | Database | ✅ Flow A, B, C, D | Optional (if we add Pipeline view) |
| **Activities** | Database | ✅ Flow A, E | Optional (if we add Activity feed) |
| **Sync Log** | Database | ✅ All flows (write-only) | Read-only (for debugging) |

**After creating these databases in Notion, copy their IDs here:**

```javascript
// Add to Apps Script Properties:
NOTION_ORGS_DB: ___________________________
NOTION_CONTACTS_DB: ___________________________
NOTION_OPPS_DB: ___________________________
NOTION_ACTIVITIES_DB: ___________________________
NOTION_SYNCLOG_DB: ___________________________
```

---

## 🔀 MAPPING: Apps Script ↔ Figma Make

### Current Mapping (Existing System)

| Apps Script Flow | Figma Make Content Type | Database Source |
|------------------|------------------------|-----------------|
| (none yet) | `roster` | 🍽️ Chefs, Menu & Beverage page |
| (none yet) | `courses` | 🍽️ Chefs, Menu & Beverage page |
| (none yet) | `team` | 👥 Team Deploy page |
| (none yet) | `comms` | IK26 Comms Tracker (direct DB) |
| (none yet) | `milestones` | IK26 Ops Center page (inline DB) |
| (none yet) | `budget` | 💰 Money page |
| **Flow C** → Supabase | `sponsors` | IK26 Comms Tracker (filtered) |
| (none yet) | `announcements` | IK26 Comms Tracker (filtered) |
| (none yet) | `schedule` | 📋 Event Day & FOH page |
| (none yet) | `decisions` | ⚠️ Risk Register page |
| (none yet) | `warroom` | 🔥 War Room page |

### New Mapping (CRM System)

| Apps Script Flow | Supabase Table | Figma Make Usage |
|------------------|----------------|------------------|
| **Flow A** | (none) | Notion → Sheets mirror only |
| **Flow B** | (none) | Sheets → Notion write-back only |
| **Flow C** | `ik26_sponsors` | ✅ GET /ik26/sponsors (public) |
| **Flow C** | `ik26_orgs` | ✅ GET /ik26/orgs (public) |
| **Flow D** | (none) | Email notifications only |
| **Flow E** | (none) | Gmail → Notion Activities |
| **Flow F** | (none) | Calendar ↔ Notion Milestones |

---

## 🔧 INTEGRATION POINTS

### 1. Apps Script → Notion (Read)
**Used by:** Flow A, C, D, E, F

```javascript
// Notion API Query
const url = `https://api.notion.com/v1/databases/${NOTION_OPPS_DB}/query`;
const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28'
};
```

### 2. Apps Script → Notion (Write)
**Used by:** Flow B, E, F, All flows (Sync Log)

```javascript
// Notion API Update Page
const url = `https://api.notion.com/v1/pages/${pageId}`;
const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Notion-Version': '2022-06-28'
};
// PATCH with properties object
```

### 3. Apps Script → Supabase (Write)
**Used by:** Flow C

```javascript
// Supabase Edge Function
const url = `${SUPABASE_URL}/functions/v1/make-server-5ed426e6/ik26/sponsors/upsert`;
const headers = {
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json'
};
// POST with { sponsors: [...] }
```

### 4. Figma Make → Supabase (Read)
**Used by:** Sponsors page, Orgs directory

```javascript
// Frontend fetch
const url = `${projectId}.supabase.co/functions/v1/make-server-5ed426e6/ik26/sponsors`;
const headers = {
  'Authorization': `Bearer ${publicAnonKey}`
};
// GET returns { sponsors: [...] }
```

---

## 📊 DATA FLOW DIAGRAM

```
NOTION (Source of Truth)
  │
  ├─ Organizations DB ────┐
  ├─ Contacts DB ─────────┤
  ├─ Opportunities DB ────┤─── Flow A (every 4h) ──→ GOOGLE SHEETS
  ├─ Activities DB ───────┘                              │
  │                                                       │
  │                                              Flow B (every 6h)
  │                                                       │
  │                                                       ↓
  │                                            (Computed fields only)
  │                                                       │
  │←──────────────────────────────────────────────────────┘
  │
  ├─ Opportunities DB ─── Flow C (every 4h) ──→ SUPABASE
  │  (Stage = Confirmed)                        ├─ ik26_sponsors
  └─ Organizations DB ─────────────────────────→└─ ik26_orgs
                                                         │
                                                         │
                                                         ↓
                                                  FIGMA MAKE APP
                                                  (Public read-only)
```

---

## 🔑 API KEYS & CREDENTIALS

### Notion Integration
**Name:** "Istorya Sync Engine" OR "Isang Kusina"  
**Connected to:**
- MUSEO Home
- IK26 Ops Center
- Leader Hub
- Projects
- Team Hub
- Invoice DB
- Brand Deals & Collabs

**Token location:**
- Apps Script Properties: `NOTION_API_KEY`
- Supabase Secret: `NOTION_API_KEY` (already configured)

### Supabase
**Project:** "Istorya app"  
**Keys:**
- `SUPABASE_URL`: https://[project-id].supabase.co
- `SUPABASE_ANON_KEY`: Public read-only key (for Figma Make app)
- `SUPABASE_SERVICE_KEY`: Full access key (for Apps Script Flow C)

### Google Workspace
**Account:** monica.istorya@gmail.com  
**Services:**
- Gmail API (for Flow E)
- Calendar API (for Flow F)
- Sheets API (auto-enabled)

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify:

- [ ] **Notion DBs created:**
  - [ ] Organizations database exists
  - [ ] Contacts database exists
  - [ ] Opportunities database exists
  - [ ] Activities database exists
  - [ ] Sync Log database exists

- [ ] **Notion DBs shared with integration:**
  - [ ] "Istorya Sync Engine" or "Isang Kusina" has access to all 5 DBs

- [ ] **Apps Script Properties set:**
  - [ ] All 5 new database IDs configured
  - [ ] NOTION_API_KEY matches integration token
  - [ ] SUPABASE_SERVICE_KEY is service_role (not anon)

- [ ] **Supabase tables created:**
  - [ ] `ik26_sponsors` table exists
  - [ ] `ik26_orgs` table exists
  - [ ] RLS policies enabled (anon = SELECT, service_role = ALL)

- [ ] **Edge function routes work:**
  - [ ] GET /ik26/sponsors returns data (with anon key)
  - [ ] POST /ik26/sponsors/upsert works (with service_role key)

- [ ] **Figma Make app updated:**
  - [ ] notion-sync.ts has correct config
  - [ ] App can fetch sponsors from Supabase

---

**Last updated:** March 14, 2026  
**Maintained by:** Monica Blanco (monica.istorya@gmail.com)
