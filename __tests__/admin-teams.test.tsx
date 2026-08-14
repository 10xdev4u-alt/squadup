import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminTeamsPage from "@/pages/admin/teams";
import type { AdminTeamRow } from "@/lib/api/teams";

const fetchAdminTeamsMock = vi.fn();
const getClientMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: { fetchAdminTeams: fetchAdminTeamsMock },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/api/client", () => ({
  getClient: () => getClientMock(),
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
  // Mirrors the real hook: admin reads the mocked session, non-admins bounce.
  useRequireAdmin: () => {
    const client = getClientMock();
    const record = client?.authStore?.record as { admin?: boolean } | undefined;
    const isAdmin = Boolean(record && record.admin === true);
    if (!isAdmin) {
      replaceMock("/");
    }
    return isAdmin;
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

function makeRow(overrides: Partial<AdminTeamRow> = {}): AdminTeamRow {
  return {
    id: "t1",
    name: "Alpha Force",
    status: "open",
    domain: "Software",
    memberCount: 2,
    memberNames: ["Arjun Patel", "Ana Souza"],
    deadline: "2026-09-01 00:00:00.000Z",
    createdAt: "2026-08-01 00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  fetchAdminTeamsMock.mockReset();
  getClientMock.mockReset();
  replaceMock.mockReset();
});

describe("admin teams — /admin/teams", () => {
  it("redirects non-admins away from the area", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: false } },
    });
    fetchAdminTeamsMock.mockResolvedValue({
      page: 1,
      perPage: 50,
      totalItems: 0,
      totalPages: 0,
      items: [],
    });

    render(<AdminTeamsPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/");
    });
  });

  it("renders the team table for an admin", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: true } },
    });
    fetchAdminTeamsMock.mockResolvedValue({
      page: 1,
      perPage: 50,
      totalItems: 2,
      totalPages: 1,
      items: [
        makeRow(),
        makeRow({
          id: "t2",
          name: "Beta Builders",
          status: "closed",
          domain: "Hardware",
          memberCount: 1,
        }),
      ],
    });

    render(<AdminTeamsPage />);

    expect(
      await screen.findByRole("heading", { name: /teams/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Alpha Force")).toBeInTheDocument();
    expect(screen.getByText("Beta Builders")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
  });

  it("filters by status", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: true } },
    });
    fetchAdminTeamsMock.mockResolvedValue({
      page: 1,
      perPage: 50,
      totalItems: 2,
      totalPages: 1,
      items: [
        makeRow(),
        makeRow({
          id: "t2",
          name: "Beta Builders",
          status: "closed",
          domain: "Hardware",
          memberCount: 1,
        }),
      ],
    });

    render(<AdminTeamsPage />);
    await screen.findByText("Alpha Force");

    const statusFilter = screen.getByLabelText(/status/i);
    // The label sits on the select — pick it by role + option text.
    const select = screen.getByRole("combobox", { name: /status/i });
    // Simulate choosing "Closed" (react-testing-library + native select).
    const { userEvent } = await import("@testing-library/user-event");
    await userEvent.selectOptions(select, "closed");

    expect(screen.getByText("Beta Builders")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Force")).not.toBeInTheDocument();
  });

  it("searches by team name", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: true } },
    });
    fetchAdminTeamsMock.mockResolvedValue({
      page: 1,
      perPage: 50,
      totalItems: 2,
      totalPages: 1,
      items: [
        makeRow(),
        makeRow({
          id: "t2",
          name: "Beta Builders",
          status: "closed",
          domain: "Hardware",
          memberCount: 1,
        }),
      ],
    });

    render(<AdminTeamsPage />);
    await screen.findByText("Alpha Force");

    const { userEvent } = await import("@testing-library/user-event");
    await userEvent.type(screen.getByLabelText(/search/i), "beta");

    expect(screen.getByText("Beta Builders")).toBeInTheDocument();
    expect(screen.queryByText("Alpha Force")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no teams", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: true } },
    });
    fetchAdminTeamsMock.mockResolvedValue({
      page: 1,
      perPage: 50,
      totalItems: 0,
      totalPages: 0,
      items: [],
    });

    render(<AdminTeamsPage />);

    expect(await screen.findByText(/no teams/i)).toBeInTheDocument();
  });
});
