import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/pages/index";

describe("home page", () => {
  it("renders the SquadUp tagline", () => {
    render(<Home />);
    expect(
      screen.getByText("Find Your Squad. Build Something Real.")
    ).toBeInTheDocument();
  });
});
