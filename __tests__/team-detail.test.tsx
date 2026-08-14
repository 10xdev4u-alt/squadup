import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamDetailPage from "@/pages/teams/[id]";
import Layout from "@/components/Layout";
import type { TeamDetail } from "@/lib/api/teams";

const fetchTeamDetailMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: { fetchTeamDetail: fetchTeamDetailMock },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
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
    rolesNeeded: ["Developer", "Designer"],
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
    ...overrides,
  };
}

describe("Team detail page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchTeamDetailMock.mockResolvedValue(makeDetail());
  });

  it("renders the team's statement, roles, leader and members", async () => {
    render(<TeamDetailPage />);

    await waitFor(() =>
      expect(screen.getByText("Navigators")).toBeInTheDocument()
    );
    expect(fetchTeamDetailMock).toHaveBeenCalledWith("t1");
    expect(screen.getByText("Smart campus navigation")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
    expect(screen.getByText("Arjun Patel")).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
  });

  it("shows a fallback when the team has no problem statement", async () => {
    fetchTeamDetailMock.mockResolvedValue(
      makeDetail({ problemStatement: null })
    );

    render(<TeamDetailPage />);

    await waitFor(() =>
      expect(screen.getByText("Navigators")).toBeInTheDocument()
    );
    expect(screen.getByText(/no problem statement/i)).toBeInTheDocument();
  });
});

describe("Layout navigation", () => {
  it("links to the team directory", () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>
    );

    expect(screen.getByRole("link", { name: /browse teams/i })).toHaveAttribute(
      "href",
      "/teams"
    );
  });
});
