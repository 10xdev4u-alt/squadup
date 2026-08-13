import { describe, expect, it } from "vitest";
import { isCollegeEmail, isDuplicateSwipe } from "./domain";

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
