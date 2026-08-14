import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DeckSkeleton from "@/components/deck-skeleton";

describe("DeckSkeleton", () => {
  it("renders a single skeleton card matching the deck shape", () => {
    render(<DeckSkeleton />);
    expect(screen.getByTestId("deck-skeleton")).toBeInTheDocument();
  });

  it("marks the placeholder as decorative for screen readers", () => {
    const { container } = render(<DeckSkeleton />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(1);
  });
});
