import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamTicketsPage from "@/pages/team/[id]/tickets";

const fetchTicketsMock = vi.fn();
const createTicketMock = vi.fn();
const updateTicketStatusMock = vi.fn();
const fetchTeamDetailMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    tickets: {
      fetchTickets: fetchTicketsMock,
      createTicket: createTicketMock,
      updateTicketStatus: updateTicketStatusMock,
    },
    teams: { fetchTeamDetail: fetchTeamDetailMock },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/api/client", () => ({
  getClient: () => ({ authStore: { isValid: true } }),
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "t1" } }),
}));

const baseTicket = {
  id: "tk1",
  team: "t1",
  title: "Help with PPT",
  status: "open",
  assignedMentor: null,
  createdAt: "2026-08-14T08:00:00.000Z",
};

beforeEach(() => {
  fetchTicketsMock.mockReset();
  createTicketMock.mockReset();
  updateTicketStatusMock.mockReset();
  fetchTeamDetailMock.mockReset();
  fetchTeamDetailMock.mockResolvedValue({
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
    chatLink: null,
  });
});

describe("team tickets — /team/[id]/tickets", () => {
  it("lists the team's tickets with status badges", async () => {
    fetchTicketsMock.mockResolvedValue({
      items: [baseTicket],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      perPage: 20,
    });

    render(<TeamTicketsPage />);

    expect(await screen.findByText("Help with PPT")).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("opens a new ticket through the form", async () => {
    fetchTicketsMock.mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 1,
      page: 1,
      perPage: 20,
    });
    createTicketMock.mockResolvedValue({
      ...baseTicket,
      id: "tk2",
      title: "Deck review",
    });

    render(<TeamTicketsPage />);
    await screen.findByRole("heading", { name: /mentor corner/i });

    await userEvent.type(
      screen.getByLabelText(/what do you need help with/i),
      "Deck review"
    );
    await userEvent.click(screen.getByRole("button", { name: /open ticket/i }));

    await waitFor(() =>
      expect(createTicketMock).toHaveBeenCalledWith({
        team: "t1",
        title: "Deck review",
      })
    );
  });

  it("renders an empty state when the team has no tickets", async () => {
    fetchTicketsMock.mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 1,
      page: 1,
      perPage: 20,
    });

    render(<TeamTicketsPage />);

    expect(await screen.findByText(/no tickets yet/i)).toBeInTheDocument();
  });
});
