import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Footer from "@/components/footer";

describe("site footer", () => {
  it("renders the wordmark and product links", () => {
    render(<Footer />);
    expect(screen.getByText("SquadUp")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover/i })).toHaveAttribute(
      "href",
      "/discover"
    );
    expect(screen.getByRole("link", { name: /browse teams/i })).toHaveAttribute(
      "href",
      "/teams"
    );
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/auth"
    );
  });
});
