import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamNavLink from "@/components/team-nav-link";

const fetchMyTeamMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({ teams: { fetchMyTeam: fetchMyTeamMock } }),
}));

let authed = true;

vi.mock("@/lib/api/client", () => ({
  getClient: () => ({ authStore: { record: { id: "u-me" }, isValid: authed } }),
}));

vi.mock("@/lib/api/session", () => ({
  isAuthenticated: () => authed,
}));

describe("TeamNavLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authed = true;
    fetchMyTeamMock.mockResolvedValue({
      id: "t1",
      name: "Navigators",
      problemStatement: "p1",
      status: "open",
      rolesNeeded: ["Developer"],
    });
  });

  it("links to the workspace when the user is in a team", async () => {
    render(<TeamNavLink />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "My Team" })).toHaveAttribute(
        "href",
        "/team/t1"
      )
    );
  });

  it("renders nothing when the user is not in a team", async () => {
    fetchMyTeamMock.mockResolvedValue(null);

    render(<TeamNavLink />);

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "My Team" })
      ).not.toBeInTheDocument()
    );
  });

  it("renders nothing when signed out", async () => {
    authed = false;

    render(<TeamNavLink />);

    await waitFor(() =>
      expect(
        screen.queryByRole("link", { name: "My Team" })
      ).not.toBeInTheDocument()
    );
    expect(fetchMyTeamMock).not.toHaveBeenCalled();
  });
});
