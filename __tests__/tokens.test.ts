import { describe, expect, it } from "vitest";
import { ctaGradient, palette, swipe } from "@/lib/tokens";

describe("design tokens", () => {
  it("exposes the full §6 palette with exact hex values", () => {
    expect(palette).toEqual({
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
    });
  });

  it("defines the §6 CTA gradient and swipe colors", () => {
    expect(ctaGradient).toBe(
      "linear-gradient(180deg, #3ECF8E 0%, #2EB67E 100%)"
    );
    expect(swipe.like).toBe("#3ECF8E");
    expect(swipe.skip).toBe("#F05252");
  });
});
