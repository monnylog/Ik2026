# IK26 System Audit: A Neurodivergent Leadership Lens

**Date:** March 17, 2026  
**Auditor:** IK26 Development Agent  
**Focus:** Executive function support, cognitive load reduction, and leadership capacity for Monica Blanco.

---

## Executive Summary

The IK26 system is structurally brilliant. The four-layer architecture (Frontend, Backend, Automation, Source of Truth) creates a robust data pipeline. The integration of AI agents (Tulay, Bantay, Salo-Salo, Kuwento, Damdam, Mata) to handle repetitive tasks is a masterclass in scaling capacity. 

However, when viewed through the lens of neurodivergent leadership—specifically the need for clear decision gates, binary choices, and protection of energy—the system currently demands too much active monitoring from Monica. The architecture is sound, but the *interface* between the system and the leader requires optimization.

This audit identifies three primary friction points and proposes actionable enhancements to shift the system from "data management" to "executive function support."

---

## 1. The "Notification Trap" vs. Decision Gates

### The Current State
Flow D (Daily Digest) sends a daily email at 8:00 AM PT with a list of overdue/due-today items. Flow E auto-creates activities from Gmail. The `pending_decisions` table in Supabase tracks open blockers.

### The Friction
For a neurodivergent leader managing multiple domains (Istorya, UNLV, Monnylog), a daily list of "things to do" is a cognitive load trap. It requires the leader to read the list, prioritize it, decide *how* to act, and then execute. This is exhausting.

### The Enhancement: Binary Decision Gates
Shift the system from presenting *information* to presenting *decisions*.

*   **Actionable Digest:** Modify Flow D so the daily digest doesn't just list overdue items, but presents them as binary choices. 
    *   *Instead of:* "Tock Sponsorship is overdue."
    *   *It should say:* "Tock Sponsorship is stalled. Reply 1 to have Tulay draft a follow-up. Reply 2 to push the deadline to next week. Reply 3 to drop."
*   **The "One Thing" Dashboard:** Update the Figma Make dashboard to feature a "Monny's Desk" view. This view should show exactly *one* critical decision at a time, pulled from `pending_decisions`. Once cleared, the next appears. This prevents visual overwhelm.

---

## 2. The "Context Switching" Tax in the Agent Ecosystem

### The Current State
The system has 6 distinct agents. Tulay handles sponsorships, Salo-Salo handles chef care, Damdam monitors wellness, etc. They write to the `activity_feed` and `sync_log`.

### The Friction
While the agents do the heavy lifting, Monica still has to synthesize their outputs. If Damdam flags a chef's wellness score, and Salo-Salo flags their missing flight info, Monica has to piece together that Chef X is overwhelmed *and* behind on logistics. Context switching between agent reports drains executive function.

### The Enhancement: The "Chief of Staff" Synthesis
Introduce a synthesis layer that aggregates agent insights into a single, unified narrative.

*   **The "Bantay" Upgrade:** Expand Bantay's role from just data integrity to "Chief of Staff." Bantay should read the outputs of all other agents and provide a weekly (or bi-weekly) synthesis report.
    *   *Example Output:* "Chef X's wellness score dropped to 2 (Damdam), and they haven't submitted their flight info (Salo-Salo). Recommendation: Have Walbert reach out personally; pause automated nudges."
*   **Unified Agent Feed:** In the IK26 App, ensure the `activity_feed` can be filtered by "Requires Human Intervention." Hide all the "Agent X successfully synced Y" noise from Monica's default view.

---

## 3. The "Empty Chair" Crisis: F&B / Events Director

### The Current State
The `event-gaps-raci.md` document highlights a critical red flag: **F&B Lead / Events Director is TBD (was due Mar 12).** Mariana is listed as a possibility. Beverage Director is also TBD (Cy or Aria).

### The Friction
A missing Events Director means the operational load of the kitchen, FOH staffing, and day-of logistics defaults upward to Monica and Walbert. This is a direct threat to Monica's capacity to hold the creative vision and manage her other commitments (UNLV, Monnylog).

### The Enhancement: Forced Delegation & System Scaffolding
The system cannot hire a person, but it can scaffold the role so it's easier to hand off.

*   **Immediate Decision Gate:** Force the decision on Mariana. Use the system to generate a clear, scoped "Ask" document for Mariana, outlining exactly what the role entails based on the existing RACI and BOH/FOH needs.
*   **The "Playbook" Generation:** Have the system (perhaps the Mata agent, repurposed temporarily) compile all existing kitchen prep, staffing needs, and vendor intake forms into a single "Events Director Playbook." When the person is hired, they don't need Monica to explain the job; they just read the playbook.
*   **Protecting the Founders:** Update the RACI to explicitly state what Monica and Walbert will *not* do on the day of the event.

---

## 4. Onboarding as Somatic Practice

### The Current State
The `chef-onboarding-enhancements.md` outlines a beautiful, warm onboarding flow. It asks deep, narrative questions ("What is a truth about your heritage...").

### The Friction
While the tone is excellent, asking chefs to answer 6 deep, emotional questions in a web form can be dysregulating or exhausting, especially for busy professionals. It might inadvertently create a barrier to entry.

### The Enhancement: Pacing and Modality
Align the onboarding with Monica's body-led, somatic approach.

*   **Voice Note Option:** Allow chefs to answer the storytelling questions via voice memo upload instead of typing. This is often more accessible and captures more authentic emotion.
*   **Drip the Questions:** Don't ask all 6 storytelling questions during the initial onboarding. Ask one or two. Let the `Kuwento` agent "drip" the remaining questions over the weeks leading up to the event via the in-app chat or SMS. This turns a "form" into a "conversation."

---

## Summary of Next Steps (Prioritized)

1.  **Resolve the F&B Director Gap:** This is the single biggest threat to the system. Decide on Mariana today.
2.  **Implement Binary Decision Gates:** Update Flow D to offer 1-2-3 choices rather than a list of tasks.
3.  **Create the "Monny's Desk" View:** Update the Figma Make frontend to show one critical decision at a time.
4.  **Upgrade Bantay:** Give Bantay the prompt to synthesize the other agents' outputs into a single "Chief of Staff" summary.
