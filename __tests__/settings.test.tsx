import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TeamSettingsPage from "@/pages/team/[id]/settings";
import type { TeamDetail } from "@/lib/api/teams";

const fetchTeamDetailMock = vi.fn();
const updateTeamSettingsMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    teams: {
      fetchTeamDetail: fetchTeamDetailMock,
      updateTeamSettings: updateTeamSettingsMock,
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
    rolesNeeded: [],
    problemStatement: null,
    leader: { id: "u-lead", name: "Arjun Patel" },
    members: [
      { id: "u-lead", name: "Arjun Patel" },
      { id: "u-dev", name: "Priya Sharma" },
    ],
    deadline: "2026-08-16T12:00:00.000Z",
    chatLink: "https://chat.example/invite",
    inviteCode: "INVITE42",
    ...overrides,
  };
}

beforeEach(() => {
  fetchTeamDetailMock.mockReset();
  updateTeamSettingsMock.mockReset();
  getClientMock.mockReset();
  getClientMock.mockReturnValue({ authStore: { record: { id: "u-lead" } } });
});

describe("team settings — /team/[id]/settings", () => {
  it("shows the settings form to the leader", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());

    render(<TeamSettingsPage />);

    expect(
      await screen.findByRole("heading", { name: /team settings/i })
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("https://chat.example/invite")
    ).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
  });

  it("gates non-leaders out of the form", async () => {
    getClientMock.mockReturnValue({ authStore: { record: { id: "u-dev" } } });
    fetchTeamDetailMock.mockResolvedValue(makeDetail());

    render(<TeamSettingsPage />);

    expect(
      await screen.findByText(/only the leader can manage/i)
    ).toBeInTheDocument();
  });

  it("shows the leader-only invite code", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());

    render(<TeamSettingsPage />);

    expect(await screen.findByTestId("invite-code")).toHaveTextContent(
      "INVITE42"
    );
  });

  it("saves the chat link and status toggle", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());
    updateTeamSettingsMock.mockResolvedValue(
      makeDetail({ chatLink: "https://chat.example/new", status: "closed" })
    );

    render(<TeamSettingsPage />);

    const link = await screen.findByDisplayValue("https://chat.example/invite");
    await userEvent.clear(link);
    await userEvent.type(link, "https://chat.example/new");
    await userEvent.selectOptions(screen.getByRole("combobox"), "closed");
    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i })
    );

    await waitFor(() =>
      expect(updateTeamSettingsMock).toHaveBeenCalledWith("t1", {
        chatLink: "https://chat.example/new",
        status: "closed",
      })
    );
  });

  it("removes a member and saves the new roster", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());
    updateTeamSettingsMock.mockResolvedValue(
      makeDetail({
        members: [{ id: "u-lead", name: "Arjun Patel" }],
      })
    );

    render(<TeamSettingsPage />);

    const remove = await screen.findByRole("button", {
      name: /remove priya sharma/i,
    });
    await userEvent.click(remove);
    await userEvent.click(
      screen.getByRole("button", { name: /save changes/i })
    );

    await waitFor(() =>
      expect(updateTeamSettingsMock).toHaveBeenCalledWith("t1", {
        members: ["u-lead"],
      })
    );
  });
  it("copies the invite code to the clipboard", async () => {
    fetchTeamDetailMock.mockResolvedValue(makeDetail());
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<TeamSettingsPage />);

    const code = await screen.findByTestId("invite-code");
    expect(code).toHaveTextContent("INVITE42");
    fireEvent.click(screen.getByRole("button", { name: "Copy invite code" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("INVITE42"));
    expect(screen.getByText("Copied")).toBeInTheDocument();
  });
});
