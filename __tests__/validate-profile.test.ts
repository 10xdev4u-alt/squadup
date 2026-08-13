import { describe, expect, it } from "vitest";
import {
  validateProfile,
  type ProfileFormValues,
} from "@/lib/validate-profile";

function makeValues(
  overrides: Partial<ProfileFormValues> = {}
): ProfileFormValues {
  return {
    name: "Jane Doe",
    bio: "",
    githubUrl: "",
    ...overrides,
  };
}

describe("validateProfile", () => {
  it("accepts a complete profile", () => {
    expect(
      validateProfile(
        makeValues({ bio: "dev", githubUrl: "https://github.com/janedoe" })
      )
    ).toEqual({ errors: {} });
  });

  it("requires a name", () => {
    const res = validateProfile(makeValues({ name: "" }));
    expect(res.errors.name).toBeTruthy();
  });

  it("rejects a whitespace-only name", () => {
    const res = validateProfile(makeValues({ name: "   " }));
    expect(res.errors.name).toBeTruthy();
  });

  it("trims the name before validating length", () => {
    expect(
      validateProfile(makeValues({ name: "  " })).errors.name
    ).toBeTruthy();
  });

  it("rejects a name over the schema max of 100", () => {
    const res = validateProfile(makeValues({ name: "x".repeat(101) }));
    expect(res.errors.name).toBeTruthy();
  });

  it("accepts a name of exactly 100 chars", () => {
    expect(
      validateProfile(makeValues({ name: "x".repeat(100) })).errors.name
    ).toBeUndefined();
  });

  it("rejects a bio over the schema max of 500", () => {
    const res = validateProfile(makeValues({ bio: "x".repeat(501) }));
    expect(res.errors.bio).toBeTruthy();
  });

  it("accepts an empty githubUrl", () => {
    expect(
      validateProfile(makeValues({ githubUrl: "" })).errors.githubUrl
    ).toBeUndefined();
  });

  it("rejects a malformed githubUrl", () => {
    const res = validateProfile(makeValues({ githubUrl: "not-a-url" }));
    expect(res.errors.githubUrl).toBeTruthy();
  });

  it("accepts a valid http(s) githubUrl", () => {
    expect(
      validateProfile(makeValues({ githubUrl: "https://github.com/janedoe" }))
        .errors.githubUrl
    ).toBeUndefined();
  });
});
