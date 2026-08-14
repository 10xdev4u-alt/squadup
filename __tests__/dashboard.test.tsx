import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamDashboardPage from "@/pages/team/[id]";
import type { TeamDetail } from "@/lib/api/teams";

const fetchTeamDetailMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: { fetchTeamDetail: fetchTeamDetailMock },
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

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "t1" } }),
}));

function makeDetail(overrides: Partial<TeamDetail> = {}): TeamDetail {
  return {
    id: "t1",
    name: "Navigators",
    status: "open",
    rolesNeeded: [],
    problemStatement: {
      id: "p1",
      title: "Smart campus navigation",
      domain: "Smart Cities",
    },
    leader: { id: "u-lead", name: "Arjun Patel" },
    members: [
      { id: "u-lead", name: "Arjun Patel" },
      { id: "u-dev", name: "Priya Sharma" },
    ],
    deadline: "2026-08-16T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  fetchTeamDetailMock.mockReset();
  getClientMock.mockReset();
});

describe("team dashboard — /team/[id]", () => {
  it("renders the team name, problem statement, and member roster", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());

    render(<TeamDashboardPage />);

    expect(
      await screen.findByRole("heading", { name: "Navigators" })
    ).toBeInTheDocument();
    expect(screen.getByText("Smart campus navigation")).toBeInTheDocument();
    expect(screen.getByText("Arjun Patel")).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
  });

  it("renders the countdown to the deadline", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());

    render(<TeamDashboardPage />);

    await screen.findByRole("heading", { name: "Navigators" });
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getByLabelText("Time until deadline")).toBeInTheDocument();
  });

  it("links to the kanban board and resource hub entry points", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());

    render(<TeamDashboardPage />);

    const board = await screen.findByRole("link", { name: /kanban/i });
    expect(board).toHaveAttribute("href", "/team/t1/board");
    const resources = screen.getByRole("link", { name: /resource/i });
    expect(resources).toHaveAttribute("href", "/team/t1/resources");
  });

  it("shows an error when the team cannot be loaded", async () => {
    fetchTeamDetailMock.mockRejectedValue(new Error("Team not found"));

    render(<TeamDashboardPage />);

    expect(
      await screen.findByText(/couldn.t load this team/i)
    ).toBeInTheDocument();
  });
});
