import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";
import ProfilePage from "@/pages/profile";

const replaceMock = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

let client = makeClient(
  makeService(),
  makeAuthStore({
    record: {
      id: "u1",
      name: "Priya Sharma",
      collegeId: "2023cs0113",
      bio: "Full-stack builder",
      githubUrl: "https://github.com/priya",
      skills: ["React"],
      primaryRole: "Developer",
      status: "solo",
      lookingFor: "",
      mentor: false,
      admin: false,
      avatar: null,
    },
    isValid: true,
    token: "tok",
  })
);
vi.mock("@/lib/api/client", () => ({
  getClient: () => client,
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

const updateProfileMock = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...mod,
    api: () => ({ users: { updateProfile: updateProfileMock } }),
  };
});

describe("profile edit page — Flow 1 'edit own profile'", () => {
  beforeEach(() => {
    updateProfileMock.mockReset();
  });

  it("pre-fills the current profile", async () => {
    render(<ProfilePage />);

    const name = await screen.findByLabelText(/full name/i);
    expect(name).toHaveValue("Priya Sharma");
    expect(screen.getByLabelText(/bio/i)).toHaveValue("Full-stack builder");
    expect(screen.getByLabelText(/github/i)).toHaveValue(
      "https://github.com/priya"
    );
  });

  it("saves edits via updateProfile", async () => {
    updateProfileMock.mockResolvedValue({ id: "u1", name: "P. Sharma" });

    render(<ProfilePage />);
    const name = await screen.findByLabelText(/full name/i);
    await userEvent.clear(name);
    await userEvent.type(name, "P. Sharma");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(updateProfileMock).toHaveBeenCalledWith("u1", {
        name: "P. Sharma",
        bio: "Full-stack builder",
        githubUrl: "https://github.com/priya",
      })
    );
    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("rejects an empty name", async () => {
    render(<ProfilePage />);
    const name = await screen.findByLabelText(/full name/i);
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });
});
