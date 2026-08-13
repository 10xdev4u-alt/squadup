import { describe, expect, it } from "vitest";
import {
  findUserTeam,
  isCollegeEmail,
  isDuplicateSwipe,
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
});

describe("isDuplicateSwipe", () => {
  it("flags a swipe already made in the same direction", () => {
    const swipes = [{ fromUser: "a", toUser: "b" }];
    expect(isDuplicateSwipe(swipes, "a", "b")).toBe(true);
  });

  it("allows the reverse direction", () => {
    const swipes = [{ fromUser: "a", toUser: "b" }];
    expect(isDuplicateSwipe(swipes, "b", "a")).toBe(false);
  });

  it("allows a fresh pair", () => {
    expect(isDuplicateSwipe([], "a", "b")).toBe(false);
  });
});

describe("shouldCreateMatch", () => {
  it("creates a match when the target already right-swiped the source", () => {
    const swipes = [{ fromUser: "b", toUser: "a", direction: "right" }];
    expect(shouldCreateMatch(swipes, "a", "b")).toBe(true);
  });

  it("does not create a match from a left swipe", () => {
    const swipes = [{ fromUser: "b", toUser: "a", direction: "left" }];
    expect(shouldCreateMatch(swipes, "a", "b")).toBe(false);
  });

  it("does not create a match when the target has not swiped", () => {
    expect(shouldCreateMatch([], "a", "b")).toBe(false);
  });

  it("only matches when the incoming swipe is right", () => {
    const swipes = [{ fromUser: "b", toUser: "a", direction: "right" }];
    expect(shouldCreateMatch(swipes, "a", "b", "left")).toBe(false);
  });
});

describe("findUserTeam", () => {
  it("returns the team id when the user is a member", () => {
    const teams = [{ id: "t1", members: ["a", "b"] }];
    expect(findUserTeam(teams, "a")).toBe("t1");
  });

  it("returns null when the user is in no team", () => {
    const teams = [{ id: "t1", members: ["b"] }];
    expect(findUserTeam(teams, "a")).toBeNull();
  });

  it("returns null for an empty roster", () => {
    expect(findUserTeam([], "a")).toBeNull();
  });
});

describe("orderMatchPair", () => {
  it("orders the pair deterministically", () => {
    expect(orderMatchPair("b", "a")).toEqual(["a", "b"]);
    expect(orderMatchPair("a", "b")).toEqual(["a", "b"]);
  });

  it("keeps the same pair equal in both directions", () => {
    expect(orderMatchPair("x", "y").join("|")).toBe(
      orderMatchPair("y", "x").join("|")
    );
  });
});
