import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Discover from "@/pages/discover";
import type { DeckCandidate } from "@/lib/matching/deck";

const fetchDeckMock = vi.fn();
const recordSwipeMock = vi.fn();
const subscribeMatchesMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    swipes: {
      fetchDeck: fetchDeckMock,
      recordSwipe: recordSwipeMock,
    },
    realtime: { subscribeMatches: subscribeMatchesMock },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/api/client", () => ({
  getClient: () => getClientMock(),
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

function makeCandidate(overrides: Partial<DeckCandidate> = {}): DeckCandidate {
  return {
    id: "u-1",
    name: "Priya Sharma",
    avatar: null,
    bio: "Building for SIH.",
    skills: ["Frontend"],
    primaryRole: "Designer",
    lookingFor: "Backend",
    score: 10,
    ...overrides,
  };
}

describe("Discover page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u-me" }, isValid: true },
    });
    fetchDeckMock.mockResolvedValue([makeCandidate()]);
    subscribeMatchesMock.mockResolvedValue(async () => {});
  });

  it("shows the skeleton while the deck loads", () => {
    fetchDeckMock.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<Discover />);

    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(3);
  });

  it("renders the deck once loaded", async () => {
    render(<Discover />);

    await waitFor(() =>
      expect(screen.getByText("Priya Sharma")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /interested/i })
    ).toBeInTheDocument();
  });

  it("swiping records the action and advances the stack", async () => {
    fetchDeckMock.mockResolvedValue([
      makeCandidate({ id: "u-a", name: "First Person" }),
      makeCandidate({ id: "u-b", name: "Second Person" }),
    ]);
    recordSwipeMock.mockResolvedValue({ id: "s1" });

    render(<Discover />);
    await waitFor(() =>
      expect(screen.getByText("First Person")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /interested/i }));

    await waitFor(() =>
      expect(recordSwipeMock).toHaveBeenCalledWith({
        toUser: "u-a",
        direction: "right",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Second Person")).toBeInTheDocument()
    );
  });

  it("shows the empty state when the deck is exhausted", async () => {
    fetchDeckMock.mockResolvedValue([]);

    render(<Discover />);

    await waitFor(() =>
      expect(screen.getByText(/no squads to swipe/i)).toBeInTheDocument()
    );
  });

  it("announces a mutual match from a realtime event", async () => {
    render(<Discover />);
    await waitFor(() => expect(subscribeMatchesMock).toHaveBeenCalled());

    const call = subscribeMatchesMock.mock.calls[0] ?? [];
    const callback = call[1] as (event: unknown) => void;

    await act(async () => {
      callback({
        id: "m1",
        userA: "u-other",
        userB: "u-me",
        partnerName: "Arjun Patel",
      });
    });

    const region = screen.getByRole("status");
    expect(region).toHaveTextContent(/it's a match/i);
    expect(region).toHaveTextContent(/arjun patel/i);
  });
});
