import { describe, expect, it } from "vitest";
import { isOtpEmailAllowed } from "@/pb_hooks/domain";

describe("isOtpEmailAllowed", () => {
  it("allows college-domain emails even without an allowlist", () => {
    expect(isOtpEmailAllowed("jane@college.edu", [])).toBe(true);
    expect(isOtpEmailAllowed("jane@eng.college.edu", [])).toBe(true);
  });

  it("allows an exact allowlisted address", () => {
    const allowlist = ["mentor@example.com", "judge@demo.org"];
    expect(isOtpEmailAllowed("mentor@example.com", allowlist)).toBe(true);
    expect(isOtpEmailAllowed("judge@demo.org", allowlist)).toBe(true);
  });

  it("matches the allowlist case-insensitively", () => {
    const allowlist = ["Mentor@Example.COM"];
    expect(isOtpEmailAllowed("mentor@example.com", allowlist)).toBe(true);
    expect(isOtpEmailAllowed("MENTOR@EXAMPLE.COM", allowlist)).toBe(true);
  });

  it("rejects non-college, non-allowlisted emails", () => {
    const allowlist = ["mentor@example.com"];
    expect(isOtpEmailAllowed("jane@gmail.com", allowlist)).toBe(false);
    expect(isOtpEmailAllowed("someone@college.com", allowlist)).toBe(false);
    // lookalike domain must not slip through
    expect(isOtpEmailAllowed("jane@college.edu.evil.com", allowlist)).toBe(
      false
    );
  });

  it("does not let a prefix of an allowlisted address pass", () => {
    const allowlist = ["mentor@example.com"];
    expect(isOtpEmailAllowed("notmentor@example.com", allowlist)).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isOtpEmailAllowed("", [])).toBe(false);
    expect(isOtpEmailAllowed("not-an-email", [])).toBe(false);
    expect(isOtpEmailAllowed(null, [])).toBe(false);
    expect(isOtpEmailAllowed(undefined, [])).toBe(false);
  });
});
