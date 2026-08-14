import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/pages/index";

const fetchMyTeamMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({ teams: { fetchMyTeam: fetchMyTeamMock } }),
}));

let authed = false;

vi.mock("@/lib/api/client", () => ({
  getClient: () => ({ authStore: { record: { id: "u-me" }, isValid: authed } }),
}));

vi.mock("@/lib/api/session", () => ({
  isAuthenticated: () => authed,
  getCurrentUser: () => (authed ? { id: "u1", admin: false } : null),
}));

describe("home page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authed = false;
    fetchMyTeamMock.mockResolvedValue({
      id: "t1",
      name: "Navigators",
      problemStatement: "p1",
      status: "open",
      rolesNeeded: ["Developer"],
    });
  });

  it("renders the SquadUp tagline", () => {
    render(<Home />);
    expect(
      screen.getByText("Find Your Squad. Build Something Real.")
    ).toBeInTheDocument();
  });

  it("links a signed-out visitor to the auth page", () => {
    render(<Home />);
    const getStarted = screen.getAllByRole("link", { name: /get started/i });
    expect(getStarted.length).toBeGreaterThan(0);
    expect(getStarted[0]).toHaveAttribute("href", "/auth");
  });

  it("renders the landing sections for signed-out visitors", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /everything you need to ship/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /how it works/i })
    ).toBeInTheDocument();
  });

  it("links a solo user to discover", async () => {
    authed = true;
    fetchMyTeamMock.mockResolvedValue(null);

    render(<Home />);

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /find teammates/i })
      ).toHaveAttribute("href", "/discover")
    );
  });

  it("links a teamed-up user to their workspace", async () => {
    authed = true;
    fetchMyTeamMock.mockResolvedValue({
      id: "t1",
      name: "Navigators",
      problemStatement: "p1",
      status: "open",
      rolesNeeded: ["Developer"],
    });

    render(<Home />);

    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /open workspace/i })
      ).toHaveAttribute("href", "/team/t1")
    );
    expect(screen.getByText(/navigators/i)).toBeInTheDocument();
  });
});
