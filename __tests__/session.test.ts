import { describe, expect, it } from "vitest";
import {
  getCurrentUser,
  isAuthenticated,
  requireAuth,
} from "@/lib/api/session";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";

const authRecord = {
  id: "u1",
  email: "jane@college.edu",
  name: "Jane Doe",
  collegeId: "21CS001",
  avatar: null,
  bio: "Full-stack dev",
  githubUrl: "https://github.com/janedoe",
  skills: ["Frontend"],
  primaryRole: "Developer",
  status: "solo",
  lookingFor: "",
};

describe("session helpers", () => {
  it("returns the current user mapped to a DTO when signed in", () => {
    const client = makeClient(
      makeService(),
      makeAuthStore({ record: authRecord, isValid: true, token: "tok" })
    );

    expect(getCurrentUser(client)).toEqual({
      id: "u1",
      name: "Jane Doe",
      collegeId: "21CS001",
      avatar: null,
      bio: "Full-stack dev",
      githubUrl: "https://github.com/janedoe",
      skills: ["Frontend"],
      primaryRole: "Developer",
      status: "solo",
      lookingFor: "",
    });
  });

  it("returns null when signed out", () => {
    const client = makeClient(makeService(), makeAuthStore());
    expect(getCurrentUser(client)).toBeNull();
  });

  it("reports authentication from authStore validity", () => {
    expect(
      isAuthenticated(
        makeClient(makeService(), makeAuthStore({ isValid: true }))
      )
    ).toBe(true);
    expect(
      isAuthenticated(
        makeClient(makeService(), makeAuthStore({ isValid: false }))
      )
    ).toBe(false);
  });

  it("requireAuth returns the user when authenticated", () => {
    const client = makeClient(
      makeService(),
      makeAuthStore({ record: authRecord, isValid: true })
    );
    expect(requireAuth(client).id).toBe("u1");
  });

  it("requireAuth throws a normalized unauthorized error when not", () => {
    const client = makeClient(makeService(), makeAuthStore());
    expect(() => requireAuth(client)).toThrowError(
      expect.objectContaining({ kind: "unauthorized", status: 401 })
    );
  });
});
