import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MatchThread from "@/pages/matches/[id]";

const fetchMessagesMock = vi.fn();
const fetchMatchMock = vi.fn();
const sendMessageMock = vi.fn();
const subscribeMessagesMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    matches: {
      fetchMessages: fetchMessagesMock,
      fetchMatch: fetchMatchMock,
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

vi.mock("@/lib/api/client", () => ({
  getClient: () => ({ authStore: { record: { id: "me" } } }),
}));

vi.mock("@/lib/api/session", () => ({
  getCurrentUser: () => ({ id: "me" }),
}));

function makeMessage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "msg-1",
    match: "m1",
    sender: "me",
    message: "Let's build!",
    createdAt: "2026-08-14 10:00:00.000Z",
    ...overrides,
  };
}

describe("Match thread", () => {
  let realtimeCallback: ((msg: Record<string, unknown>) => void) | null;

  beforeEach(() => {
    vi.clearAllMocks();
    realtimeCallback = null;
    fetchMessagesMock.mockResolvedValue([]);
    fetchMatchMock.mockResolvedValue({
      id: "m1",
      partnerId: "u-other",
      partnerName: "Priya Sharma",
      createdAt: "2026-08-14 12:00:00.000Z",
    });
    sendMessageMock.mockResolvedValue(makeMessage());
    subscribeMessagesMock.mockImplementation(
      (_matchId: string, cb: (msg: Record<string, unknown>) => void) => {
        realtimeCallback = cb;
        return Promise.resolve(() => Promise.resolve());
      }
    );
  });

  it("does not render the same message twice when realtime replays a just-sent message", async () => {
    render(<MatchThread />);

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: /message/i })
      ).toBeInTheDocument()
    );

    fireEvent.change(screen.getByRole("textbox", { name: /message/i }), {
      target: { value: "Let's build!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // The send response is appended optimistically...
    await waitFor(() =>
      expect(screen.getByText("Let's build!")).toBeInTheDocument()
    );
    // ...then realtime delivers the same record (own-message echo).
    act(() => {
      realtimeCallback?.(makeMessage());
    });

    expect(screen.getAllByText("Let's build!")).toHaveLength(1);
  });

  it("appends a realtime message from the partner", async () => {
    render(<MatchThread />);

    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: /message/i })
      ).toBeInTheDocument()
    );

    act(() => {
      realtimeCallback?.(
        makeMessage({ id: "msg-2", sender: "partner", message: "Hello!" })
      );
    });

    await waitFor(() => expect(screen.getByText("Hello!")).toBeInTheDocument());
    expect(screen.getAllByText("Hello!")).toHaveLength(1);
  });
});
