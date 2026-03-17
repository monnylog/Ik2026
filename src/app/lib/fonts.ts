// Shared typography constants — Civil (body) + Steiner (headings)
// Superior Type with graceful fallbacks to Inter / Playfair Display

export const bodyFont = { fontFamily: "'Civil', 'Inter', sans-serif" } as const;
export const headingFont = {
  fontFamily: "'Steiner', 'Degular', 'Maragsa', 'Playfair Display', serif",
} as const;
export const monoFont = { fontFamily: "'JetBrains Mono', monospace" } as const;
