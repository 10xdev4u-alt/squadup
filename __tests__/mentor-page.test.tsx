import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MentorInboxPage from "@/pages/mentor";

const fetchMentorInboxMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    tickets: { fetchMentorInbox: fetchMentorInboxMock },
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
  useRouter: () => ({ query: {} }),
}));

const inboxTicket = {
  id: "tk1",
  team: "t1",
  title: "Help with PPT",
  status: "open",
  assignedMentor: null,
  createdAt: "2026-08-14T08:00:00.000Z",
};

beforeEach(() => {
  fetchMentorInboxMock.mockReset();
});

describe("mentor inbox — /mentor", () => {
  it("lists open tickets across teams with team context links", async () => {
    fetchMentorInboxMock.mockResolvedValue({
      items: [inboxTicket],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      perPage: 100,
    });

    render(<MentorInboxPage />);

    expect(await screen.findByText("Help with PPT")).toBeInTheDocument();
    const boardLink = await screen.findByRole("link", {
      name: /open team board/i,
    });
    expect(boardLink).toHaveAttribute("href", "/team/t1/board");
  });

  it("links each ticket into its thread", async () => {
    fetchMentorInboxMock.mockResolvedValue({
      items: [inboxTicket],
      totalItems: 1,
      totalPages: 1,
      page: 1,
      perPage: 100,
    });

    render(<MentorInboxPage />);

    expect(
      await screen.findByRole("link", { name: /view thread/i })
    ).toHaveAttribute("href", "/team/t1/tickets/tk1");
  });

  it("shows an empty state when the queue is clear", async () => {
    fetchMentorInboxMock.mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 1,
      page: 1,
      perPage: 100,
    });

    render(<MentorInboxPage />);

    expect(await screen.findByText(/no open tickets/i)).toBeInTheDocument();
  });
});
