import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FormTeam from "@/pages/team/new";
import type { ProblemStatement } from "@/lib/api/teams";

const fetchProblemStatementsMock = vi.fn();
const createTeamMock = vi.fn();
const pushMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: {
      fetchProblemStatements: fetchProblemStatementsMock,
      createTeam: createTeamMock,
    },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

let queryMock: Record<string, string> = {};

vi.mock("next/router", () => ({
  useRouter: () => ({ push: pushMock, query: queryMock }),
}));

function makeStatement(
  overrides: Partial<ProblemStatement> = {}
): ProblemStatement {
  return {
    id: "p1",
    title: "Smart campus navigation",
    domain: "Smart Cities",
    ...overrides,
  };
}

describe("Form team page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchProblemStatementsMock.mockResolvedValue([makeStatement()]);
    createTeamMock.mockResolvedValue({
      id: "team-1",
      name: "Navigators",
      problemStatement: "p1",
      status: "open",
      rolesNeeded: ["Developer"],
    });
  });

  it("loads problem statements into the select", async () => {
    render(<FormTeam />);

    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /smart campus navigation/i })
      ).toBeInTheDocument()
    );
  });

  it("requires a team name", async () => {
    render(<FormTeam />);
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /smart campus navigation/i })
      ).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /create team/i }));

    expect(screen.getByText(/team name is required/i)).toBeInTheDocument();
    expect(createTeamMock).not.toHaveBeenCalled();
  });

  it("creates the team with the selected role and redirects", async () => {
    render(<FormTeam />);
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /smart campus navigation/i })
      ).toBeInTheDocument()
    );

    await userEvent.type(screen.getByLabelText(/team name/i), "Navigators");
    await userEvent.click(screen.getByRole("button", { name: /developer/i }));
    await userEvent.selectOptions(
      screen.getByLabelText(/problem statement/i),
      "p1"
    );
    await userEvent.click(screen.getByRole("button", { name: /create team/i }));

    await waitFor(() =>
      expect(createTeamMock).toHaveBeenCalledWith({
        name: "Navigators",
        problemStatement: "p1",
        rolesNeeded: ["Developer"],
      })
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/team/team-1"));
  });

  it("passes the match id through when formed from a chat", async () => {
    queryMock = { match: "match-9" };

    render(<FormTeam />);
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /smart campus navigation/i })
      ).toBeInTheDocument()
    );

    await userEvent.type(screen.getByLabelText(/team name/i), "AgriSense");
    await userEvent.click(screen.getByRole("button", { name: /developer/i }));
    await userEvent.click(screen.getByRole("button", { name: /create team/i }));

    await waitFor(() =>
      expect(createTeamMock).toHaveBeenCalledWith({
        name: "AgriSense",
        problemStatement: undefined,
        rolesNeeded: ["Developer"],
        match: "match-9",
      })
    );
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/team/team-1"));
  });

  it("surfaces the single-team guard error", async () => {
    createTeamMock.mockRejectedValue(new Error("You are already in a team."));

    render(<FormTeam />);
    await waitFor(() =>
      expect(
        screen.getByRole("option", { name: /smart campus navigation/i })
      ).toBeInTheDocument()
    );

    await userEvent.type(screen.getByLabelText(/team name/i), "Second Team");
    await userEvent.click(screen.getByRole("button", { name: /developer/i }));
    await userEvent.click(screen.getByRole("button", { name: /create team/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/already in a team/i)
    );
  });
});
