import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TicketThreadPage from "@/pages/team/[id]/tickets/[ticketId]";

const fetchTicketMock = vi.fn();
const fetchTicketMessagesMock = vi.fn();
const createTicketMessageMock = vi.fn();
const updateTicketStatusMock = vi.fn();
const subscribeTicketMessagesMock = vi.fn();
const getClientMock = vi.fn(
  (): {
    authStore: { isValid: boolean; record: Record<string, unknown> | null };
  } => ({
    authStore: { isValid: true, record: { id: "u-me" } },
  })
);

vi.mock("@/lib/api", () => ({
  api: () => ({
    tickets: {
      fetchTicket: fetchTicketMock,
      fetchTicketMessages: fetchTicketMessagesMock,
      createTicketMessage: createTicketMessageMock,
      updateTicketStatus: updateTicketStatusMock,
      subscribeTicketMessages: subscribeTicketMessagesMock,
    },
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
  useRouter: () => ({ query: { id: "t1", ticketId: "tk1" } }),
}));

const ticket = {
  id: "tk1",
  team: "t1",
  title: "Help with PPT",
  status: "open",
  assignedMentor: null,
  createdAt: "2026-08-14T08:00:00.000Z",
};

const messages = [
  {
    id: "m1",
    ticket: "tk1",
    sender: "u-a",
    senderName: "Arjun Patel",
    message: "Can you review our deck?",
    attachment: null,
    createdAt: "2026-08-14T08:00:00.000Z",
  },
  {
    id: "m2",
    ticket: "tk1",
    sender: "u-mentor",
    senderName: "Prof. Rao",
    message: "Sure — share your board link.",
    attachment: null,
    createdAt: "2026-08-14T08:05:00.000Z",
  },
];

beforeEach(() => {
  getClientMock.mockReset();
  getClientMock.mockReturnValue({
    authStore: { isValid: true, record: { id: "u-me" } },
  });
  fetchTicketMock.mockReset();
  fetchTicketMessagesMock.mockReset();
  createTicketMessageMock.mockReset();
  updateTicketStatusMock.mockReset();
  subscribeTicketMessagesMock.mockReset();
  fetchTicketMock.mockResolvedValue(ticket);
  fetchTicketMessagesMock.mockResolvedValue(messages);
  subscribeTicketMessagesMock.mockResolvedValue(async () => {});
});

describe("ticket thread — /team/[id]/tickets/[ticketId]", () => {
  it("renders the thread oldest-first with sender names", async () => {
    render(<TicketThreadPage />);

    expect(
      await screen.findByRole("heading", { name: "Help with PPT" })
    ).toBeInTheDocument();
    expect(screen.getByText("Arjun Patel")).toBeInTheDocument();
    expect(screen.getByText("Prof. Rao")).toBeInTheDocument();
    expect(screen.getByText("Can you review our deck?")).toBeInTheDocument();
  });

  it("posts a reply through the form", async () => {
    createTicketMessageMock.mockResolvedValue({
      id: "m3",
      ticket: "tk1",
      sender: "u-me",
      senderName: "Me",
      message: "Here it is: /team/t1/board",
      attachment: null,
      createdAt: "2026-08-14T08:10:00.000Z",
    });

    render(<TicketThreadPage />);
    await screen.findByRole("heading", { name: "Help with PPT" });

    await userEvent.type(
      screen.getByLabelText(/reply/i),
      "Here it is: /team/t1/board"
    );
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(createTicketMessageMock).toHaveBeenCalledWith(
        "tk1",
        "Here it is: /team/t1/board"
      )
    );
    expect(
      await screen.findByText("Here it is: /team/t1/board")
    ).toBeInTheDocument();
  });

  it("appends a message pushed over the subscription", async () => {
    render(<TicketThreadPage />);
    await screen.findByText("Can you review our deck?");

    const cb = subscribeTicketMessagesMock.mock.calls[0]?.[1] as (message: {
      id: string;
      ticket: string;
      sender: string;
      senderName: string;
      message: string;
      attachment: null;
      createdAt: string;
    }) => void;
    cb({
      id: "m4",
      ticket: "tk1",
      sender: "u-mentor",
      senderName: "Prof. Rao",
      message: "Looks good — ship it!",
      attachment: null,
      createdAt: "2026-08-14T08:20:00.000Z",
    });

    expect(
      await screen.findByText("Looks good — ship it!")
    ).toBeInTheDocument();
  });

  it("lets mentors move the ticket to in progress", async () => {
    getClientMock.mockReturnValue({
      authStore: {
        isValid: true,
        record: { id: "u-mentor", mentor: true },
      },
    });

    render(<TicketThreadPage />);
    await screen.findByRole("heading", { name: "Help with PPT" });

    await userEvent.click(
      screen.getByRole("button", { name: /mark in progress/i })
    );

    await waitFor(() =>
      expect(updateTicketStatusMock).toHaveBeenCalledWith("tk1", "in_progress")
    );
  });

  it("hides status controls from non-mentors", async () => {
    render(<TicketThreadPage />);
    await screen.findByRole("heading", { name: "Help with PPT" });

    expect(
      screen.queryByRole("button", { name: /mark in progress/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });
});
