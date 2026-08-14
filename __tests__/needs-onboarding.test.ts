import { describe, expect, it } from "vitest";
import { needsOnboarding } from "@/lib/needs-onboarding";
import type { User } from "@/types/squadup";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    name: "Jane Doe",
    collegeId: "21CS001",
    avatar: null,
    bio: "Full-stack dev",
    githubUrl: null,
    skills: ["Frontend"],
    primaryRole: "Developer",
    status: "solo",
    lookingFor: "",
    mentor: false,
    admin: false,
    ...overrides,
  };
}

describe("needsOnboarding", () => {
  it("returns true for a fresh OTP-verified user (no name, no collegeId)", () => {
    expect(needsOnboarding(makeUser({ name: "", collegeId: "" }))).toBe(true);
  });

  it("returns true when only the name is missing", () => {
    expect(needsOnboarding(makeUser({ name: "" }))).toBe(true);
  });

  it("returns true when only collegeId is missing", () => {
    expect(needsOnboarding(makeUser({ collegeId: "" }))).toBe(true);
  });

  it("returns false for a completed profile", () => {
    expect(needsOnboarding(makeUser())).toBe(false);
  });

  it("treats whitespace-only name as missing", () => {
    expect(needsOnboarding(makeUser({ name: "   " }))).toBe(true);
  });
});
