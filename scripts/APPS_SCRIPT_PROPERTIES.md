# IK26 Apps Script Properties — Deployment Reference
**Last updated:** March 17, 2026  
**Owner:** Monica Blanco (monica.istorya@gmail.com)

---

## Script Properties to Set

Go to **Apps Script → Project Settings → Script Properties** and add each key-value pair below.

### Notion Database IDs (Confirmed)

| Property Key | Value | Database Name |
|---|---|---|
| `NOTION_ORGS_DB` | `8e1e597e02954f44b2fced691cef163b` | 🏢 Organizations |
| `NOTION_CONTACTS_DB` | `c6aa43a896bc4e7b940ae616752d64bf` | 👤 Contacts |
| `NOTION_ACTIVITIES_DB` | `83bf686887be418eae9133ca3990061d` | 🗓️ Activities |
| `NOTION_OPPS_DB` | `a8db2a0f9402491f86ff5b875aa9d359` | 📊 Opportunities |
| `NOTION_SYNCLOG_DB` | `ff79dd821e714e6d9106ceab32c1eeca` | 🟡 Sync Log |
| `NOTION_MILESTONES_DB` | `8c2ba05f42f24bd0a10859e44f212e5c` | 🎯 IK26 Path |
| `NOTION_SOCIAL_DB` | `b5659ca6b94d4f26839bcb125c694393` | 📱 Social Content Tracker |

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
| Property Key | Value |
|---|---|
| `CALENDAR_ID` | `monica.istorya@gmail.com` |
| `MONITORED_EMAIL` | `monica.istorya@gmail.com` |

---

## Flow Trigger Schedule

| Flow | Function Name | Trigger Type | Frequency |
|---|---|---|---|
| Flow A | `syncNotionToSheets` | Time-driven | Every 4 hours |
| Flow B | `syncSheetsToNotion` | Time-driven | Every 6 hours |
| Flow C | `syncOpportunitiesToSupabase` | Time-driven | Every 4 hours |
| Flow D | `sendFollowUpReminders` | Time-driven | Daily at 9am PT |
| Flow E | `syncGmailToActivities` | Time-driven | Every 1 hour |
| Flow F | `syncCalendarMilestones` | Time-driven | Every 30 minutes |

---

## Deployment Steps

1. Open [Google Apps Script](https://script.google.com)
2. Open or create project "IK26 Ops Sync"
3. Copy all flow files from `/scripts/` into the project
4. Go to **Project Settings → Script Properties** and add all keys above
5. Run `installAllTriggers()` once to set up all time-driven triggers
6. Verify in **Triggers** panel that all 6 flows are scheduled
7. Run each flow manually once to confirm no errors
8. Check the Notion Sync Log database for success entries

---

## Verification Checklist

- [ ] All 7 Notion DB IDs added to Script Properties
- [ ] NOTION_API_KEY set (test: run any flow and check Sync Log)
- [ ] SUPABASE_URL and SUPABASE_SERVICE_KEY set
- [ ] `installAllTriggers()` run successfully
- [ ] Flow E (Gmail) tested: send a test email from a known contact
- [ ] Flow F (Calendar) tested: create a `[IK26]` event in Google Calendar
- [ ] Sync Log shows "Success" entries for all flows
