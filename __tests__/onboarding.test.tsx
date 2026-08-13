import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";

const replaceMock = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

// Current session — the page reads the user id from the authStore.
let client = makeClient(
  makeService(),
  makeAuthStore({
    record: { id: "u1", name: "", collegeId: "" },
    isValid: true,
    token: "tok",
  })
);
vi.mock("@/lib/api/client", () => ({
  getClient: () => client,
}));

const updateProfileMock = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...mod,
    api: () => ({ users: { updateProfile: updateProfileMock } }),
  };
});

import Onboarding from "@/pages/onboarding";

describe("onboarding profile page", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    updateProfileMock.mockReset();
  });

  it("renders the profile form", () => {
    render(<Onboarding />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/github/i)).toBeInTheDocument();
  });

  it("shows inline validation errors on an empty submit", async () => {
    render(<Onboarding />);
    await userEvent.click(
      screen.getByRole("button", { name: /continue|next/i })
    );

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("saves the profile and advances to the skills step", async () => {
    updateProfileMock.mockResolvedValue({
      id: "u1",
      name: "Jane Doe",
      collegeId: "21CS001",
      avatar: null,
      bio: "Full-stack dev",
      githubUrl: "https://github.com/janedoe",
      skills: [],
      primaryRole: "Developer",
      status: "solo",
      lookingFor: "",
    });
    render(<Onboarding />);

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/bio/i), "Full-stack dev");
    await userEvent.type(
      screen.getByLabelText(/github/i),
      "https://github.com/janedoe"
    );
    await userEvent.click(
      screen.getByRole("button", { name: /continue|next/i })
    );

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({ name: "Jane Doe", bio: "Full-stack dev" })
      )
    );
    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/onboarding/skills")
    );
  });
});
