export const palette = {
  background: "#0A0A0F",
  surface: "#14141C",
  elevated: "#1C1C27",
  border: "#2A2A38",
  primary: "#6C5CE7",
  secondary: "#00E5FF",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  textPrimary: "#F5F5F7",
  textSecondary: "#9CA3AF",
} as const;

export const paletteLabels = {
  background: "Deep Space",
  surface: "Slate Panel",
  elevated: "Raised Panel",
  border: "Ghost Line",
  primary: "Electric Indigo",
  secondary: "Cyber Cyan",
  success: "Signal Green",
  warning: "Amber Alert",
  danger: "Critical Red",
  textPrimary: "Off White",
  textSecondary: "Muted Grey",
} as const;

export const ctaGradient = "linear-gradient(135deg, #6C5CE7 0%, #00E5FF 100%)";

export const swipe = {
  like: "#22C55E",
  skip: "#EF4444",
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
  card: 20,
  control: 12,
} as const;

export const spacing = [8, 16, 24, 32, 48, 64] as const;

export const hoverGlow = "0 0 20px rgba(108, 92, 231, 0.15)";
export const softShadow = "0 4px 24px rgba(0, 0, 0, 0.35)";
export const floatShadow = "0 12px 40px rgba(0, 0, 0, 0.45)";
