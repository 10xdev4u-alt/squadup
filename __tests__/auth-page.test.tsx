import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replaceMock = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

const requestOtpMock = vi.fn();
const verifyOtpMock = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  // Keep the real helpers (getApiErrorMessage etc.); only swap the api() facade.
  const mod = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...mod,
    api: () => ({
      auth: { requestOtp: requestOtpMock, verifyOtp: verifyOtpMock },
    }),
  };
});

import AuthPage from "@/pages/auth";

async function submitEmail(email: string) {
  await userEvent.type(screen.getByLabelText(/college email/i), email);
  await userEvent.click(
    screen.getByRole("button", { name: /get.*code|send.*code/i })
  );
}

async function submitCode(code: string) {
  await userEvent.type(screen.getByLabelText(/verification code/i), code);
  await userEvent.click(
    screen.getByRole("button", { name: /verify|sign in|log in/i })
  );
}

describe("auth page", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    requestOtpMock.mockReset();
    verifyOtpMock.mockReset();
  });

  it("links the error message to the email input for screen readers", async () => {
    requestOtpMock.mockRejectedValue({
      kind: "forbidden",
      status: 403,
      message: "You do not have permission to do that.",
      cause: null,
    });
    render(<AuthPage />);

    await submitEmail("jane@college.edu");

    const error = await screen.findByText(
      /You do not have permission to do that/i
    );
    const input = screen.getByLabelText(/college email/i);
    expect(input).toHaveAttribute(
      "aria-describedby",
      expect.stringContaining(error.id)
    );
  });

  it("requests an OTP and moves to the code step", async () => {
    requestOtpMock.mockResolvedValue({ otpId: "otp-1" });
    render(<AuthPage />);

    await submitEmail("jane@college.edu");

    expect(requestOtpMock).toHaveBeenCalledWith("jane@college.edu");
    expect(
      await screen.findByLabelText(/verification code/i)
    ).toBeInTheDocument();
  });

  it("surfaces a normalized error when OTP request fails", async () => {
    requestOtpMock.mockRejectedValue({
      kind: "forbidden",
      status: 403,
      message: "You do not have permission to do that.",
      cause: null,
    });
    render(<AuthPage />);

    await submitEmail("jane@gmail.com");

    expect(await screen.findByText(/permission/i)).toBeInTheDocument();
    // stays on the email step — no code field appeared
    expect(
      screen.queryByLabelText(/verification code/i)
    ).not.toBeInTheDocument();
  });

  it("verifies the code and redirects a complete user to discover", async () => {
    requestOtpMock.mockResolvedValue({ otpId: "otp-1" });
    verifyOtpMock.mockResolvedValue({
      token: "tok",
      user: { id: "u1", name: "Jane", collegeId: "21CS001" },
    });
    render(<AuthPage />);

    await submitEmail("jane@college.edu");
    await submitCode("654321");

    await waitFor(() =>
      expect(verifyOtpMock).toHaveBeenCalledWith("otp-1", "654321")
    );
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/discover"));
  });

  it("redirects a new user (no profile) to onboarding", async () => {
    requestOtpMock.mockResolvedValue({ otpId: "otp-1" });
    verifyOtpMock.mockResolvedValue({
      token: "tok",
      user: { id: "u1", name: "", collegeId: "" },
    });
    render(<AuthPage />);

    await submitEmail("jane@college.edu");
    await submitCode("654321");

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/onboarding")
    );
  });

  it("resends a code and swaps in the fresh otpId", async () => {
    requestOtpMock.mockResolvedValue({ otpId: "otp-1" });
    verifyOtpMock.mockResolvedValue({
      token: "tok",
      user: { id: "u1", name: "Jane", collegeId: "21CS001" },
    });
    render(<AuthPage />);

    await submitEmail("jane@college.edu");
    requestOtpMock.mockResolvedValue({ otpId: "otp-2" });
    await userEvent.click(screen.getByRole("button", { name: /resend/i }));
    await submitCode("654321");

    await waitFor(() => expect(requestOtpMock).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(verifyOtpMock).toHaveBeenCalledWith("otp-2", "654321")
    );
  });
});
