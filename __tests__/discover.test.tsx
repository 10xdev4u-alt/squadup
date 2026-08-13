import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Discover from "@/pages/discover";

describe("discover page", () => {
  it("renders the empty-state placeholder when there is no deck", () => {
    render(<Discover />);
    expect(
      screen.getByText("Your match deck will appear here.")
    ).toBeInTheDocument();
  });
});
