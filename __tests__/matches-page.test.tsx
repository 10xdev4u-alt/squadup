import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MatchesPage from "@/pages/matches";
import type { MatchCard } from "@/lib/api/matches";

const fetchMatchesMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    matches: { fetchMatches: fetchMatchesMock },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

function makeCard(overrides: Partial<MatchCard> = {}): MatchCard {
  return {
    id: "m1",
    partnerId: "u-other",
    partnerName: "Priya Sharma",
    createdAt: "2026-08-14 10:00:00.000Z",
    ...overrides,
  };
}

describe("Matches page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMatchesMock.mockResolvedValue([makeCard()]);
  });

  it("renders each match partner in the inbox", async () => {
    fetchMatchesMock.mockResolvedValue([
      makeCard({ id: "m1", partnerName: "Priya Sharma" }),
      makeCard({ id: "m2", partnerName: "Arjun Patel" }),
    ]);

    render(<MatchesPage />);

    await waitFor(() =>
      expect(screen.getByText("Priya Sharma")).toBeInTheDocument()
    );
    expect(screen.getByText("Arjun Patel")).toBeInTheDocument();
  });

  it("links each match into its thread", async () => {
    render(<MatchesPage />);

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /priya sharma/i })
      ).toHaveAttribute("href", "/matches/m1")
    );
  });

  it("shows the empty state when there are no matches", async () => {
    fetchMatchesMock.mockResolvedValue([]);

    render(<MatchesPage />);

    await waitFor(() =>
      expect(screen.getByText(/no matches yet/i)).toBeInTheDocument()
    );
  });
});
