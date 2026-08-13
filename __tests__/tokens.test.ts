import { describe, expect, it } from "vitest";
import { ctaGradient, palette, swipe } from "@/lib/tokens";

describe("design tokens", () => {
  it("exposes the full §6 palette with exact hex values", () => {
    expect(palette).toEqual({
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
    });
  });

  it("defines the §6 CTA gradient and swipe colors", () => {
    expect(ctaGradient).toBe(
      "linear-gradient(135deg, #6C5CE7 0%, #00E5FF 100%)"
    );
    expect(swipe.like).toBe("#22C55E");
    expect(swipe.skip).toBe("#EF4444");
  });
});
