import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FeatureGrid from "@/components/landing/feature-grid";
import HowItWorks from "@/components/landing/how-it-works";
import CtaBand from "@/components/landing/cta-band";

describe("landing feature grid", () => {
  it("renders all six features with headings", () => {
    render(<FeatureGrid />);
    expect(
      screen.getByRole("heading", { name: /everything you need to ship/i })
    ).toBeInTheDocument();
    for (const title of [
      "Swipe to match",
      "Form your team",
      "Team workspace",
      "Real-time chat",
      "Built-in kanban",
      "College-first",
    ]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });
});

describe("landing how-it-works", () => {
  it("renders the three-step flow", () => {
    render(<HowItWorks />);
    expect(
      screen.getByRole("heading", { name: /how it works/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Discover teammates")).toBeInTheDocument();
    expect(screen.getByText("Match and chat")).toBeInTheDocument();
    expect(screen.getByText("Build together")).toBeInTheDocument();
  });
});

describe("landing CTA band", () => {
  it("links signed-out visitors to auth", () => {
    render(<CtaBand />);
    expect(
      screen.getByRole("heading", { name: /ready to find your squad/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/auth"
    );
  });
});
