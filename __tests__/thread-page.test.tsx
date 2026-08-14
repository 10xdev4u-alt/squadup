import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ThreadPage from "@/pages/matches/[id]";
import type { MatchMessage } from "@/types/squadup";

const fetchMessagesMock = vi.fn();
const sendMessageMock = vi.fn();
const subscribeMessagesMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    matches: {
      fetchMessages: fetchMessagesMock,
      sendMessage: sendMessageMock,
      subscribeMessages: subscribeMessagesMock,
    },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "m1" } }),
}));

function makeMessage(overrides: Partial<MatchMessage> = {}): MatchMessage {
  return {
    id: "msg1",
    match: "m1",
    sender: "u-other",
    message: "Hey!",
    createdAt: "2026-08-14 10:00:00.000Z",
    ...overrides,
  };
}

describe("Match thread page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMessagesMock.mockResolvedValue([makeMessage()]);
    sendMessageMock.mockImplementation((_matchId: string, message: string) =>
      Promise.resolve(makeMessage({ id: "msg2", sender: "u-me", message }))
    );
    subscribeMessagesMock.mockResolvedValue(async () => {});
  });

  it("renders the existing messages", async () => {
    render(<ThreadPage />);

    await waitFor(() => expect(screen.getByText("Hey!")).toBeInTheDocument());
    expect(fetchMessagesMock).toHaveBeenCalledWith("m1");
  });

  it("appends realtime messages as they arrive", async () => {
    render(<ThreadPage />);
    await waitFor(() => expect(subscribeMessagesMock).toHaveBeenCalled());

    const call = subscribeMessagesMock.mock.calls[0] ?? [];
    const callback = call[1] as (message: MatchMessage) => void;

    await act(async () => {
      callback(
        makeMessage({ id: "live-1", sender: "u-other", message: "Live ping" })
      );
    });

    expect(screen.getByText("Live ping")).toBeInTheDocument();
  });

  it("sends a message, appends it and clears the input", async () => {
    render(<ThreadPage />);
    await waitFor(() => expect(screen.getByText("Hey!")).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/write a message/i);
    await userEvent.type(input, "Let's build!");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(sendMessageMock).toHaveBeenCalledWith("m1", "Let's build!")
    );
    await waitFor(() =>
      expect(screen.getByText("Let's build!")).toBeInTheDocument()
    );
    expect(input).toHaveValue("");
  });

  it("keeps the draft when sending fails", async () => {
    sendMessageMock.mockRejectedValue(
      new Error("Something went wrong on our end. Please try again.")
    );

    render(<ThreadPage />);
    await waitFor(() => expect(screen.getByText("Hey!")).toBeInTheDocument());

    const input = screen.getByPlaceholderText(/write a message/i);
    await userEvent.type(input, "This will fail");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/went wrong/i)
    );
    expect(input).toHaveValue("This will fail");
  });
});
