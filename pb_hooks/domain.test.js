import { describe, expect, it } from "vitest";
import {
  findUserTeam,
  isCollegeEmail,
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
