import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamDetailPage from "@/pages/teams/[id]";
import type { TeamDetail } from "@/lib/api/teams";
import type { JoinRequest } from "@/types/squadup";

const fetchTeamDetailMock = vi.fn();
const requestToJoinMock = vi.fn();
const fetchRequestsMock = vi.fn();
const decideRequestMock = vi.fn();
const subscribeMyRequestsMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: { fetchTeamDetail: fetchTeamDetailMock },
    joinRequests: {
      requestToJoin: requestToJoinMock,
      fetchRequests: fetchRequestsMock,
      decideRequest: decideRequestMock,
      subscribeMyRequests: subscribeMyRequestsMock,
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
  useRouter: () => ({ query: { id: "t1" } }),
}));

function makeDetail(overrides: Partial<TeamDetail> = {}): TeamDetail {
  return {
    id: "t1",
    name: "Navigators",
    status: "open",
    rolesNeeded: ["Developer", "Designer"],
    problemStatement: null,
    leader: { id: "u-lead", name: "Arjun Patel" },
    members: [{ id: "u-lead", name: "Arjun Patel" }],
    deadline: "2026-08-16T12:00:00.000Z",
    chatLink: null,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<JoinRequest> = {}): JoinRequest {
  return {
    id: "jr1",
    team: "t1",
    applicant: "u-other",
    roleAppliedFor: "Developer",
    message: "I build things.",
    status: "pending",
    createdAt: "2026-08-14 12:00:00.000Z",
    ...overrides,
  };
}

describe("Team detail page — join flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u-dev" }, isValid: true },
    });
    fetchTeamDetailMock.mockResolvedValue(makeDetail());
    subscribeMyRequestsMock.mockResolvedValue(async () => {});
  });

  it("shows the request form to a non-member", async () => {
    render(<TeamDetailPage />);

    await waitFor(() =>
      expect(screen.getByText("Navigators")).toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /request to join/i })
    ).toBeInTheDocument();
  });

  it("submits a request with role and note", async () => {
    requestToJoinMock.mockResolvedValue(makeRequest());
    fetchRequestsMock.mockResolvedValue([]);

    render(<TeamDetailPage />);
    await waitFor(() =>
      expect(screen.getByText("Navigators")).toBeInTheDocument()
    );

    await userEvent.click(
      screen.getByRole("button", { name: /request to join/i })
    );
    await userEvent.selectOptions(screen.getByLabelText(/role/i), "Developer");
    await userEvent.type(screen.getByLabelText(/note/i), "I build things.");
    await userEvent.click(
      screen.getByRole("button", { name: /send request/i })
    );

    await waitFor(() =>
      expect(requestToJoinMock).toHaveBeenCalledWith("t1", {
        roleAppliedFor: "Developer",
        message: "I build things.",
      })
    );
  });

  it("lets the leader see pending requests and accept them", async () => {
    getClientMock.mockReturnValue({
      authStore: { record: { id: "u-lead" }, isValid: true },
    });
    fetchRequestsMock.mockResolvedValue([makeRequest()]);
    decideRequestMock.mockResolvedValue(makeRequest({ status: "accepted" }));

    render(<TeamDetailPage />);
    await waitFor(() =>
      expect(screen.getByText(/build things/i)).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() =>
      expect(decideRequestMock).toHaveBeenCalledWith("jr1", "accepted")
    );
  });

  it("announces the leader's decision in a live region", async () => {
    fetchRequestsMock.mockResolvedValue([]);
    requestToJoinMock.mockResolvedValue(makeRequest());

    render(<TeamDetailPage />);
    await waitFor(() => expect(subscribeMyRequestsMock).toHaveBeenCalled());

    const call = subscribeMyRequestsMock.mock.calls[0] ?? [];
    const callback = call[0] as (request: JoinRequest) => void;

    await act(async () => {
      callback(makeRequest({ status: "accepted" }));
    });

    expect(screen.getByRole("status")).toHaveTextContent(/accepted/i);
  });
});
