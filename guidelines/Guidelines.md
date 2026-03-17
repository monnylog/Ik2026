# IK26 — Figma Make AI Guidelines

## Project Context
This is the **Isang Kusina 2026** event operations dashboard, built by Istorya (Monica Blanco + Walbert Castillo). The event is a Filipino-American culinary collaboration in Las Vegas, NV on May 22, 2026. The app serves chefs, team members, and leadership with role-based access.

**Full project context:** See `IK26_AGENT.md` in the repo root for the complete development agent specification.

---

## General Guidelines

* Framework before execution — describe the structure before writing code
* Keep file sizes small; put helper functions and components in their own files
* Refactor as you go; avoid duplicating logic
* Never hardcode secrets; use `Deno.env.get()` in Edge Functions and `PropertiesService` in Apps Script
* All operations must be idempotent (safe to re-run without duplicating data)
* Never overwrite protected fields: Name, Notes, Relationship Story, Stage (Opportunities), relation fields, documentary_consent, private_topics
* Ask before irreversible actions (deleting data, dropping tables, removing triggers)

---

## Design System Guidelines

### Color Palette
* **Primary Gold:** `#C9A96E` — headings, accents, CTAs
* **Forest Green:** `#1A5C38` — secondary accents, success states
* **Warm Gold (lighter):** `#D4A843` — Finance/Money workstream
* **Steel Blue:** `#4A7FB5` — Creative/Content workstream
* **Sage Green:** `#7E9E78` — F&B/Kitchen workstream
* **Warm Terracotta:** `#CDA88A` — Research/Story workstream
* **Background:** Dark (near-black), not pure white
* **Text:** Off-white on dark backgrounds

### Typography
* **Headings:** Maragsa (imported via `src/app/lib/fonts.ts`)
* **Body:** Kantumruy Pro (imported via `src/app/lib/fonts.ts`)
* **Base font size:** 14px (0.875rem)
* **Date formats:** "Mar 17" or "May 22, 2026" — never ISO format in UI

### Layout Rules
* Use flexbox and grid by default; avoid absolute positioning unless necessary
* Mobile-first responsive design
* Bottom navigation on mobile (`mobile-bottom-nav.tsx`)
* Sidebar navigation on desktop (`sidebar-nav.tsx`)
* Maximum 4 items in the bottom toolbar
* All pages wrapped in `<PageWrapper>` component
* Cards use `rounded-xl` with `border border-gold/20` and `bg-gold/5` backgrounds
* Buttons use gold accent with `hover:opacity-80` transitions

### Components
* Use Radix UI primitives with custom Tailwind styling
* Use `motion` (Framer Motion v12) for all page transitions and micro-animations
* Use `lucide-react` for all icons
* Chips/badges always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

---

## Role-Based Access Rules

* `leadership` — Full access to all pages
* `team` — Access to operational pages; no Finance, Sponsors, Members, Notion Admin, Mission Control, System Audit, Content Studio
* `chef` — Access to personal pages only; no team management or financial data
* Always gate pages with role checks in `page-router.tsx`
* Never expose leadership data to chef-role users

---

## API & Data Rules

* Use `apiFetch` or `authApiFetch` from `src/app/lib/supabase.ts` for all API calls
* All Edge Function routes are prefixed with `/make-server-5ed426e6/`
* Always handle loading states with skeleton loaders from `skeleton-loaders.tsx`
* Always handle error states with toast notifications (Sonner)
* Never cross-contaminate IK26 data with other Monica projects (Monnylog, UNLV, Create Well)

---

## Agent Naming Convention

When adding new AI agents, name them using Filipino words that describe their function:

* Tulay (Bridge) — sponsorship follow-ups
* Bantay (Guard/Watcher) — data integrity
* Salo-Salo (Gathering) — chef care and onboarding
* Kuwento (Story) — narrative and content
* Damdam (To Feel/Sense) — emotional temperature
* Mata (Eye/To See) — production and media

New agents follow this pattern: one Filipino word, metaphorically descriptive.

