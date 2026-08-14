import { describe, expect, it } from "vitest";
import {
  findUserTeam,
  generateInviteCode,
  hasPendingRequest,
  isCollegeEmail,
  isSelfJoin,
  isDuplicateSwipe,
  isMatchMember,
  matchPartner,
  orderMatchPair,
  shouldCreateMatch,
} from "./domain";

describe("isCollegeEmail", () => {
  it("accepts a valid college address", () => {
    expect(isCollegeEmail("jane@svce.ac.in")).toBe(true);
  });

  it("accepts a subdomain of the college domain", () => {
    expect(isCollegeEmail("jane@eng.svce.ac.in")).toBe(true);
  });

  it("rejects non-college domains", () => {
    expect(isCollegeEmail("jane@gmail.com")).toBe(false);
    expect(isCollegeEmail("jane@college.com")).toBe(false);
    expect(isCollegeEmail("jane@svce.ac.in.evil.com")).toBe(false);
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

describe("matchPartner", () => {
  const match = { userA: "u-a", userB: "u-b" };

  it("returns the other participant for userA", () => {
    expect(matchPartner(match, "u-a")).toBe("u-b");
  });

  it("returns the other participant for userB", () => {
    expect(matchPartner(match, "u-b")).toBe("u-a");
  });

  it("returns null for anyone outside the match", () => {
    expect(matchPartner(match, "u-c")).toBe(null);
  });

  it("returns null for a missing user id", () => {
    expect(matchPartner(match, "")).toBe(null);
    expect(matchPartner(match, null)).toBe(null);
    expect(matchPartner(match, undefined)).toBe(null);
  });

  it("returns null for a missing match", () => {
    expect(matchPartner(null, "u-a")).toBe(null);
    expect(matchPartner(undefined, "u-a")).toBe(null);
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

// Team settings (§4B, §8 — leader-only member management).
import { describe, it, expect } from "vitest";
import { removedMembers } from "./domain.js";

describe("removedMembers", () => {
  it("returns the members dropped between the old and new roster", () => {
    expect(removedMembers(["u-lead", "u-a", "u-b"], ["u-lead", "u-b"])).toEqual(
      ["u-a"]
    );
  });

  it("returns an empty list when the roster is unchanged", () => {
    expect(removedMembers(["u-lead", "u-a"], ["u-a", "u-lead"])).toEqual([]);
  });

  it("returns an empty list when members are added", () => {
    expect(removedMembers(["u-lead"], ["u-lead", "u-new"])).toEqual([]);
  });
});

// Kanban / workspace (§4B, §8 — tasks).
import { describe, it, expect } from "vitest";
import { isTeamMember } from "./domain.js";

describe("isTeamMember", () => {
  it("accepts a member of the team", () => {
    expect(isTeamMember({ members: ["u-a", "u-b"] }, "u-a")).toBe(true);
  });

  it("rejects an outsider", () => {
    expect(isTeamMember({ members: ["u-a", "u-b"] }, "u-x")).toBe(false);
  });

  it("rejects a missing user id", () => {
    expect(isTeamMember({ members: ["u-a"] }, null)).toBe(false);
  });
});

// Resource link detection (§4C — universal embeds).
import { describe, it, expect } from "vitest";
import { detectResourceType } from "./domain.js";

describe("detectResourceType", () => {
  it("detects figma share links as embeddable", () => {
    expect(detectResourceType("https://www.figma.com/file/abc/Design")).toEqual(
      { type: "figma", embeddable: true }
    );
  });

  it("detects excalidraw links as embeddable", () => {
    expect(detectResourceType("https://excalidraw.com/#json=abc")).toEqual({
      type: "excalidraw",
      embeddable: true,
    });
  });

  it("detects canva as a non-embeddable link card", () => {
    expect(detectResourceType("https://www.canva.com/design/DAG/")).toEqual({
      type: "canva",
      embeddable: false,
    });
  });

  it("detects google drive and github", () => {
    expect(detectResourceType("https://drive.google.com/file/d/1x")).toEqual({
      type: "drive",
      embeddable: false,
    });
    expect(
      detectResourceType("https://github.com/10xdev4u-alt/squadup")
    ).toEqual({ type: "github", embeddable: false });
  });

  it("flags unknown domains as other", () => {
    expect(detectResourceType("https://notion.so/page")).toEqual({
      type: "other",
      embeddable: false,
    });
  });

  it("rejects lookalike domains (§4C spoof guard)", () => {
    expect(detectResourceType("https://figma.com.evil.example/x")).toEqual({
      type: "other",
      embeddable: false,
    });
    expect(detectResourceType("https://canva.com@evil.example/x")).toEqual({
      type: "other",
      embeddable: false,
    });
  });
});

// Mentorship (§4D — ticket roles).
import { describe, it, expect } from "vitest";
import { canManageTicket, canViewTicket, isMentor } from "./domain.js";

describe("isMentor", () => {
  it("is true when the user carries the mentor flag", () => {
    expect(isMentor({ mentor: true })).toBe(true);
  });

  it("is false otherwise", () => {
    expect(isMentor({ mentor: false })).toBe(false);
    expect(isMentor({})).toBe(false);
  });
});

describe("canViewTicket", () => {
  it("allows a team member", () => {
    expect(canViewTicket({ mentor: false }, ["u-a", "u-b"], "u-a")).toBe(true);
  });

  it("allows any mentor", () => {
    expect(canViewTicket({ mentor: true }, ["u-a"], "u-mentor")).toBe(true);
  });

  it("rejects an outsider who is not a mentor", () => {
    expect(canViewTicket({ mentor: false }, ["u-a"], "u-x")).toBe(false);
  });
});

describe("canManageTicket", () => {
  it("is mentor-only", () => {
    expect(canManageTicket({ mentor: true })).toBe(true);
    expect(canManageTicket({ mentor: false })).toBe(false);
  });
});

// Admin (§4E — M5). `admin` is a users bool flag seeded via the PB dashboard.
// Privilege flags (admin/mentor) are server-only: a plain user can never set
// them on themselves — that closes the I24 hole where `mentor` was self-claimable.
import { canModifyPrivilege } from "./domain.js";

describe("canModifyPrivilege", () => {
  it("blocks a plain user from setting admin", () => {
    expect(canModifyPrivilege(false, ["admin"])).toBe(false);
  });

  it("blocks a plain user from setting mentor", () => {
    expect(canModifyPrivilege(false, ["mentor"])).toBe(false);
  });

  it("allows a superuser to set either flag", () => {
    expect(canModifyPrivilege(true, ["admin", "mentor"])).toBe(true);
  });

  it("allows a plain user to change non-privilege fields", () => {
    expect(canModifyPrivilege(false, ["bio", "name"])).toBe(true);
  });

  it("allows empty changes", () => {
    expect(canModifyPrivilege(false, [])).toBe(true);
  });
});

// Beta launch (I27 — §11 Phase 8, §12). Seeding is idempotent and opt-in;
// metric events are anonymous by design (no user ids — the no-PII rule).
import { shouldSeed, toMetricEvent } from "./domain.js";

describe("shouldSeed", () => {
  it("seeds only when the teams collection is empty", () => {
    expect(shouldSeed(0)).toBe(true);
    expect(shouldSeed(1)).toBe(false);
    expect(shouldSeed(5)).toBe(false);
  });
});

describe("toMetricEvent", () => {
  it("maps a team creation to an anonymous event", () => {
    expect(toMetricEvent("teams", "create", {})).toMatchObject({
      action: "team_created",
      at: expect.any(String),
    });
  });

  it("maps a resolved ticket to an anonymous event", () => {
    expect(
      toMetricEvent("mentor_tickets", "update", { status: "resolved" })
    ).toMatchObject({
      action: "ticket_resolved",
      at: expect.any(String),
    });
  });

  it("maps a task landing in final_pitch to an anonymous event", () => {
    expect(
      toMetricEvent("tasks", "update", { status: "final_pitch" })
    ).toMatchObject({
      action: "task_final_pitch",
      at: expect.any(String),
    });
  });

  it("returns null for uninteresting events", () => {
    expect(toMetricEvent("teams", "update", {})).toBeNull();
    expect(toMetricEvent("tasks", "create", {})).toBeNull();
    expect(toMetricEvent("users", "create", {})).toBeNull();
  });
});
