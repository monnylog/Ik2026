// ─── IK2026 (V3) Production Notion Configuration ─────────────────
// Single source of truth: Notion Ops Center → Supabase Edge Function → App
// This file: static IDs only. All live data flows through notion-sync.ts.

export const IK2026_FORM_URLS = {
  chefOnboarding: "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf",
  travelKitchenNeeds: "https://www.notion.so/IK26-Form-B-Travel-Kitchen-Needs-326dc6047d2d81cf97aace133f7ff9d8",
  mediaRelease: null,
  riderAgreement: null,
  teamFeedback: null,
  volunteerWaiver: null,
};
/** @deprecated use IK2026_FORM_URLS */
export const IK26_FORM_URLS = IK2026_FORM_URLS;

export const IK2026_NOTION_DATABASES = {
  chefResearchTracker: "d206d13c12ce4fe39d8f2ce664fdfb15",
  dataSourceCollection: "1aeab22c-7f9f-49f8-94cd-3eb7784a21e6",
};
/** @deprecated use IK2026_NOTION_DATABASES */
export const IK26_NOTION_DATABASES = IK2026_NOTION_DATABASES;

// ─── Year Three Chef Roster (Final) ──────────────────────────────
// 1-Rachel  2-Aaron  3-Lord Maynard  4-Christina  5-Patrice

export const IK2026_CHEF_PAGE_IDS: Record<string, string> = {
  "Rachel Barril": "326dc6047d2d81f5b384c9af6b0d3d7a",
  "Chef Rachel": "326dc6047d2d81f5b384c9af6b0d3d7a",
  rachel: "326dc6047d2d81f5b384c9af6b0d3d7a",

  "Aaron Verzosa": "326dc6047d2d8156889ae7e29f599c40",
  "Chef Aaron": "326dc6047d2d8156889ae7e29f599c40",
  aaron: "326dc6047d2d8156889ae7e29f599c40",

  "Lord Maynard Llera": "326dc6047d2d812f88c9d388be824d31",
  "Chef Maynard": "326dc6047d2d812f88c9d388be824d31",
  "Chef Lord": "326dc6047d2d812f88c9d388be824d31",
  "Kuya Lord": "326dc6047d2d812f88c9d388be824d31",
  maynard: "326dc6047d2d812f88c9d388be824d31",
  lord: "326dc6047d2d812f88c9d388be824d31",

  "Christina Quackenbush": "326dc6047d2d817b9e6fffb8552df441",
  "Cristina Quackenbush": "326dc6047d2d817b9e6fffb8552df441",
  "Chef Christina": "326dc6047d2d817b9e6fffb8552df441",
  "Chef Cristina": "326dc6047d2d817b9e6fffb8552df441",
  christina: "326dc6047d2d817b9e6fffb8552df441",
  cristina: "326dc6047d2d817b9e6fffb8552df441",

  "Patrice Cleary": "326dc6047d2d817aaec4ff0c123b5d55",
  "Chef Patrice": "326dc6047d2d817aaec4ff0c123b5d55",
  patrice: "326dc6047d2d817aaec4ff0c123b5d55",
};
/** @deprecated use IK2026_CHEF_PAGE_IDS */
export const IK26_CHEF_PAGE_IDS = IK2026_CHEF_PAGE_IDS;

export const IK2026_NOTION_PROPERTIES = {
  status: {
    name: "Status",
    options: ["Invited", "Confirmed", "In R&D", "Dish Finalized", "Event Ready"] as const,
  },
  milestones: {
    milestone1: { name: "Milestone 1", options: ["Not started", "In progress", "Complete"] as const },
    milestone2: { name: "Milestone 2", options: ["Not started", "In progress", "Complete"] as const },
    milestone3: { name: "Milestone 3", options: ["Not started", "In progress", "Complete"] as const },
    milestone4: { name: "Milestone 4", options: ["Not started", "In progress", "Complete"] as const },
  },
  dishConcept: "Dish Concept",
  historicalAnchor: "Historical Anchor",
  travelNotes: "Travel Notes",
  dietaryFlags: "Dietary Flags",
};
/** @deprecated use IK2026_NOTION_PROPERTIES */
export const IK26_NOTION_PROPERTIES = IK2026_NOTION_PROPERTIES;

export function getChefPageId(chefName: string): string | null {
  const normalized = chefName.toLowerCase().trim();
  if (IK2026_CHEF_PAGE_IDS[chefName]) return IK2026_CHEF_PAGE_IDS[chefName];
  if (IK2026_CHEF_PAGE_IDS[normalized]) return IK2026_CHEF_PAGE_IDS[normalized];
  for (const [key, id] of Object.entries(IK2026_CHEF_PAGE_IDS)) {
    const k = key.toLowerCase();
    if (k.includes(normalized) || normalized.includes(k)) return id;
  }
  return null;
}

export function getMilestonePropertyName(n: number): string | null {
  if (n < 1 || n > 4) return null;
  return IK2026_NOTION_PROPERTIES.milestones[`milestone${n}` as keyof typeof IK2026_NOTION_PROPERTIES.milestones].name;
}

export function isValidStatus(s: string): s is typeof IK2026_NOTION_PROPERTIES.status.options[number] {
  return (IK2026_NOTION_PROPERTIES.status.options as readonly string[]).includes(s);
}

export function isValidMilestoneStatus(s: string): boolean {
  return ["Not started", "In progress", "Complete"].includes(s);
}

export const IK2026_DISCORD_CHANNELS = [
  "leadership-sync", "general", "kitchen", "travel", "creative", "logistics", "urgent",
] as const;
/** @deprecated use IK2026_DISCORD_CHANNELS */
export const IK26_DISCORD_CHANNELS = IK2026_DISCORD_CHANNELS;
export type DiscordChannelName = typeof IK2026_DISCORD_CHANNELS[number];
