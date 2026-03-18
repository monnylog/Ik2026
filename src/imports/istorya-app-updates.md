Two major updates. Supabase (Istorya app project) is now connected.

**PART 1: Consolidate to Single In-App Chat (Supabase Realtime)**

- Remove the "Connect Elsewhere" sidebar with Discord/WhatsApp links entirely. No more comms fragmentation.
- The in-app Supabase Realtime chat is THE single communication channel for this event.
- Migrate the current localStorage-based chat to use Supabase Realtime for live syncing across all users/devices. Create a `ik26_messages` table and `ik26_channels` table in Supabase.
- Keep the 4 channels: #general, #kitchen-prep, #logistics, #introductions
- Keep the 12 Istorya avatar system, avatar + first name display
- The ONLY external fallback should be the SMS emergency link: "Need something urgently? Text Monny & Walbert directly" with the sms:+16166357057,+18478903063 link. Frame it as emergency-only, not a chat alternative.
- Namespace all Supabase tables with `ik26_` prefix so the Istorya app and this dashboard can share the same Supabase project without conflicts.

**PART 2: Subtle Gamified Engagement Features**

Build these as a warm, discovery-driven layer across the app that all roles (chef, team, owner) experience equally. None of these should feel competitive or ranked — they're connective, not performative.

1. **"Did You Know?" — Istorya Fun Facts Randomizer**
   - A small card that appears on the dashboard (and optionally in the chat sidebar) showing a rotating Filipino food/history fact from Istorya's research
   - Refreshes each time the user visits or can be manually shuffled with a "Tell me another" button
   - Examples: facts about turmeric in Sulu cuisine, the Boxer Codex, galleon trade routes, Binondo as the world's oldest Chinatown, etc.
   - Use the X constellation motif as a visual element — like "connecting the stars" of Filipino history
   - Tone: warm, conversational, surprising — "Here's something beautiful...", "A piece of history for today..."

2. **Daily Prompt — "What's Your Istorya?"**
   - One prompt per day, visible to all users. Answers are shared anonymously (avatar + first name only)
   - Prompts rotate from a curated list tied to Filipino food, memory, identity, and community:
     - "What's a dish that reminds you of home?"
     - "What's your earliest food memory?"
     - "If you could cook for anyone in history, who would it be?"
     - "What ingredient do you think is underrated?"
     - "Describe your favorite meal in 3 words."
     - "What does 'kusina' (kitchen) mean to you?"
     - "What's a food tradition you want to preserve?"
   - **Answers disappear after 24 hours** — creating urgency to participate and a "you had to be there" feeling. Show a gentle countdown: "This prompt fades in 14 hours"
   - After the event, compile all prompts + responses into a beautiful "Our Istoryas" recap page that unlocks as a memento
   - Store in Supabase: `ik26_daily_prompts` and `ik26_prompt_responses` tables

3. **Trivia Drops — "X Marks the Spot"**
   - Periodic trivia questions that drop into the #general chat or appear as a notification
   - Multiple choice, fun and educational (not quiz-show pressure)
   - After everyone answers (or after a timer), the correct answer is revealed with a mini explanation
   - No scoring, no leaderboard — just collective learning. The reveal says something like "Together we discovered..." or "Now we all know..."
   - Maybe 1-2 per day during the event lead-up
   - Store in `ik26_trivia` table

4. **"Shared Kitchen" Countdown**
   - A beautiful countdown to the event on the dashboard with milestones
   - As milestones hit (e.g., 7 days out, 3 days, 1 day), unlock a new fun fact, a chef spotlight, or a behind-the-scenes photo
   - Feels like an advent calendar of anticipation
   - "6 days until we cook together" with warm language

All gamified features should:
- Use the Istorya brand palette and Maragsa/Kantumruy Pro fonts
- Feel organic, not corporate or Silicon Valley gamification
- Never create hierarchy (no points, no rankings, no "top contributor")
- Celebrate collective participation: "12 people shared their istorya today" not individual call-outs
- Be optional — no one should feel pressured to participate
- Use the earthy, warm, manuscript-inspired visual language from the brand guide