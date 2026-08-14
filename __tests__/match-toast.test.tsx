import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MatchToast from "@/components/match-toast";
import { useMatchRealtime } from "@/lib/use-match-realtime";
import type { MatchEvent } from "@/lib/api/realtime";

const subscribeMatchesMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    realtime: { subscribeMatches: subscribeMatchesMock },
  }),
}));

vi.mock("@/lib/api/client", () => ({
  getClient: () => getClientMock(),
}));

const MATCH: MatchEvent = {
  id: "m1",
  userA: "u-me",
  userB: "u-other",
  partnerName: "Priya Sharma",
};

describe("MatchToast", () => {
  it("renders nothing when there is no match", () => {
    const { container } = render(
      <MatchToast match={null} onDismiss={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("announces the match with the partner name in a live region", () => {
    render(<MatchToast match={MATCH} onDismiss={() => {}} />);

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText(/it's a match/i)).toBeInTheDocument();
    expect(screen.getByText(/priya sharma/i)).toBeInTheDocument();
  });

  it("dismisses from the close button", async () => {
    const onDismiss = vi.fn();
    render(<MatchToast match={MATCH} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(onDismiss).toHaveBeenCalledOnce();
  });
});

describe("useMatchRealtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u-me" }, isValid: true },
    });
    subscribeMatchesMock.mockResolvedValue(async () => {});
  });

  it("subscribes with my user id and surfaces a match event", async () => {
    const { result } = renderHook(() => useMatchRealtime());
    await waitFor(() => expect(subscribeMatchesMock).toHaveBeenCalled());

    const call = subscribeMatchesMock.mock.calls[0] ?? [];
    const meId = call[0] as string;
    const callback = call[1] as (event: MatchEvent) => void;
    expect(meId).toBe("u-me");

    await act(async () => {
      callback(MATCH);
    });

    expect(result.current.match?.partnerName).toBe("Priya Sharma");

    act(() => result.current.dismiss());
    expect(result.current.match).toBeNull();
  });

  it("unsubscribes on unmount", async () => {
    const stop = vi.fn(async () => {});
    subscribeMatchesMock.mockResolvedValue(stop);

    const { unmount } = renderHook(() => useMatchRealtime());
    await waitFor(() => expect(subscribeMatchesMock).toHaveBeenCalled());

    unmount();

    expect(stop).toHaveBeenCalledOnce();
  });
});
