import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        elevated: "var(--color-elevated)",
        border: "var(--color-border)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        foreground: "var(--color-text-primary)",
        muted: "var(--color-muted)",
        // shadcn/ui semantic aliases, all mapping to the §6 tokens above
        "primary-foreground": "var(--color-primary-foreground)",
        card: "var(--color-surface)",
        "card-foreground": "var(--color-text-primary)",
        ring: "var(--color-primary)",
        input: "var(--color-border)",
        destructive: "var(--color-danger)",
        "destructive-foreground": "var(--color-text-primary)",
        "secondary-foreground": "var(--color-secondary-foreground)",
        "muted-foreground": "var(--color-text-secondary)",
        accent: "var(--color-primary)",
        "accent-foreground": "var(--color-primary-foreground)",
        popover: "var(--color-elevated)",
        "popover-foreground": "var(--color-text-primary)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        float: "var(--shadow-float)",
      },
    },
  },
  plugins: [animate],
};

export default config;
