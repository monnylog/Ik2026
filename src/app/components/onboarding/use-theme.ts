export type ThemeId = "ik26" | "origins" | "binondo" | "sulu" | "galeon" | "dark";

const THEME_KEY = "ik26-theme";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  chapter: string;
  year: string;
  tagline: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    inputBackground: string;
    switchBackground: string;
    ring: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    success: string;
    warning: string;
    info: string;
    gold: string;
    goldLight: string;
    navy: string;
    storytelling: string;
  };
  // Preview swatch colors (5 representative colors)
  swatches: string[];
}

export const themes: ThemeConfig[] = [
  {
    id: "ik26",
    name: "Isang Kusina",
    chapter: "IK26 Default",
    year: "2026",
    tagline: "Sage, sand, and ocean calm",
    colors: {
      background: "#EDE9E0",
      foreground: "#283618",
      card: "#F8F5EF",
      cardForeground: "#283618",
      popover: "#F8F5EF",
      popoverForeground: "#283618",
      primary: "#5C7256",
      primaryForeground: "#FEFAE0",
      secondary: "#DDA15E",
      secondaryForeground: "#283618",
      muted: "#E6E0D2",
      mutedForeground: "#6B6952",
      accent: "#DDA15E",
      accentForeground: "#283618",
      destructive: "#A45A46",
      destructiveForeground: "#ffffff",
      border: "rgba(96, 108, 56, 0.2)",
      inputBackground: "#E6E0D2",
      switchBackground: "#C4B8A6",
      ring: "#5C7256",
      sidebar: "#2B4440",
      sidebarForeground: "#FEFAE0",
      sidebarPrimary: "#DDA15E",
      sidebarPrimaryForeground: "#283618",
      sidebarAccent: "#3A5A4A",
      sidebarAccentForeground: "#FEFAE0",
      sidebarBorder: "rgba(192, 209, 177, 0.08)",
      sidebarRing: "#C49370",
      success: "#5C7256",
      warning: "#BC6C25",
      info: "#506870",
      gold: "#5C7256",
      goldLight: "#C0D1B1",
      navy: "#506870",
      storytelling: "#DDA15E",
    },
    swatches: ["#5C7256", "#C49370", "#2B4440", "#C0D1B1", "#DDA15E"],
  },
  {
    id: "origins",
    name: "Origins",
    chapter: "Chapter I",
    year: "2023",
    tagline: "Fresh jade green — rooted and alive",
    colors: {
      background: "#F2F5F0",
      foreground: "#2A3630",
      card: "#FFFFFF",
      cardForeground: "#2A3630",
      popover: "#FFFFFF",
      popoverForeground: "#2A3630",
      primary: "#3AA88E",
      primaryForeground: "#FFFFFF",
      secondary: "#D6E3D5",
      secondaryForeground: "#2A3630",
      muted: "#F2F5F0",
      mutedForeground: "#5E766A",
      accent: "#D6E3D5",
      accentForeground: "#2A3630",
      destructive: "#C85A45",
      destructiveForeground: "#ffffff",
      border: "rgba(195, 214, 195, 0.6)",
      inputBackground: "#F2F5F0",
      switchBackground: "#D6E3D5",
      ring: "#3AA88E",
      sidebar: "#3D6054",
      sidebarForeground: "#DCE8DA",
      sidebarPrimary: "#3AA88E",
      sidebarPrimaryForeground: "#FFFFFF",
      sidebarAccent: "#4D7066",
      sidebarAccentForeground: "#DCE8DA",
      sidebarBorder: "rgba(255, 255, 255, 0.10)",
      sidebarRing: "#3AA88E",
      success: "#3AA88E",
      warning: "#D4A843",
      info: "#4A8FB5",
      gold: "#3AA88E",
      goldLight: "#C5E8DA",
      navy: "#3D6054",
      storytelling: "#E0EDE0",
    },
    swatches: ["#3D6054", "#3AA88E", "#D6E3D5", "#5E766A", "#E0EDE0"],
  },
  {
    id: "binondo",
    name: "Binondo",
    chapter: "Chapter II",
    year: "2024",
    tagline: "Vivid vermillion and burnished gold",
    colors: {
      background: "#FBF5F0",
      foreground: "#2D2926",
      card: "#FFFFFF",
      cardForeground: "#2D2926",
      popover: "#FFFFFF",
      popoverForeground: "#2D2926",
      primary: "#E5573F",
      primaryForeground: "#ffffff",
      secondary: "#F0DDD4",
      secondaryForeground: "#2D2926",
      muted: "#FBF5F0",
      mutedForeground: "#8A6E60",
      accent: "#F0DDD4",
      accentForeground: "#2D2926",
      destructive: "#C04030",
      destructiveForeground: "#ffffff",
      border: "rgba(230, 200, 180, 0.6)",
      inputBackground: "#FBF5F0",
      switchBackground: "#F0DDD4",
      ring: "#E5573F",
      sidebar: "#5A4E48",
      sidebarForeground: "#F0E5DD",
      sidebarPrimary: "#E5573F",
      sidebarPrimaryForeground: "#FFFFFF",
      sidebarAccent: "#6A5E56",
      sidebarAccentForeground: "#F0E5DD",
      sidebarBorder: "rgba(255, 255, 255, 0.10)",
      sidebarRing: "#E5573F",
      success: "#5DA06B",
      warning: "#E8B040",
      info: "#5A92CC",
      gold: "#E5573F",
      goldLight: "#FCCFC5",
      navy: "#5A4E48",
      storytelling: "#FCDCD8",
    },
    swatches: ["#5A4E48", "#E5573F", "#E8B040", "#F0DDD4", "#FCDCD8"],
  },
  {
    id: "sulu",
    name: "Sulu",
    chapter: "Chapter III",
    year: "2025",
    tagline: "Bright marigold and sunlit warmth",
    colors: {
      background: "#FDF8EF",
      foreground: "#2D2926",
      card: "#FFFFFF",
      cardForeground: "#2D2926",
      popover: "#FFFFFF",
      popoverForeground: "#2D2926",
      primary: "#F5B836",
      primaryForeground: "#2D2926",
      secondary: "#F0E3CA",
      secondaryForeground: "#2D2926",
      muted: "#FDF8EF",
      mutedForeground: "#8A7A5E",
      accent: "#F0E3CA",
      accentForeground: "#2D2926",
      destructive: "#C85A45",
      destructiveForeground: "#ffffff",
      border: "rgba(225, 210, 180, 0.6)",
      inputBackground: "#FDF8EF",
      switchBackground: "#F0E3CA",
      ring: "#F5B836",
      sidebar: "#5C5040",
      sidebarForeground: "#F0E8D8",
      sidebarPrimary: "#F5B836",
      sidebarPrimaryForeground: "#2D2926",
      sidebarAccent: "#6C6050",
      sidebarAccentForeground: "#F0E8D8",
      sidebarBorder: "rgba(255, 255, 255, 0.10)",
      sidebarRing: "#F5B836",
      success: "#5DA06B",
      warning: "#F5B836",
      info: "#5A92CC",
      gold: "#F5B836",
      goldLight: "#FBE8B0",
      navy: "#5C5040",
      storytelling: "#FCF0D8",
    },
    swatches: ["#5C5040", "#F5B836", "#F0E3CA", "#8A7A5E", "#FCF0D8"],
  },
  {
    id: "galeon",
    name: "Galeon",
    chapter: "Chapter IV",
    year: "2026",
    tagline: "Ocean cerulean and amber sail",
    colors: {
      background: "#F0F4F8",
      foreground: "#1E2D40",
      card: "#FFFFFF",
      cardForeground: "#1E2D40",
      popover: "#FFFFFF",
      popoverForeground: "#1E2D40",
      primary: "#4A8FD4",
      primaryForeground: "#ffffff",
      secondary: "#D4E1F0",
      secondaryForeground: "#1E2D40",
      muted: "#F0F4F8",
      mutedForeground: "#5A7088",
      accent: "#D4E1F0",
      accentForeground: "#1E2D40",
      destructive: "#C85A45",
      destructiveForeground: "#ffffff",
      border: "rgba(180, 200, 220, 0.6)",
      inputBackground: "#F0F4F8",
      switchBackground: "#D4E1F0",
      ring: "#D4A040",
      sidebar: "#3E5A74",
      sidebarForeground: "#DCE6F0",
      sidebarPrimary: "#4A8FD4",
      sidebarPrimaryForeground: "#FFFFFF",
      sidebarAccent: "#4E6A84",
      sidebarAccentForeground: "#DCE6F0",
      sidebarBorder: "rgba(255, 255, 255, 0.10)",
      sidebarRing: "#D4A040",
      success: "#5DA06B",
      warning: "#D4A040",
      info: "#4A8FD4",
      gold: "#4A8FD4",
      goldLight: "#C5DAF0",
      navy: "#3E5A74",
      storytelling: "#D8E6F5",
    },
    swatches: ["#3E5A74", "#4A8FD4", "#D4A040", "#D4E1F0", "#D8E6F5"],
  },
  {
    id: "dark",
    name: "Dark Mode",
    chapter: "Night",
    year: "2026",
    tagline: "Deep charcoal with warm gold accents",
    colors: {
      background: "#1A1D1C",
      foreground: "#E8E4DC",
      card: "#242826",
      cardForeground: "#E8E4DC",
      popover: "#242826",
      popoverForeground: "#E8E4DC",
      primary: "#7A9E72",
      primaryForeground: "#1A1D1C",
      secondary: "#2E3330",
      secondaryForeground: "#C0BAA8",
      muted: "#2E3330",
      mutedForeground: "#9A9584",
      accent: "#D4A843",
      accentForeground: "#1A1D1C",
      destructive: "#C85A45",
      destructiveForeground: "#ffffff",
      border: "rgba(232,228,220,0.12)",
      inputBackground: "#2E3330",
      switchBackground: "#3A3F3C",
      ring: "#D4A843",
      sidebar: "#141716",
      sidebarForeground: "#C0BAA8",
      sidebarPrimary: "#D4A843",
      sidebarPrimaryForeground: "#1A1D1C",
      sidebarAccent: "#2A2E2C",
      sidebarAccentForeground: "#C0BAA8",
      sidebarBorder: "rgba(232,228,220,0.06)",
      sidebarRing: "#D4A843",
      success: "#7A9E72",
      warning: "#D4A843",
      info: "#5A92CC",
      gold: "#D4A843",
      goldLight: "#3A3520",
      navy: "#2A3540",
      storytelling: "#3A3520",
    },
    swatches: ["#1A1D1C", "#D4A843", "#7A9E72", "#242826", "#C49370"],
  },
];

export function getThemeById(id: ThemeId): ThemeConfig {
  return themes.find((t) => t.id === id) || themes[0];
}

export function saveTheme(id: ThemeId) {
  localStorage.setItem(THEME_KEY, id);
}

export function getSavedTheme(): ThemeId {
  const saved = localStorage.getItem(THEME_KEY) as ThemeId;
  if (saved) return saved;
  // Default to system preference if no saved theme
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "ik26";
}

export function applyTheme(id: ThemeId) {
  const theme = getThemeById(id);
  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty("--background", c.background);
  root.style.setProperty("--foreground", c.foreground);
  root.style.setProperty("--card", c.card);
  root.style.setProperty("--card-foreground", c.cardForeground);
  root.style.setProperty("--popover", c.popover);
  root.style.setProperty("--popover-foreground", c.popoverForeground);
  root.style.setProperty("--primary", c.primary);
  root.style.setProperty("--primary-foreground", c.primaryForeground);
  root.style.setProperty("--secondary", c.secondary);
  root.style.setProperty("--secondary-foreground", c.secondaryForeground);
  root.style.setProperty("--muted", c.muted);
  root.style.setProperty("--muted-foreground", c.mutedForeground);
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--accent-foreground", c.accentForeground);
  root.style.setProperty("--destructive", c.destructive);
  root.style.setProperty("--destructive-foreground", c.destructiveForeground);
  root.style.setProperty("--border", c.border);
  root.style.setProperty("--input-background", c.inputBackground);
  root.style.setProperty("--switch-background", c.switchBackground);
  root.style.setProperty("--ring", c.ring);
  root.style.setProperty("--sidebar", c.sidebar);
  root.style.setProperty("--sidebar-foreground", c.sidebarForeground);
  root.style.setProperty("--sidebar-primary", c.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", c.sidebarPrimaryForeground);
  root.style.setProperty("--sidebar-accent", c.sidebarAccent);
  root.style.setProperty("--sidebar-accent-foreground", c.sidebarAccentForeground);
  root.style.setProperty("--sidebar-border", c.sidebarBorder);
  root.style.setProperty("--sidebar-ring", c.sidebarRing);
  root.style.setProperty("--success", c.success);
  root.style.setProperty("--warning", c.warning);
  root.style.setProperty("--info", c.info);
  root.style.setProperty("--gold", c.gold);
  root.style.setProperty("--gold-light", c.goldLight);
  root.style.setProperty("--navy", c.navy);
  root.style.setProperty("--storytelling", c.storytelling);
  root.style.setProperty("--chart-1", c.primary);
  root.style.setProperty("--chart-2", c.success);
  root.style.setProperty("--chart-3", c.destructive);

  saveTheme(id);
}

// Apply saved theme immediately on script load (prevents flash of wrong theme)
try {
  const earlyTheme = localStorage.getItem("ik26-theme") as ThemeId | null;
  if (earlyTheme && earlyTheme !== "ik26") {
    // Schedule synchronous application on first render
    if (typeof document !== "undefined") {
      const theme = themes.find((t) => t.id === earlyTheme);
      if (theme) {
        const root = document.documentElement;
        root.style.setProperty("--background", theme.colors.background);
        root.style.setProperty("--foreground", theme.colors.foreground);
        root.style.setProperty("--card", theme.colors.card);
        root.style.setProperty("--card-foreground", theme.colors.cardForeground);
        root.style.setProperty("--sidebar", theme.colors.sidebar);
        root.style.setProperty("--sidebar-foreground", theme.colors.sidebarForeground);
        root.style.setProperty("--primary", theme.colors.primary);
        root.style.setProperty("--muted", theme.colors.muted);
        root.style.setProperty("--muted-foreground", theme.colors.mutedForeground);
        root.style.setProperty("--border", theme.colors.border);
        root.style.setProperty("--gold", theme.colors.gold);
      }
    }
  }
} catch { /* ignore in SSR or when localStorage is unavailable */ }