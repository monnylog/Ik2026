# IK2026 - Isang Kusina 2026 Event Hub v3.5.0

## Project
Experiential dining event app. Ship deadline: May 22, 2026.

## Stack
Vite 6.3 + React + TypeScript + Tailwind + shadcn/ui + Supabase + Notion

## Commands
- `npm run dev` → localhost:5173
- `npm run build` → production build
- `npx vercel --prod` → deploy
- `git push origin1 staging` → push to GitHub (SSH)

## Connections
- Supabase project: fpylwzwphcwswxommmrj (creds in /utils/supabase/info.ts)
- Edge function: supabaseUrl/functions/v1/make-server-5ed426e6
- Vercel: monnymade/ik2026-staging
- GitHub: monnylog/Ik2026 (staging branch, SSH remote origin1)
- Mapbox: VITE_MAPBOX_TOKEN in .env
- Notion page IDs in src/app/lib/ik26-notion-config.ts

## Chef Roster (7 chefs)
1. Rachel (Course 1) 2. Aaron (Course 2) 3. Lord Maynard (Course 3)
4. Christina (Course 4) 5. Patrice (Course 5)
Istorya Roots: Justin Barnes (Hawaii), Dio Buan (Manila)

## Current Priority
- Notion ↔ Supabase 2-way sync (chef profiles, menu data, journey progress)
- Replace placeholder/false data with real content
- Code-split the 1.1MB main bundle
- Content updates for all 7 chef profiles

## Completed
- figma:asset imports resolved
- Package renamed from @figma/my-make-file to ik26-app
- Brand assets in public/assets/brand/
- SSH key set up for GitHub
- Deployed to Vercel (ik2026-staging.vercel.app)
- Story-sharing stub, workstream pages, dynamic date fix
- Justin & Dio restored as Istorya Roots

## Key Files
- src/app/lib/supabase.ts → Supabase client
- src/app/lib/notion-sync.ts → Notion sync logic + DEFAULT_NOTION_CONFIG
- src/app/lib/ik26-notion-config.ts → All Notion page IDs, form URLs, chef page IDs
- src/app/lib/notion-context.tsx → NotionProvider, data fetching
- src/app/components/notion-admin.tsx → Admin UI for Notion config
- utils/supabase/info.ts → Supabase project ID + anon key
