# IK26 Apps Script Properties — Deployment Reference
**Last updated:** March 17, 2026  
**Owner:** Monica Blanco (monica.istorya@gmail.com)  
**Scope:** Isang Kusina 2026 ONLY. These flows read and write exclusively to IK26 databases. No personal, Monnylog, Mbody, Create Well, or UNLV data is touched.

---

## Script Properties to Set

Go to **Apps Script → Project Settings → Script Properties** and add each key-value pair below.

### Notion Database IDs (Confirmed — IK26 Only)

| Property Key | Value | Database Name |
|---|---|---|
| `NOTION_ORGS_DB` | `8e1e597e02954f44b2fced691cef163b` | 🏢 Organizations (IK26 CRM) |
| `NOTION_CONTACTS_DB` | `c6aa43a896bc4e7b940ae616752d64bf` | 👤 Contacts (IK26 CRM) |
| `NOTION_ACTIVITIES_DB` | `83bf686887be418eae9133ca3990061d` | 🗓️ Activities (IK26 CRM) |
| `NOTION_OPPS_DB` | `a8db2a0f9402491f86ff5b875aa9d359` | 📊 Opportunities (IK26 CRM) |
| `NOTION_SYNCLOG_DB` | `ff79dd821e714e6d9106ceab32c1eeca` | 🟡 Sync Log (IK26 only) |
| `NOTION_MILESTONES_DB` | `8c2ba05f42f24bd0a10859e44f212e5c` | 🎯 IK26 Path |
| `NOTION_SOCIAL_DB` | `b5659ca6b94d4f26839bcb125c694393` | 📱 Social Content Tracker (IK26) |

### Notion API
| Property Key | Value |
|---|---|
| `NOTION_API_KEY` | [From Notion integration "Istorya Sync Engine" — Settings → Connections → Integrations] |

### Supabase
| Property Key | Value |
|---|---|
| `SUPABASE_URL` | `https://fpylwzwphcwswxommmrj.supabase.co` |
| `SUPABASE_SERVICE_KEY` | [From Supabase → Project Settings → API → service_role key] |

### Google
| Property Key | Value | Notes |
|---|---|---|
| `CALENDAR_ID` | `monica.istorya@gmail.com` | Flow F only reads events tagged `[IK26]` |
| `MONITORED_EMAIL` | `monica.istorya@gmail.com` | Flow E only reads emails labeled `IK26` |

---

## Flow Trigger Schedule

| Flow | Function Name | Trigger Type | Frequency | Scope |
|---|---|---|---|---|
| Flow A | `syncNotionToSheets` | Time-driven | Every 4 hours | IK26 Opportunities → Sheets |
| Flow B | `syncSheetsToNotion` | Time-driven | Every 6 hours | Sheets → IK26 Opportunities |
| Flow C | `syncOpportunitiesToSupabase` | Time-driven | Every 4 hours | IK26 Opportunities → Supabase |
| Flow D | `sendFollowUpReminders` | Time-driven | Daily at 9am PT | IK26 contacts with overdue follow-ups |
| Flow E | `syncGmailToActivities` | Time-driven | Every 1 hour | Gmail label:IK26 only |
| Flow F | `syncCalendarMilestones` | Time-driven | Every 30 minutes | Calendar events tagged [IK26] only |

---

## Gmail Scope Setup (Required Before Flow E)

Flow E reads ONLY emails with the Gmail label `IK26`. Before enabling Flow E, create this Gmail filter:

1. In Gmail, go to **Settings → Filters and Blocked Addresses → Create a new filter**
2. In the **From** field, add the email addresses of your known IK26 contacts (chefs, sponsors, venue, vendors)
3. Click **Create filter**, then check **Apply the label: IK26**
4. Optionally check **Also apply filter to matching conversations** to backfill

This ensures the script never reads personal emails, UNLV emails, or anything outside IK26.

---

## Calendar Scope Setup (Flow F)

Flow F reads ONLY calendar events whose title contains `[IK26]`. No other events are read or modified.

To add an event to the sync: prefix its title with `[IK26]`, e.g., `[IK26] Chef confirmation call — Rachel Barril`.

---

## Deployment Steps

1. Open [Google Apps Script](https://script.google.com)
2. Open or create project "IK26 Ops Sync"
3. Copy all flow files from `/scripts/` into the project
4. Go to **Project Settings → Script Properties** and add all keys above
5. Set up the Gmail `IK26` label filter (see Gmail Scope Setup above)
6. Run `installAllTriggers()` once to set up all time-driven triggers
7. Verify in **Triggers** panel that all 6 flows are scheduled
8. Run each flow manually once to confirm no errors
9. Check the Notion Sync Log database for success entries

---

## Verification Checklist

- [ ] All 7 Notion DB IDs added to Script Properties
- [ ] NOTION_API_KEY set (test: run any flow and check Sync Log)
- [ ] SUPABASE_URL and SUPABASE_SERVICE_KEY set
- [ ] Gmail `IK26` label created and filter applied to IK26 contacts
- [ ] `installAllTriggers()` run successfully
- [ ] Flow E (Gmail) tested: label a test email `IK26` and confirm Activity appears in Notion
- [ ] Flow F (Calendar) tested: create a `[IK26]` event in Google Calendar and confirm it syncs
- [ ] Sync Log shows "Success" entries for all flows
- [ ] Confirmed: no personal/Monnylog/UNLV data appears in any IK26 Notion database
