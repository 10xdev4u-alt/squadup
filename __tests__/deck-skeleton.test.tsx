import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DeckSkeleton from "@/components/deck-skeleton";

describe("DeckSkeleton", () => {
  it("renders a skeleton card", () => {
    const { container } = render(<DeckSkeleton />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders three skeleton cards by default", () => {
    const { container } = render(<DeckSkeleton />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(3);
  });

  it("accepts a custom card count", () => {
    const { container } = render(<DeckSkeleton count={5} />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(5);
  });
});
