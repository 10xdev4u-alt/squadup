import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Hero from "@/components/landing/hero";

describe("landing hero", () => {
  it("renders the headline, subheadline, and both CTAs", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", {
        name: /find your squad\. build something real/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/auth"
    );
    expect(
      screen.getByRole("link", { name: /see how it works/i })
    ).toHaveAttribute("href", "#how-it-works");
  });

  it("shows a product mock with a sample match", () => {
    render(<Hero />);
    expect(screen.getByLabelText(/product mock/i)).toBeInTheDocument();
    expect(screen.getByText("Aarav Iyer")).toBeInTheDocument();
  });
});
