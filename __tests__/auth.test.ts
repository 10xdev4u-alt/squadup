import { describe, expect, it, vi } from "vitest";
import { createAuthApi } from "@/lib/api/auth";
import type { PbClient } from "@/lib/api/types";
import { makeClient, makeService } from "@/__tests__/helpers/client";

const authRecord = {
  id: "u1",
  email: "jane@college.edu",
  name: "Jane Doe",
  collegeId: "21CS001",
  avatar: null,
  bio: "Full-stack dev",
  githubUrl: "https://github.com/janedoe",
  skills: ["Frontend", "Backend"],
  primaryRole: "Developer",
  status: "solo",
  lookingFor: "AI/ML dev for healthcare idea",
  mentor: false,
};

describe("auth api", () => {
  it("requests an OTP for an email, returning the otpId", async () => {
    const service = makeService({
      requestOTP: vi.fn(async () => ({ otpId: "otp-123" })),
    });
    const client: PbClient = makeClient(service);

    const result = await createAuthApi(client).requestOtp("jane@college.edu");

    expect(service.requestOTP).toHaveBeenCalledWith("jane@college.edu");
    expect(result.otpId).toBe("otp-123");
  });

  it("verifies an OTP and completes a session with a mapped User", async () => {
    const service = makeService({
      authWithOTP: vi.fn(async () => ({
        token: "token-abc",
        record: authRecord,
      })),
    });
    const client: PbClient = makeClient(service);

    const session = await createAuthApi(client).verifyOtp("otp-123", "654321");

    expect(service.authWithOTP).toHaveBeenCalledWith("otp-123", "654321");
    expect(session.token).toBe("token-abc");
    expect(session.user).toEqual({
      id: "u1",
      name: "Jane Doe",
      collegeId: "21CS001",
      avatar: null,
      bio: "Full-stack dev",
      githubUrl: "https://github.com/janedoe",
      skills: ["Frontend", "Backend"],
      primaryRole: "Developer",
      status: "solo",
      lookingFor: "AI/ML dev for healthcare idea",
      mentor: false,
    });
    // email stays out of the DTO — not part of the public User shape.
    expect("email" in session.user).toBe(false);
  });

  it("normalizes OTP request failures into typed ApiErrors", async () => {
    const service = makeService({
      requestOTP: vi.fn(async () => {
        throw new Error("fetch failed");
      }),
    });
    const client: PbClient = makeClient(service);

    await expect(
      createAuthApi(client).requestOtp("jane@gmail.com")
    ).rejects.toMatchObject({
      kind: "server",
    });
  });
});
