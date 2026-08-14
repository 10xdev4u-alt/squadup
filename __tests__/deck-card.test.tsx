import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeckCard from "@/components/deck-card";
import type { DeckCandidate } from "@/lib/matching/deck";

function makeCandidate(overrides: Partial<DeckCandidate> = {}): DeckCandidate {
  return {
    id: "u-1",
    name: "Priya Sharma",
    avatar: null,
    bio: "Building cool stuff for SIH 2026.",
    skills: ["Frontend", "UI/UX Design"],
    primaryRole: "Designer",
    lookingFor: "Backend",
    score: 25,
    ...overrides,
  };
}

describe("DeckCard", () => {
  it("renders the candidate's name, role, bio and skills", () => {
    render(<DeckCard candidate={makeCandidate()} onSwipe={() => {}} />);

    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
    expect(
      screen.getByText("Building cool stuff for SIH 2026.")
    ).toBeInTheDocument();
    expect(screen.getByText("Frontend")).toBeInTheDocument();
    expect(screen.getByText("UI/UX Design")).toBeInTheDocument();
  });

  it("renders the looking-for line when present", () => {
    render(<DeckCard candidate={makeCandidate()} onSwipe={() => {}} />);
    expect(screen.getByText(/looking for backend/i)).toBeInTheDocument();
  });

  it("fires onSwipe('left') from the skip button", async () => {
    const onSwipe = vi.fn();
    render(<DeckCard candidate={makeCandidate()} onSwipe={onSwipe} />);

    await userEvent.click(screen.getByRole("button", { name: /skip/i }));

    expect(onSwipe).toHaveBeenCalledWith("left");
  });

  it("fires onSwipe('right') from the interested button", async () => {
    const onSwipe = vi.fn();
    render(<DeckCard candidate={makeCandidate()} onSwipe={onSwipe} />);

    await userEvent.click(screen.getByRole("button", { name: /interested/i }));

    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("shows the directional glow for the swipe intent", () => {
    const { rerender } = render(
      <DeckCard candidate={makeCandidate()} intent="left" onSwipe={() => {}} />
    );
    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("data-intent", "left");
    expect(card.className).toContain("ring-danger");

    rerender(
      <DeckCard candidate={makeCandidate()} intent="right" onSwipe={() => {}} />
    );
    expect(card).toHaveAttribute("data-intent", "right");
    expect(card.className).toContain("ring-success");
  });

  it("renders initials as a fallback avatar when none is set", () => {
    render(
      <DeckCard
        candidate={makeCandidate({ avatar: null })}
        onSwipe={() => {}}
      />
    );
    expect(screen.getByText("PS")).toBeInTheDocument();
  });
});
