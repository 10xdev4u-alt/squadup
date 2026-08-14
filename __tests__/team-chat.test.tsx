import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamChat from "@/components/team-chat";
import type { TeamMessage } from "@/types/squadup";

const fetchMessagesMock = vi.fn();
const sendMessageMock = vi.fn();
const subscribeMessagesMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teamMessages: {
      fetchMessages: fetchMessagesMock,
      sendMessage: sendMessageMock,
      subscribeMessages: subscribeMessagesMock,
    },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

function makeMessage(overrides: Partial<TeamMessage> = {}): TeamMessage {
  return {
    id: "m1",
    team: "t1",
    sender: "u-lead",
    message: "Shipping the deck today",
    createdAt: "2026-08-14 12:00:00.000Z",
    ...overrides,
  };
}

describe("team chat — workspace collaboration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMessagesMock.mockResolvedValue([makeMessage()]);
    subscribeMessagesMock.mockResolvedValue(async () => {});
  });

  it("renders the message history", async () => {
    render(<TeamChat teamId="t1" />);

    await waitFor(() =>
      expect(screen.getByText("Shipping the deck today")).toBeInTheDocument()
    );
    expect(fetchMessagesMock).toHaveBeenCalledWith("t1");
  });

  it("sends a message on submit", async () => {
    sendMessageMock.mockResolvedValue(
      makeMessage({ id: "m2", message: "Lets split the work" })
    );
    render(<TeamChat teamId="t1" />);

    const input = screen.getByLabelText(/message/i);
    await userEvent.type(input, "Lets split the work");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith("t1", "Lets split the work")
    );
  });

  it("dedupes the realtime echo of a just-sent message", async () => {
    sendMessageMock.mockResolvedValue(
      makeMessage({ id: "m2", message: "On it" })
    );
    render(<TeamChat teamId="t1" />);
    await waitFor(() => expect(subscribeMessagesMock).toHaveBeenCalled());

    const call = subscribeMessagesMock.mock.calls[0] ?? [];
    const callback = call[1] as (message: TeamMessage) => void;

    await act(async () => {
      // realtime echo of the optimistic send
      callback(makeMessage({ id: "m2", message: "On it" }));
      // a genuine new message from a teammate
      callback(makeMessage({ id: "m3", sender: "u-other", message: "hi" }));
    });

    expect(screen.getAllByText("On it")).toHaveLength(1);
    expect(screen.getByText("hi")).toBeInTheDocument();
  });
});
