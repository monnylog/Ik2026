export type UserRole = "leadership" | "team" | "chef" | "viewer";

const ROLE_KEY = "ik26-role";
const ONBOARDING_KEY = "ik26-onboarding-complete";
const REMEMBER_KEY = "ik26-remember-me";

const PASSWORD_MAP: Record<string, UserRole> = {
  // Leadership
  northstar222: "leadership",
  walbert2026: "leadership",
  m222: "leadership",
  w222: "leadership",
  // Chef
  kusina2026: "chef",
  chefik26: "chef",
  istorya2026: "chef",
  chef2026: "chef",
  // Team
  teamik26: "team",
  team2026: "team",
  ops2026: "team",
  ik2026: "team",
  c222: "team",
  jj222: "team",
  mari222: "team",
  dio222: "team",
  jb222: "team",
  anj222: "team",
  cy222: "team",
  gris222: "team",
  ayce222: "team",
  jaryd222: "team",
  zwei222: "team",
  drew222: "team",
  ava222: "team",
  fler222: "team",
  sarah222: "team",
  jerj222: "team",
  // Viewer
  den222: "viewer",
  team222: "viewer",
};

// ── Personal password presets ─────────────────────────────────────
// These passwords auto-populate profile info and skip the selection step.
export interface PersonalPreset {
  displayName: string;
  role: UserRole;
  avatarId: string;
  bio?: string;
  specialty?: string;
  location?: string;
}

const PERSONAL_PASSWORDS: Record<string, PersonalPreset> = {
  walbert2026: {
    displayName: "Walbert Castillo",
    role: "leadership",
    avatarId: "mortar",
    bio: "Co-Owner / EP",
    specialty: "Event Production & Creative Direction",
    location: "Las Vegas, NV",
  },
  w222: {
    displayName: "Walbert Castillo",
    role: "leadership",
    avatarId: "mortar",
    bio: "Co-Owner / EP",
    specialty: "Event Production & Creative Direction",
    location: "Las Vegas, NV",
  },
  m222: {
    displayName: "Monica Blanco",
    role: "leadership",
    avatarId: "bowl",
    bio: "COO",
    specialty: "Operations & Strategy",
    location: "Las Vegas, NV",
  },
  c222: {
    displayName: "Christine Antonio",
    role: "team",
    avatarId: "leaf",
  },
  jj222: {
    displayName: "JJ Mayang",
    role: "team",
    avatarId: "leaf",
  },
  mari222: {
    displayName: "Mariana",
    role: "team",
    avatarId: "leaf",
  },
  dio222: {
    displayName: "Dio Buan",
    role: "team",
    avatarId: "leaf",
  },
  jb222: {
    displayName: "Justin Barnes",
    role: "team",
    avatarId: "leaf",
  },
  anj222: {
    displayName: "Anjelique",
    role: "team",
    avatarId: "leaf",
  },
  cy222: {
    displayName: "Cy",
    role: "team",
    avatarId: "leaf",
  },
  gris222: {
    displayName: "Griselle",
    role: "team",
    avatarId: "leaf",
  },
  ayce222: {
    displayName: "Ayce Mangapit",
    role: "team",
    avatarId: "leaf",
  },
  jaryd222: {
    displayName: "Jaryd Lucero",
    role: "team",
    avatarId: "leaf",
  },
  zwei222: {
    displayName: "Zwei",
    role: "team",
    avatarId: "leaf",
  },
  drew222: {
    displayName: "Andrew",
    role: "team",
    avatarId: "leaf",
  },
  ava222: {
    displayName: "Ava Carino",
    role: "team",
    avatarId: "leaf",
  },
  fler222: {
    displayName: "Flerine Cruz Atienza",
    role: "team",
    avatarId: "leaf",
  },
  sarah222: {
    displayName: "Sarah Obal",
    role: "team",
    avatarId: "leaf",
  },
  jerj222: {
    displayName: "Jerjon",
    role: "team",
    avatarId: "leaf",
  },
  den222: {
    displayName: "Denise",
    role: "viewer",
    avatarId: "leaf",
  },
};

export function getPersonalPreset(pw: string): PersonalPreset | null {
  return PERSONAL_PASSWORDS[pw.trim().toLowerCase()] || null;
}

export function authenticatePassword(pw: string): UserRole | null {
  // No backdoors — every login requires a real access code
  return PASSWORD_MAP[pw.trim().toLowerCase()] || null;
}

export function saveSession(role: UserRole, rememberMe: boolean) {
  localStorage.setItem(ROLE_KEY, role);
  // Always remember the session — users must explicitly sign out
  localStorage.setItem(REMEMBER_KEY, "true");
}

export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function getSession(): {
  role: UserRole | null;
  onboardingComplete: boolean;
  rememberMe: boolean;
} {
  // Check for profile-based session first
  try {
    const profileCache = localStorage.getItem("ik26-profile-cache");
    if (profileCache) {
      const profile = JSON.parse(profileCache);
      const hasToken =
        localStorage.getItem("ik26-auth-token") ||
        sessionStorage.getItem("ik26-auth-token");
      if (profile && hasToken) {
        return {
          role: profile.role as UserRole,
          onboardingComplete: profile.onboardingCompleted ?? false,
          rememberMe: !!localStorage.getItem("ik26-auth-token"),
        };
      }
    }
  } catch { /* fall through to legacy */ }

  // Legacy localStorage session — only trust if an auth token also exists
  const hasToken =
    localStorage.getItem("ik26-auth-token") ||
    sessionStorage.getItem("ik26-auth-token");
  if (!hasToken) {
    // No valid token — don't auto-admit from stale legacy keys
    return { role: null, onboardingComplete: false, rememberMe: false };
  }
  const role = localStorage.getItem(ROLE_KEY) as UserRole | null;
  const onboardingComplete = localStorage.getItem(ONBOARDING_KEY) === "true";
  const rememberMe = localStorage.getItem(REMEMBER_KEY) === "true";
  return { role, onboardingComplete, rememberMe };
}

export function clearSession() {
  // Clear legacy keys
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem("ik26-onboarding-draft");

  // Clear profile-based keys
  localStorage.removeItem("ik26-profile-cache");
  localStorage.removeItem("ik26-auth-token");
  localStorage.removeItem("ik26-refresh-token");
  localStorage.removeItem("ik26-chat-avatar");
  localStorage.removeItem("ik26-chat-name");
  localStorage.removeItem("ik26-theme");
  localStorage.removeItem("ik26-prev-light-theme");
  try {
    sessionStorage.removeItem("ik26-auth-token");
    sessionStorage.removeItem("ik26-refresh-token");
  } catch { /* ignore */ }
}

// Sidebar visibility per role
const hiddenNavItems: Record<UserRole, string[]> = {
  leadership: [],
  team: ["Budget & COGS", "Finance", "Sponsors & Partners", "Members", "Inquiries", "Notion Admin", "Mission Control", "Activity Log", "Expenses", "Reimbursements", "System Audit"],
  chef: ["Team Deploy", "Budget & COGS", "Finance", "Sponsors & Partners", "Research & Story", "Members", "Inquiries", "Notion Admin", "Mission Control", "Activity Log", "Expenses", "Reimbursements", "Pre-Event Checklist", "Task Board", "System Audit"],
  viewer: ["Team Deploy", "Budget & COGS", "Finance", "Sponsors & Partners", "Research & Story", "Members", "Inquiries", "Notion Admin", "Mission Control", "Activity Log", "Expenses", "Reimbursements", "Pre-Event Checklist", "Task Board", "System Audit"],
};

export function getVisibleNavItems(role: UserRole, allItems: string[]): string[] {
  const hidden = hiddenNavItems[role] || [];
  return allItems.filter((item) => !hidden.includes(item));
}

// Role display labels
export function getRoleLabel(role: UserRole): string {
  if (role === "leadership") return "Leadership";
  if (role === "team") return "Team Member";
  if (role === "viewer") return "Viewer";
  return "Chef View";
}

// View mode for leadership switching
export type ViewMode = "leadership" | "team" | "chef";

// Pages hidden in chef view (used by leadership when previewing chef experience)
export const leadershipOnlyPages = ["Team Deploy", "Budget & COGS", "Finance", "Sponsors & Partners", "Research & Story", "Members", "Inquiries", "Notion Admin", "Mission Control", "Activity Log", "Expenses", "Reimbursements", "Pre-Event Checklist", "Task Board", "System Audit"];

// Pages hidden in team view
export const teamHiddenPages = ["Budget & COGS", "Finance", "Sponsors & Partners", "Members", "Inquiries", "Notion Admin", "Mission Control", "Activity Log", "Expenses", "Reimbursements", "System Audit"];

export function getVisibleNavItemsForView(viewMode: ViewMode, allItems: string[]): string[] {
  if (viewMode === "leadership") return allItems;
  if (viewMode === "team") {
    const hidden = hiddenNavItems["team"] || [];
    return allItems.filter((item) => !hidden.includes(item));
  }
  const hidden = hiddenNavItems["chef"] || [];
  return allItems.filter((item) => !hidden.includes(item));
}