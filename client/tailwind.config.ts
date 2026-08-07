import type { Config } from "tailwindcss";
import { colors, fonts, fontSizes, spacing, radius, shadows, motion } from "./src/theme/tokens";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        "primary-dark": colors.primaryDark,
        accent: colors.accent,
        bg: colors.bg,
        surface: colors.surface,
        "text-primary": colors.textPrimary,
        "text-muted": colors.textMuted,
        border: colors.border,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
      },
      fontFamily: {
        display: [fonts.display],
        body: [fonts.body],
      },
      fontSize: fontSizes,
      spacing,
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
      },
      boxShadow: {
        card: shadows.card,
        modal: shadows.modal,
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        fast: "ease-out",
        base: "ease-out",
        slow: "ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
