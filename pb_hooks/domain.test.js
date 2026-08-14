import { describe, expect, it } from "vitest";
import {
  findUserTeam,
  generateInviteCode,
  hasPendingRequest,
  isCollegeEmail,
  isSelfJoin,
  isDuplicateSwipe,
  isMatchMember,
  orderMatchPair,
  shouldCreateMatch,
} from "./domain";

describe("isCollegeEmail", () => {
  it("accepts a valid college address", () => {
    expect(isCollegeEmail("jane@college.edu")).toBe(true);
  });

  it("accepts a subdomain of the college domain", () => {
    expect(isCollegeEmail("jane@eng.college.edu")).toBe(true);
  });

  it("rejects non-college domains", () => {
    expect(isCollegeEmail("jane@gmail.com")).toBe(false);
    expect(isCollegeEmail("jane@college.com")).toBe(false);
    expect(isCollegeEmail("jane@college.edu.evil.com")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isCollegeEmail("")).toBe(false);
    expect(isCollegeEmail("not-an-email")).toBe(false);
    expect(isCollegeEmail(null)).toBe(false);
    expect(isCollegeEmail(undefined)).toBe(false);
  });

  it("accepts a custom domain passed explicitly (env-driven deploy)", () => {
    expect(isCollegeEmail("jane@mycollege.edu.in", ["mycollege.edu.in"])).toBe(
      true
    );
    expect(
      isCollegeEmail("jane@eng.mycollege.edu.in", ["mycollege.edu.in"])
    ).toBe(true);
  });

  it("rejects a non-matching domain against an explicit list", () => {
    expect(isCollegeEmail("jane@gmail.com", ["mycollege.edu.in"])).toBe(false);
  });
});

describe("generateInviteCode", () => {
  it("produces an 8-character code", () => {
    expect(generateInviteCode()).toHaveLength(8);
  });

  it("uses only unambiguous uppercase alphanumerics", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^[A-Z2-9]{8}$/);
  });

  it("is not trivially deterministic", () => {
    const codes = new Set(
      Array.from({ length: 200 }, () => generateInviteCode())
    );
    expect(codes.size).toBeGreaterThan(150);
  });
});

describe("isMatchMember", () => {
  const match = { userA: "u-a", userB: "u-b" };

  it("accepts the userA participant", () => {
    expect(isMatchMember(match, "u-a")).toBe(true);
  });

  it("accepts the userB participant", () => {
    expect(isMatchMember(match, "u-b")).toBe(true);
  });

  it("rejects anyone outside the match", () => {
    expect(isMatchMember(match, "u-c")).toBe(false);
  });

  it("rejects a missing user id", () => {
    expect(isMatchMember(match, "")).toBe(false);
    expect(isMatchMember(match, null)).toBe(false);
    expect(isMatchMember(match, undefined)).toBe(false);
  });
});

describe("hasPendingRequest", () => {
  const requests = [
    { team: "t1", applicant: "u-a", status: "pending" },
    { team: "t2", applicant: "u-a", status: "rejected" },
  ];

  it("flags an existing pending request for the same team", () => {
    expect(hasPendingRequest(requests, "t1", "u-a")).toBe(true);
  });

  it("ignores non-pending requests", () => {
    expect(hasPendingRequest(requests, "t2", "u-a")).toBe(false);
  });

  it("allows a fresh team + applicant pair", () => {
    expect(hasPendingRequest(requests, "t3", "u-b")).toBe(false);
  });
});

describe("isSelfJoin", () => {
  it("rejects a request from the team leader", () => {
    expect(isSelfJoin({ leader: "u-lead" }, "u-lead")).toBe(true);
  });

  it("allows a request from a non-leader", () => {
    expect(isSelfJoin({ leader: "u-lead" }, "u-other")).toBe(false);
  });
});

// Countdown / deadline domain tests (§4B, §9 — team dashboard).
// Pure functions only; the hooks wire them server-side.
import { describe, it, expect } from "vitest";
import {
  TEAM_DEADLINE_HOURS,
  deadlineFor,
  hoursUntil,
  isUrgent,
} from "./domain.js";

describe("TEAM_DEADLINE_HOURS", () => {
  it("defaults to a 48-hour build window", () => {
    expect(TEAM_DEADLINE_HOURS).toBe(48);
  });
});

describe("deadlineFor", () => {
  it("adds the team window to the creation instant", () => {
    const createdAt = new Date("2026-08-14T12:00:00Z");
    const deadline = new Date(deadlineFor(createdAt));
    expect(deadline.toISOString()).toBe("2026-08-16T12:00:00.000Z");
  });
});

describe("hoursUntil", () => {
  const deadline = new Date("2026-08-16T12:00:00Z");

  it("reports the remaining time in hours", () => {
    const now = new Date("2026-08-15T12:00:00Z");
    expect(hoursUntil(deadline, now)).toBe(24);
  });

  it("is zero once the deadline has passed", () => {
    const now = new Date("2026-08-17T12:00:00Z");
    expect(hoursUntil(deadline, now)).toBe(0);
  });
});

describe("isUrgent", () => {
  it("is true below the 24-hour threshold", () => {
    expect(isUrgent(23.5 * 3600 * 1000)).toBe(true);
  });

  it("is false at exactly 24 hours", () => {
    expect(isUrgent(24 * 3600 * 1000)).toBe(false);
  });

  it("is false when the deadline has passed", () => {
    expect(isUrgent(0)).toBe(false);
  });
});

// Kanban / workspace (§4B, §8 — tasks).
import { describe, it, expect } from "vitest";
import { isTeamMember } from "./domain.js";

describe("isTeamMember", () => {
  it("accepts a member of the team", () => {
    expect(
      isTeamMember({ members: ["u-a", "u-b"] }, "u-a")
    ).toBe(true);
  });

  it("rejects an outsider", () => {
    expect(isTeamMember({ members: ["u-a", "u-b"] }, "u-x")).toBe(false);
  });

  it("rejects a missing user id", () => {
    expect(isTeamMember({ members: ["u-a"] }, null)).toBe(false);
  });
});
