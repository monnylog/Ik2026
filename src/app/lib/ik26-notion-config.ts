// ─── IK26 2026 Production Notion Configuration ───────────────────
// Real Notion database IDs, chef page IDs, and form URLs for Isang Kusina 2026

export const IK26_FORM_URLS = {
  chefOnboarding: "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf",
  travelKitchenNeeds: "https://www.notion.so/IK26-Form-B-Travel-Kitchen-Needs-326dc6047d2d81cf97aace133f7ff9d8",
  // Pending - replace with real URLs when available
  mediaRelease: "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - same as Form A placeholder
  riderAgreement: "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - same as Form A placeholder
  teamFeedback: "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - same as Form A placeholder
  volunteerWaiver: "https://mercury-seashore-ad9.notion.site/a828872a4e7841809cc61b16c18068cf", // PENDING - same as Form A placeholder
};

export const IK26_NOTION_DATABASES = {
  chefResearchTracker: "d206d13c12ce4fe39d8f2ce664fdfb15",
  dataSourceCollection: "1aeab22c-7f9f-49f8-94cd-3eb7784a21e6",
};

// Map chef names to their Notion page IDs
export const IK26_CHEF_PAGE_IDS: Record<string, string> = {
  "Justin Barnes": "326dc6047d2d810f980ad69d103f98d2",
  "Chef Justin": "326dc6047d2d810f980ad69d103f98d2",
  justin: "326dc6047d2d810f980ad69d103f98d2",
  
  "Lord Maynard Llera": "326dc6047d2d812f88c9d388be824d31",
  "Chef Maynard": "326dc6047d2d812f88c9d388be824d31",
  "Chef Lord": "326dc6047d2d812f88c9d388be824d31",
  maynard: "326dc6047d2d812f88c9d388be824d31",
  lord: "326dc6047d2d812f88c9d388be824d31",
  
  "Aaron Verzosa": "326dc6047d2d8156889ae7e29f599c40",
  "Chef Aaron": "326dc6047d2d8156889ae7e29f599c40",
  aaron: "326dc6047d2d8156889ae7e29f599c40",
  
  "Dio Buan": "326dc6047d2d81719155e5bc75339f3b",
  "Chef Dio": "326dc6047d2d81719155e5bc75339f3b",
  dio: "326dc6047d2d81719155e5bc75339f3b",
  
  "Patrice Cleary": "326dc6047d2d817aaec4ff0c123b5d55",
  "Chef Patrice": "326dc6047d2d817aaec4ff0c123b5d55",
  patrice: "326dc6047d2d817aaec4ff0c123b5d55",
  
  "Cristina Quackenbush": "326dc6047d2d817b9e6fffb8552df441",
  "Christina Quackenbush": "326dc6047d2d817b9e6fffb8552df441",
  "Chef Christina": "326dc6047d2d817b9e6fffb8552df441",
  "Chef Cristina": "326dc6047d2d817b9e6fffb8552df441",
  cristina: "326dc6047d2d817b9e6fffb8552df441",
  christina: "326dc6047d2d817b9e6fffb8552df441",
  
  "Rachel Barril": "326dc6047d2d81f5b384c9af6b0d3d7a",
  "Chef Rachel": "326dc6047d2d81f5b384c9af6b0d3d7a",
  rachel: "326dc6047d2d81f5b384c9af6b0d3d7a",
};

// Notion property names and their options
export const IK26_NOTION_PROPERTIES = {
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

// Helper: Get chef page ID by any name variant
export function getChefPageId(chefName: string): string | null {
  const normalized = chefName.toLowerCase().trim();
  
  // Direct lookup
  if (IK26_CHEF_PAGE_IDS[chefName]) {
    return IK26_CHEF_PAGE_IDS[chefName];
  }
  
  // Try normalized
  if (IK26_CHEF_PAGE_IDS[normalized]) {
    return IK26_CHEF_PAGE_IDS[normalized];
  }
  
  // Try fuzzy match on last name
  const entries = Object.entries(IK26_CHEF_PAGE_IDS);
  for (const [key, id] of entries) {
    const keyNorm = key.toLowerCase();
    if (keyNorm.includes(normalized) || normalized.includes(keyNorm)) {
      return id;
    }
  }
  
  return null;
}

// Helper: Map task board milestones to chef milestones
export function getMilestonePropertyName(milestoneNumber: number): string | null {
  if (milestoneNumber < 1 || milestoneNumber > 4) return null;
  return IK26_NOTION_PROPERTIES.milestones[`milestone${milestoneNumber}` as keyof typeof IK26_NOTION_PROPERTIES.milestones].name;
}

// Helper: Validate status value
export function isValidStatus(status: string): status is typeof IK26_NOTION_PROPERTIES.status.options[number] {
  return IK26_NOTION_PROPERTIES.status.options.includes(status as any);
}

// Helper: Validate milestone status
export function isValidMilestoneStatus(status: string): boolean {
  const validOptions = ["Not started", "In progress", "Complete"];
  return validOptions.includes(status);
}

// Discord webhook channels
export const IK26_DISCORD_CHANNELS = [
  "leadership-sync",
  "general",
  "kitchen",
  "travel",
  "creative",
  "logistics",
  "urgent",
] as const;

export type DiscordChannelName = typeof IK26_DISCORD_CHANNELS[number];
