export const palette = {
  background: "#16161A",
  surface: "#1D1D22",
  elevated: "#24242B",
  border: "#2E2E37",
  primary: "#3ECF8E",
  secondary: "#4B4B56",
  success: "#3ECF8E",
  warning: "#D9822B",
  danger: "#F05252",
  textPrimary: "#E7E7EA",
  textSecondary: "#9A9AA3",
} as const;

export const paletteLabels = {
  background: "Graphite Base",
  surface: "Panel",
  elevated: "Raised Panel",
  border: "Hairline",
  primary: "Accent Green",
  secondary: "Neutral Button",
  success: "Accent Green",
  warning: "Amber",
  danger: "Red",
  textPrimary: "Primary Text",
  textSecondary: "Muted Text",
} as const;

export const ctaGradient = "linear-gradient(180deg, #3ECF8E 0%, #2EB67E 100%)";

export const swipe = {
  like: "#3ECF8E",
  skip: "#F05252",
  matchGradient: ctaGradient,
} as const;

export const fonts = {
  heading: "Space Grotesk",
  body: "Inter",
  mono: "JetBrains Mono",
} as const;

export const typeScale = {
  h1: { size: 36, family: "Space Grotesk", weight: 700 },
  h2: { size: 28, family: "Space Grotesk", weight: 600 },
  h3: { size: 20, family: "Inter", weight: 600 },
  body: { size: 15, family: "Inter", weight: 400 },
  small: { size: 13, family: "Inter", weight: 400 },
  mono: { size: 14, family: "JetBrains Mono", weight: 500 },
} as const;

export const radius = {
  card: 12,
  control: 8,
} as const;

export const spacing = [8, 16, 24, 32, 48, 64] as const;

export const hoverGlow = "0 1px 2px rgba(0, 0, 0, 0.35)";
