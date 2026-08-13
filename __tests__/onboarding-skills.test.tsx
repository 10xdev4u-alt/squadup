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

let client = makeClient(
  makeService(),
  makeAuthStore({ record: { id: "u1" }, isValid: true, token: "tok" })
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

import OnboardingSkills from "@/pages/onboarding/skills";

describe("onboarding skills page", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    updateProfileMock.mockReset();
  });

  it("renders the skill registry and role options", () => {
    render(<OnboardingSkills />);
    expect(
      screen.getByRole("button", { name: /frontend/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /backend/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/developer/i)).toBeInTheDocument();
  });

  it("shows an error and does not save with no skills selected", async () => {
    render(<OnboardingSkills />);
    await userEvent.click(
      screen.getByRole("button", { name: /finish|complete/i })
    );

    expect(await screen.findByText(/at least one skill/i)).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("tracks selection and disables further picks at five", async () => {
    render(<OnboardingSkills />);

    const five = ["Frontend", "Backend", "AI/ML", "DevOps", "Research"];
    for (const skill of five) {
      await userEvent.click(
        screen.getByRole("button", { name: new RegExp(skill, "i") })
      );
    }

    // selected chips are aria-pressed
    for (const skill of five) {
      expect(
        screen.getByRole("button", { name: new RegExp(skill, "i") })
      ).toHaveAttribute("aria-pressed", "true");
    }

    const next = screen.getByRole("button", { name: /data science/i });
    expect(next).toBeDisabled();
  });

  it("saves skills and role, then redirects to discover", async () => {
    updateProfileMock.mockResolvedValue({
      id: "u1",
      name: "Jane Doe",
      collegeId: "21CS001",
      avatar: null,
      bio: "",
      githubUrl: null,
      skills: ["Frontend", "Backend"],
      primaryRole: "Developer",
      status: "solo",
      lookingFor: "",
    });
    render(<OnboardingSkills />);

    await userEvent.click(screen.getByRole("button", { name: /frontend/i }));
    await userEvent.click(screen.getByRole("button", { name: /backend/i }));
    await userEvent.click(screen.getByLabelText(/developer/i));
    await userEvent.click(
      screen.getByRole("button", { name: /finish|complete/i })
    );

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({
          skills: ["Frontend", "Backend"],
          primaryRole: "Developer",
        })
      )
    );
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/discover"));
  });
});
