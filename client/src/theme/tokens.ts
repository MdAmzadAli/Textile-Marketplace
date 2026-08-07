// Single source of truth for the entire visual identity.
// Consumed by tailwind.config.js (theme.extend) and re-exported as CSS vars in tokens.css.
// Change the identity by editing THIS FILE (and tokens.css) — never hardcode values in components.

export const colors = {
  primary: "#2B3A67",
  primaryDark: "#1E2A4A",
  accent: "#C05C3B",
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  textPrimary: "#22201D",
  textMuted: "#6B6459",
  border: "#E8E2D8",
  success: "#4C8B5B",
  warning: "#C79A3B",
  error: "#B5453A",
} as const;

export const fonts = {
  display: '"Fraunces", serif',
  body: '"Inter", sans-serif',
} as const;

export const fontSizes = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "32px",
  "4xl": "40px",
  "5xl": "56px",
} as const;

// 4px base unit — do not introduce arbitrary spacing values in components.
export const spacing = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
} as const;

export const radius = {
  sm: "6px",
  md: "12px",
} as const;

export const shadows = {
  card: "0 2px 8px rgba(34,32,29,0.06)",
  modal: "0 8px 32px rgba(34,32,29,0.16)",
} as const;

export const motion = {
  fast: "150ms ease-out",
  base: "250ms ease-out",
  slow: "400ms ease-out",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
} as const;

export const tokens = { colors, fonts, fontSizes, spacing, radius, shadows, motion, breakpoints };
export default tokens;
