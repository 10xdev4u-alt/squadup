import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDeck } from "@/lib/use-deck";
import type { DeckCandidate } from "@/lib/matching/deck";

const fetchDeckMock = vi.fn();
const recordSwipeMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    swipes: {
      fetchDeck: fetchDeckMock,
      recordSwipe: recordSwipeMock,
    },
  }),
}));

function makeCandidate(overrides: Partial<DeckCandidate> = {}): DeckCandidate {
  return {
    id: "u-1",
    name: "Priya Sharma",
    avatar: null,
    bio: "",
    skills: ["Frontend"],
    primaryRole: "Designer",
    lookingFor: "",
    score: 10,
    ...overrides,
  };
}

describe("useDeck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDeckMock.mockResolvedValue([makeCandidate()]);
  });

  it("loads the deck on mount", async () => {
    const { result } = renderHook(() => useDeck());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchDeckMock).toHaveBeenCalledOnce();
    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.empty).toBe(false);
  });

  it("swipes the top card and removes it from the stack", async () => {
    fetchDeckMock.mockResolvedValue([
      makeCandidate({ id: "u-a", name: "A" }),
      makeCandidate({ id: "u-b", name: "B" }),
    ]);
    recordSwipeMock.mockResolvedValue({ id: "s1" });

    const { result } = renderHook(() => useDeck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.swipe("right");
    });

    expect(recordSwipeMock).toHaveBeenCalledWith({
      toUser: "u-a",
      direction: "right",
    });
    expect(result.current.candidates.map((c) => c.id)).toEqual(["u-b"]);
  });

  it("becomes empty once every card is swiped", async () => {
    fetchDeckMock.mockResolvedValue([makeCandidate({ id: "u-a" })]);

    const { result } = renderHook(() => useDeck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.swipe("left");
    });

    expect(result.current.candidates).toEqual([]);
    expect(result.current.empty).toBe(true);
  });

  it("keeps the card when the swipe fails", async () => {
    recordSwipeMock.mockRejectedValue(
      new Error("Something went wrong on our end. Please try again.")
    );

    const { result } = renderHook(() => useDeck());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.swipe("right");
    });

    expect(result.current.candidates).toHaveLength(1);
    expect(result.current.error).toMatch(/went wrong/i);
  });
});
