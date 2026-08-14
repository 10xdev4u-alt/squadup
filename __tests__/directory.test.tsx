import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamDirectory from "@/pages/teams";
import type { TeamCard } from "@/types/squadup";

const fetchTeamCardsMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: { fetchTeamCards: fetchTeamCardsMock },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

function makeTeam(overrides: Partial<TeamCard> = {}): TeamCard {
  return {
    id: "t1",
    name: "Navigators",
    problemStatement: "p1",
    status: "open",
    rolesNeeded: ["Developer"],
    ...overrides,
  };
}

function makePage() {
  return {
    page: 1,
    perPage: 12,
    totalItems: 1,
    totalPages: 1,
    items: [makeTeam()],
  };
}

describe("Team directory page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTeamCardsMock.mockResolvedValue(makePage());
  });

  it("lists open teams with a link to each detail", async () => {
    render(<TeamDirectory />);

    await waitFor(() =>
      expect(screen.getByText("Navigators")).toBeInTheDocument()
    );
    expect(screen.getByRole("link", { name: /navigators/i })).toHaveAttribute(
      "href",
      "/teams/t1"
    );
  });

  it("fetches with the §10 open-teams guard by default", async () => {
    render(<TeamDirectory />);

    await waitFor(() => expect(fetchTeamCardsMock).toHaveBeenCalled());
    expect(fetchTeamCardsMock).toHaveBeenCalledWith(1, 12, undefined);
  });

  it("filters by role from the chips", async () => {
    render(<TeamDirectory />);
    await waitFor(() =>
      expect(screen.getByText("Navigators")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /designer/i }));

    await waitFor(() =>
      expect(fetchTeamCardsMock).toHaveBeenLastCalledWith(1, 12, {
        role: "Designer",
      })
    );
  });

  it("shows the empty state when no open teams match", async () => {
    fetchTeamCardsMock.mockResolvedValue({
      ...makePage(),
      items: [],
      totalItems: 0,
    });

    render(<TeamDirectory />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /no open teams/i })
      ).toBeInTheDocument()
    );
  });
});
