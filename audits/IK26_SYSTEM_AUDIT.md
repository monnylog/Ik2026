# IK26 System Audit: Production and Event Planning Review

**Date:** March 17, 2026
**Scope:** Isang Kusina 2026 — operational systems, automation flows, agent ecosystem, and event production processes
**Based on:** IK26_AGENT.md, event-gaps-raci.md, chef-onboarding-enhancements.md, onboarding-flow.md, IK26_Ops_Center_Deployment_Prompt.md, DEPLOYMENT_CHECKLIST.md

---

## Executive Summary

The IK26 system architecture is well-designed. The four-layer model (Frontend, Backend, Automation, Source of Truth) creates a coherent data pipeline from Notion through Google Sheets and Supabase to the Figma Make app. The six Filipino-named agents (Tulay, Bantay, Salo-Salo, Kuwento, Damdam, Mata) distribute operational load intelligently across the system.

This audit identifies four areas where the system can be simplified and strengthened for production and event planning purposes, with specific, buildable recommendations for each.

---

## 1. Flow D: Daily Digest Is Informational, Not Actionable

### Current State

Flow D runs daily at 8:00 AM PT and sends an email to `monica.istorya@gmail.com` listing all Opportunities where `Next Action Date = today` and Stage is not Confirmed or Declined. It also fires on Stage changes to "Confirmed" or "In negotiation."

### The Gap

The digest presents a list of items that require action, but does not indicate what action to take or who should take it. The recipient must read the list, assess each item, decide on the next step, and then execute — all as separate cognitive steps.

### Recommendation

Restructure the digest so each item includes a pre-built action set. The Tulay agent already drafts follow-up emails; the digest should surface that capability directly.

**Proposed digest format per item:**
- Opportunity name and current Stage
- Days overdue or due today
- Suggested next action (Tulay can generate this from Gemini)
- Two or three numbered options: e.g., "1 — Send Tulay draft. 2 — Push deadline 7 days. 3 — Mark declined."

This shifts the digest from a status report to a decision interface. The recipient chooses a number; the system executes.

**Implementation:** Modify `apps-script-flow-d-daily-digest.gs`. Add a Gemini call per overdue opportunity to generate a one-line suggested action. Format the email with numbered reply options per item.

---

## 2. Agent Outputs Are Siloed — No Cross-Agent Synthesis

### Current State

The six agents write independently to `activity_feed` and `sync_log`. Salo-Salo tracks chef onboarding and travel. Damdam monitors wellness pulse checks. These are separate records with no connection between them.

### The Gap

If Damdam flags a chef's wellness score at 2 (distress range) and Salo-Salo flags the same chef's missing travel information, those two signals exist in separate records. The system does not connect them. A human must read both feeds and synthesize the picture.

### Recommendation

Extend Bantay's existing role as data integrity watchdog to include a weekly cross-agent synthesis pass. Bantay already reads the `sync_log` and `activity_feed`; it has the access needed.

**Proposed Bantay synthesis output (weekly, written to `activity_feed` with `type = "bantay_synthesis"`):**
- Per-chef summary: wellness score trend, onboarding step status, travel confirmation status, any open expense issues
- System-level summary: flows that failed or were skipped in the past 7 days, any Notion schema drift detected
- Items flagged for human review: anything Bantay cannot resolve automatically

**Implementation:** Add a `weeklyChefSynthesis()` function to the Bantay agent. Schedule it weekly (Sunday 9:00 PM PT, before the Monday work week). Add a filter to the `activity_feed` view in the IK26 App: "Requires Review" — surfaces only records where `metadata.requires_human = true`.

---

## 3. F&B / Events Director Role Is Vacant — Operational Risk

### Current State

Per `event-gaps-raci.md`: the F&B Lead / Events Director role has been vacant since Melvin's departure. Mariana is listed as the candidate. The resolution deadline was March 12. Beverage Director is also unassigned (Cy or Aria).

### The Gap

Without an Events Director, the BOH and FOH coordination for a 200+ guest event defaults to the co-owners. This includes kitchen prep oversight, FOH staffing (servers, runners, bar, expo), vendor coordination, and day-of logistics. The RACI does not currently define what the co-owners will *not* be responsible for on event day.

### Recommendation

Three actions, in order:

**1. Resolve the hire.** The decision on Mariana (and Cy or Aria for Beverage) is the single highest-risk open item in the entire system. No technical enhancement can compensate for a missing operational lead 66 days before the event.

**2. Generate an Events Director Playbook.** Compile the following existing documents into a single handoff package: the RACI, BOH/FOH staffing needs from `event-gaps-raci.md`, vendor intake forms from the `vendor_intake` Supabase table, and the chef prep request data from `chef_prep_requests`. The Mata agent is well-positioned to compile this from existing data. The playbook means the incoming director does not need to be briefed from scratch.

**3. Define co-owner scope on event day.** Add a "Day-Of Boundaries" section to the RACI that explicitly lists what Monica and Walbert are and are not responsible for during the event. This protects their capacity to hold the creative vision and guest experience.

---

## 4. Chef Onboarding: All Storytelling Questions Are Asked at Once

### Current State

The onboarding flow (per `onboarding-flow.md` and `chef-onboarding-enhancements.md`) includes six deep narrative questions in Step 3A, presented as a single form section. These questions ask chefs to reflect on heritage, identity, and culinary philosophy.

### The Gap

Six emotionally substantive questions in a single sitting is a significant ask for a busy chef completing a web form. The questions are designed to generate rich content for the Kuwento agent and the documentary, but front-loading them creates a potential barrier to onboarding completion.

### Recommendation

Ask two questions at initial onboarding. Drip the remaining four via the Kuwento agent over the weeks leading up to the event — one question per week, delivered through the in-app chat or a direct notification.

This approach has two benefits: it reduces the initial onboarding burden, and it creates a sustained narrative conversation with each chef rather than a one-time data collection event. Kuwento already has access to `chef_storytelling` and the `notifications` table; the infrastructure for this is in place.

**Implementation:** Update `ONBOARDING_STEPS` in `salo-salo-agent.ts` to include only two storytelling questions in the initial flow. Add a `storyDrip()` function to the Kuwento agent that queries `chef_storytelling` for incomplete responses and sends a weekly prompt via `notifications`.

---

## Integration Accuracy Notes

The following items in the current system documentation require verification before treating as active:

| Item | Status | Action Required |
|------|--------|-----------------|
| Discord webhook routes in `form-discord-routes.tsx` | Deprecated — Discord removed per `istorya-app-updates.md` | Do not add new Discord integrations; existing code is legacy |
| Instagram sync routes | Routes exist in edge function; table deployment unverified | Verify `ik26_instagram_*` tables exist in Supabase before use |
| Flow E (Gmail → Activities) | Marked optional in deployment checklist | Confirm Gmail API scope is enabled before activating trigger |
| Flow F (Calendar ↔ Milestones) | Marked optional in deployment checklist | Confirm `Calendar Event ID` property exists in Notion Milestones DB before activating |
| 5 Notion databases | Schema defined; creation pending | Per deployment checklist, databases have not yet been created |

---

## Priority Order

| # | Action | Effort | Owner |
|---|--------|--------|-------|
| 1 | Decide on F&B Director (Mariana) and Beverage Director (Cy or Aria) | 1 conversation | Monica + Walbert |
| 2 | Generate Events Director Playbook from existing system data | 1 build session | Mata agent |
| 3 | Add "Day-Of Boundaries" section to RACI | 30 min | Monica + Walbert |
| 4 | Restructure Flow D digest with numbered action options | 2–3 hours | Dev |
| 5 | Add `requires_human` filter to `activity_feed` in IK26 App | 1–2 hours | Dev |
| 6 | Add weekly synthesis function to Bantay | 4–6 hours | Dev |
| 7 | Drip storytelling questions via Kuwento | 2–3 hours | Dev |
| 8 | Verify and complete the 5 Notion database setup | Per deployment checklist | Monica |
