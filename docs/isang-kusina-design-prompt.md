Here is the final Figma-ready design prompt, synthesized from Claude Opus 4.6's framework with all Isang Kusina context, voice, assets, and the Cosmos × Comet × scroll hybrid architecture baked in:

***

**Figma Design Prompt: Isang Kusina 2026 — Web App Opening Experience**

> **Project:**
> Isang Kusina 2026 (Year Three) — a one-night-only collaborative Filipino dinner produced by Istorya in Las Vegas. Five acclaimed Filipino chefs from five cities cook side by side at the Keep Memory Alive Event Center on May 22, 2026. Each course tells a story rooted in Filipino history, memory, and community. The web app at isangkusina.com is the public experience, ticketing hub, and partner portal. The event falls during AAPI Heritage Month and has sold out every year. [asianjournal](https://asianjournal.com/usa/lasvegas/top-filipino-chefs-host-dinner-collaboration-in-las-vegas/)
>
> **Brand guide:**
> Follow the Istorya brand guide for color palette, typography, and logo usage. Dark, warm foundation. Type hierarchy should feel editorial and cinematic — not corporate. All design decisions should reference the existing brand guide file in the project.
>
> **Voice and tone (apply to all UI copy):**
> Grounded, communal, proud but never performative. Speaks like a friend inviting you to something special — not a brand selling tickets. Filipino cultural references woven in naturally, never explained or exoticized. Short sentences. No em dashes. No AI rhetoric. No corporate language. The vibe: "Pull up a chair. We saved you a seat." [istoryalv](https://www.istoryalv.com)
>
> **Target devices:**
> Design mobile-first (375px), then scale to tablet (768px) and desktop (1440px). Most users will arrive via a shared link opened on their phone. Touch and scroll interactions take priority over hover/cursor at every breakpoint. [everything](https://www.everything.design/blog/scroll-animations-performance)
>
> ---
>
> ### Frame 1: Intro Splash (one-time cinematic sequence)
>
> Design a full-screen overlay sequence that plays once on first visit. Four beats on a single dark canvas:
>
> - **Beat 1:** Dark screen. A single point of warm light (amber/gold from the brand palette) blooms from center. No text. Annotate: "Lottie glow animation, 1.5s, ease power2.out."
> - **Beat 2:** The Isang Kusina wordmark appears with staggered letter entrance (each letter arriving like a guest sitting down). Below it: "One Kitchen. One Night. One Story." Annotate: "GSAP stagger, 0.05s per character."
> - **Beat 3:** Behind the text, a blurred cinematic table-setting image fades in with layered depth — foreground steam/particles, midground hands and dishes, background warm room glow. Annotate: "Three parallax layers, CSS transform only."
> - **Beat 4:** A single CTA button materializes with a soft glow pulse: **"Step into the story."** Annotate: "GSAP scale + opacity, back.out easing."
> - **Skip:** Small "Skip" text anchored bottom-right corner. Always visible from Beat 1.
> - **Reduced motion variant:** Design an alternate frame — static dark background, wordmark centered, tagline, CTA. No animation. Annotate: "Shown when prefers-reduced-motion is active."
>
> ---
>
> ### Frame 2: Personalization Gate
>
> After the splash dissolves, show a single full-screen choice. Headline: **"How are you joining us tonight?"**
>
> Three large, tappable cards stacked vertically on mobile, side by side on desktop:
>
> - 🍽️ **"I want a seat at the table"** — routes to guest experience (story + booking). Annotate: "Sets localStorage role = guest."
> - 🤝 **"I want to collaborate"** — routes to the Partner Portal (isangkusina.com/portal). Annotate: "Sets localStorage role = partner."
> - 👀 **"I'm just here to explore"** — routes to full scroll experience with no booking pressure. Annotate: "Sets localStorage role = explorer."
>
> Design two states per card: default and selected (selected card scales up slightly, others fade to 40% opacity). Annotate the transition: "CSS transform + opacity, 0.3s."
>
> On return visits, skip this screen entirely. The app remembers the choice and adapts CTAs throughout. [perplexity](https://www.perplexity.ai/search/4684552d-0d95-4092-b979-bf1eee5e87fc)
>
> ---
>
> ### Frame 3: Hero (above the fold, post-personalization)
>
> - **Headline:** "Isang Kusina: One Night. One Kitchen. One Story."
> - **Subcopy:** "Five Filipino chefs from five cities. One collaborative dinner in Las Vegas. Every course is a chapter."
> - **Primary CTA** (adapts by role):
>   - Guest: "Reserve your seat — May 22"
>   - Partner: "Explore the vision"
>   - Explorer: "See how the night unfolds"
> - **Background:** Layered parallax scene — foreground light particles/steam, midground table silhouette, background warm gradient. Annotate: "Three layers, CSS transforms on scroll, cap movement at 20% viewport height."
> - **Scroll indicator:** Animated downward chevron or "Scroll to begin" text at bottom center.
> - **Secondary link:** Small "For Partners & Press →" text link anchored bottom-left, routing to the Portal. Subtle enough that guests ignore it; visible enough that industry professionals find it.
> - **Global element:** Slim vertical scroll-progress spine pinned to the right edge of the viewport, empty at top, fills as user scrolls through all sections. Annotate: "CSS scroll-timeline with GSAP fallback, scaleY 0→1."
>
> ---
>
> ### Frame 4: "What Is Isang Kusina?" (first scroll section)
>
> - **Headline:** "One kitchen. Many chefs. One night only."
> - **Body:** "Every year, we invite a dream team of Filipino chefs to cook side by side in Las Vegas. Each dish is a chapter. Each night is unrepeatable."
> - **Visual:** Right side (desktop) or below copy (mobile) — a Lottie placeholder showing an archipelago of islands morphing into a single communal table. Annotate: "Lottie scroll-scrub, tied to section scroll progress."
> - **Entrance animation:** Headline slides in from left, body copy fades up, visual scales from 95% to 100%. Annotate: "GSAP ScrollTrigger, trigger at top 80%, staggered 0.3s."
> - **Section divider:** A thin horizontal line traces across the full width as the section completes. Annotate: "CSS scaleX 0→1, scroll-triggered."
>
> ---
>
> ### Frame 5: "The Chefs" (interactive card section)
>
> - **Section title:** "Five chefs. Five cities. One table."
> - **Layout:** Horizontal scrollable row on mobile (swipeable), five cards side by side on desktop.
> - **Card default state:** Chef photo (warm-toned, editorial crop), name, city, one-line credential. Example:
>   - "Lord Maynard Llera — Kuya Lord, Los Angeles — JB Best Chef: California 2024"
>   - "Aaron Verzosa — Archipelago, Seattle — Eater ROTY 2019, JB nominee"
>   - "Christina Quackenbush — Tatlo/Milkfish, New Orleans"
>   - "Rachel Barril — Salmon Cannery, Juneau, AK"
>   - "Patrice Cleary — Purple Patch, Washington, DC"
> - **Card interaction state (tap/hover):** Card flips or expands to reveal a short quote from the chef about their story and what they're bringing this year. Annotate: "CSS transform rotateY for flip, or GSAP height + opacity for expand."
> - **Connecting animation:** As user scrolls past the section, a Lottie line traces across a minimal US map connecting New Orleans → Juneau → LA → Seattle → DC → Las Vegas. Annotate: "Lottie tied to scroll progress via GSAP ScrollTrigger."
> - **Card entrance:** Staggered from left, 0.15s apart, with slight 2° rotation that resolves to 0°. Annotate: "GSAP stagger, trigger at top 75%."
>
> ---
>
> ### Frame 6: "How the Night Unfolds" (pinned scroll-scrub section)
>
> This is the signature "delight moment." The section pins to the viewport while the user scrubs through three chapters horizontally by scrolling vertically.
>
> - **Chapter I: "Arrival"** — Copy about stepping into the space, first light, sound, welcome bites. Background color: deep indigo. Visual: empty table with a single light source.
> - **Chapter II: "The Feast"** — Copy about courses arriving, shared plates, stories surfacing at the table. Background color: warm burgundy. Visual: full table, multiple hands, steam rising.
> - **Chapter III: "After the Story"** — Copy about dessert, lingering conversation, the room softening. Background color: amber/gold. Visual: candlelight close-up, half-empty glasses.
>
> Annotate the full section: "GSAP ScrollTrigger with pin: true, scrub: 1, snap: 1/(chapters-1). Background color interpolates between chapters using GSAP. Each chapter card is 100vw. Vertical scroll maps to horizontal position."
>
> - **Chapter indicator:** Three dots or labels ("I · II · III") at the bottom that highlight as the active chapter changes.
>
> ---
>
> ### Frame 7: "Choose Your Night" (booking section)
>
> - **Section title:** "Choose your seating."
> - **Two cards:**
>   - "First Seating — 5:00 PM" with a one-line vibe: "Doors open. Lights dim. We guide you through each course, one chapter at a time."
>   - "Second Seating — 8:00 PM" with a one-line vibe: "The late chapter. Same story, deeper into the night."
> - **Inline essentials** (visible without expanding): May 22, 2026 · Keep Memory Alive Event Center, Las Vegas · ~$150 GA · Optional beverage pairing · Dietary accommodations available.
> - **CTA adapts:**
>   - Guest: "Reserve this seating"
>   - Partner: "Request a partner preview"
>   - Explorer: "Share this with a friend"
> - **Sold-out state:** Card background shifts to muted tone, CTA becomes "Join the family list" with warm confirmation copy: "We'll let you know first when the next Isang Kusina is announced."
>
> ---
>
> ### Frame 8: "Share the Story" (closing + share mechanic)
>
> - **Closing line:** "Isang Kusina. One kitchen. One story told together at the table."
> - **Share block:** A prominent button: **"Send this to someone"** — triggers native share sheet on mobile, copy-link + pre-formatted message on desktop.
> - **Pre-formatted share text:** "Five Filipino chefs. One night in Vegas. One story at the table. isangkusina.com"
> - **Open Graph preview card spec:** Design a ticket-style OG image (1200×630px) with the Isang Kusina wordmark, "May 22, 2026 · Las Vegas," and the line "You're invited to step into the Istorya." Dark background, warm accent. Annotate: "Export as OG template for Vercel OG dynamic generation."
> - **Screenshot-friendly layout:** This closing frame should look good when screenshotted and posted to an IG story — centered wordmark, date, warm glow, dark background, no UI chrome cluttering the edges.
> - **Social proof strip:** 1–2 real guest or press quotes integrated into the closing, e.g., "We forgot we were in Vegas for two hours." — styled as editorial pull quotes, not a reviews widget.
>
> ---
>
> ### Frame 9: Footer
>
> Minimal, utility-first:
> - Contact · FAQs · Accessibility · "For Partners & Press" (→ Portal) · "About Istorya" (→ istoryalv.com)
> - Closing tagline: "Made with malasakit in Las Vegas."
> - Social icons: @istoryalv (IG, TikTok)
>
> ---
>
> ### Global design notes
>
> - **Calm mode toggle:** Place a small "Calm mode" toggle in the top nav or hero. When active, adds a `.calm` class that disables all GSAP/Lottie animations, removes parallax, and shows content in a clean, static layout with basic CSS fades only.
> - **Reduced motion:** Auto-detect `prefers-reduced-motion` at OS level. If active, force calm mode on load without requiring a toggle.
> - **Performance annotations:** On every animated element, annotate whether it uses CSS transitions (cheap), GSAP ScrollTrigger (medium), Lottie scroll-scrub (heavier), or WebGL (heaviest). Flag any section that should lazy-load.
> - **Mobile-first fidelity:** Design every frame at 375px first. The mobile version is the "real" design; desktop is the enhancement.
> - **Analytics hooks:** Annotate the following interactive moments for dev handoff: splashCompleted, splashSkipped, personalizationChoice, chapterEnter (per section), chefCardInteraction (per chef), CTAClick, shareAction, portalClick.

***

This prompt gives any designer opening Figma everything they need: exact copy, layout logic per breakpoint, interaction states, animation annotations with specific tooling callouts, accessibility requirements, and role-adaptive UI — all grounded in Isang Kusina's real brand, real chefs, and real operational constraints. [asianjournal](https://asianjournal.com/usa/lasvegas/top-filipino-chefs-host-dinner-collaboration-in-las-vegas/)