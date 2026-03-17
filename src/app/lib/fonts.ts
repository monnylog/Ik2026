// Shared typography constants — Civil (body) + Steiner (headings)
// Superior Type with graceful fallbacks:
//   Civil → DM Sans (geometric sans) → Inter (system sans)
//   Steiner → Cormorant Garamond (high-contrast serif) → Playfair Display

export const bodyFont = { fontFamily: "'Civil', 'DM Sans', 'Inter', sans-serif" } as const;
export const headingFont = {
  fontFamily: "'Steiner', 'Cormorant Garamond', 'Degular', 'Maragsa', 'Playfair Display', serif",
} as const;
export const monoFont = { fontFamily: "'JetBrains Mono', monospace" } as const;