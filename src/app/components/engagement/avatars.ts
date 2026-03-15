// ─── Istorya-branded avatar system ────────────────────────────────
// Earthy, warm, culturally inspired — used across chat & engagement

export interface IstoryaAvatar {
  id: string;
  label: string;
  emoji: string;
  bg: string;
  color: string;
}

export const avatarOptions: IstoryaAvatar[] = [
  { id: "mortar", label: "Mortar & Pestle", emoji: "🫕", bg: "rgba(196,147,112,0.12)", color: "#C49370" },
  { id: "rice", label: "Rice Grain", emoji: "🌾", bg: "rgba(212,168,67,0.12)", color: "#D4A843" },
  { id: "clay-pot", label: "Clay Pot", emoji: "🏺", bg: "rgba(122,102,92,0.12)", color: "#7A665C" },
  { id: "flame", label: "Flame", emoji: "🔥", bg: "rgba(196,147,112,0.12)", color: "#C49370" },
  { id: "star", label: "Star", emoji: "✦", bg: "rgba(212,168,67,0.12)", color: "#D4A843" },
  { id: "leaf", label: "Banana Leaf", emoji: "🍃", bg: "rgba(122,134,92,0.12)", color: "#7A865C" },
  { id: "spoon", label: "Wooden Spoon", emoji: "🥄", bg: "rgba(96,67,60,0.12)", color: "#60433C" },
  { id: "book", label: "Book", emoji: "📖", bg: "rgba(74,127,181,0.12)", color: "#4A7FB5" },
  { id: "turmeric", label: "Turmeric Root", emoji: "🫚", bg: "rgba(212,168,67,0.12)", color: "#D4A843" },
  { id: "island", label: "Island", emoji: "🏝️", bg: "rgba(122,134,92,0.12)", color: "#7A865C" },
  { id: "shell", label: "Shell", emoji: "🐚", bg: "rgba(212,168,67,0.12)", color: "#D4A843" },
  { id: "sun", label: "Sun", emoji: "☀️", bg: "rgba(196,147,112,0.08)", color: "#C49370" },
];

export function getAvatar(id: string): IstoryaAvatar {
  return avatarOptions.find((a) => a.id === id) || avatarOptions[0];
}

// ─── Display identity helpers ────────────────────────────────────
// 3-tier fallback: customPhotoUrl > chef directory logo > emoji avatar

export interface DisplayIdentity {
  name: string;
  emoji: string;
  bg: string;
  color: string;
  photoUrl?: string; // custom photo or chef logo
  chefId?: string;   // confirmed chef directory id
}

/**
 * Build a display identity from available profile data.
 * Priority: customPhotoUrl > chefDirectory.logoUrl > emoji avatar
 */
export function buildDisplayIdentity(opts: {
  displayName?: string;
  avatarId?: string;
  customPhotoUrl?: string;
  chefDirectoryId?: string;
  chefLogoUrl?: string; // from chef directory entry
}): DisplayIdentity {
  const avatar = getAvatar(opts.avatarId || "mortar");
  return {
    name: opts.displayName || "",
    emoji: avatar.emoji,
    bg: avatar.bg,
    color: avatar.color,
    photoUrl: opts.customPhotoUrl || opts.chefLogoUrl || undefined,
    chefId: opts.chefDirectoryId || undefined,
  };
}

// ─── User identity persistence ───────────────────────────────────
// These functions check the profile cache first, then fall back to legacy keys.

const AVATAR_KEY = "ik26-chat-avatar";
const NAME_KEY = "ik26-chat-name";
const PROFILE_CACHE_KEY = "ik26-profile-cache";

function getProfileCache(): { displayName?: string; avatarId?: string } | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getSavedAvatar(): string {
  const profile = getProfileCache();
  if (profile?.avatarId) return profile.avatarId;
  return localStorage.getItem(AVATAR_KEY) || "mortar";
}

export function saveAvatar(id: string) {
  localStorage.setItem(AVATAR_KEY, id);
}

export function getSavedName(): string {
  const profile = getProfileCache();
  if (profile?.displayName) return profile.displayName;
  return localStorage.getItem(NAME_KEY) || "";
}

export function saveName(name: string) {
  localStorage.setItem(NAME_KEY, name);
}