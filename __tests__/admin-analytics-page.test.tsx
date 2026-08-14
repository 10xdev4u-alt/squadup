import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminAnalyticsPage from "@/pages/admin/analytics";
import type { AdminAnalytics } from "@/lib/api/analytics";
import type { AdminTeamRow } from "@/lib/api/teams";
import type { MentorTicket } from "@/types/squadup";

const fetchAdminAnalyticsMock = vi.fn();
const getClientMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    analytics: { fetchAdminAnalytics: fetchAdminAnalyticsMock },
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

function teamRow(overrides: Partial<AdminTeamRow> = {}): AdminTeamRow {
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

function ticket(overrides: Partial<MentorTicket> = {}): MentorTicket {
  return {
    id: "tk1",
    team: "t1",
    title: "Help with AWS",
    status: "open",
    assignedMentor: null,
    createdAt: "2026-08-01 00:00:00.000Z",
    ...overrides,
  };
}

function makeData(overrides: Partial<AdminAnalytics> = {}): AdminAnalytics {
  return {
    teams: [
      teamRow(),
      teamRow({ id: "t2", name: "Beta Builders", domain: "Hardware" }),
    ],
    tasks: [
      {
        id: "a",
        team: "t1",
        title: "A",
        description: "",
        status: "idea",
        assignedTo: null,
        dueDate: null,
        priority: "medium",
      },
      {
        id: "b",
        team: "t1",
        title: "B",
        description: "",
        status: "idea",
        assignedTo: null,
        dueDate: null,
        priority: "medium",
      },
    ],
    resources: [
      {
        id: "r",
        team: "t2",
        url: "https://figma.com/x",
        title: "R",
        type: "figma",
        embeddable: true,
        uploadedBy: "u1",
        createdAt: "2026-08-01 00:00:00.000Z",
      },
    ],
    tickets: [
      ticket({ id: "a", status: "open" }),
      ticket({ id: "b", status: "in_progress" }),
    ],
    ...overrides,
  };
}

beforeEach(() => {
  fetchAdminAnalyticsMock.mockReset();
  getClientMock.mockReset();
  replaceMock.mockReset();
});

describe("admin analytics — /admin/analytics", () => {
  it("redirects non-admins away from the area", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: false } },
    });
    fetchAdminAnalyticsMock.mockResolvedValue(makeData());

    render(<AdminAnalyticsPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/");
    });
  });

  it("renders domain, activity, and ticket volume views from aggregates", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: true } },
    });
    fetchAdminAnalyticsMock.mockResolvedValue(makeData());

    render(<AdminAnalyticsPage />);

    expect(
      await screen.findByRole("heading", { name: /analytics/i })
    ).toBeInTheDocument();
    // Domains — Software appears twice in the fixture.
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    // Activity leaderboard.
    expect(screen.getByText("Alpha Force")).toBeInTheDocument();
    expect(screen.getByText("Beta Builders")).toBeInTheDocument();
    // Ticket volume — total is 2.
    expect(screen.getByText("total tickets")).toBeInTheDocument();
  });

  it("shows an empty state when there is no data", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u1", admin: true } },
    });
    fetchAdminAnalyticsMock.mockResolvedValue({
      teams: [],
      tasks: [],
      resources: [],
      tickets: [],
    });

    render(<AdminAnalyticsPage />);

    expect(await screen.findByText(/no data/i)).toBeInTheDocument();
  });
});
