import { describe, expect, it } from "vitest";
import { pbEscape } from "@/lib/api/filter";

describe("pbEscape", () => {
  it("wraps a plain value in quotes", () => {
    expect(pbEscape("abc123")).toBe('"abc123"');
  });

  it("escapes single quotes so they cannot break out of the literal", () => {
    expect(pbEscape("foo' || 1=1 --")).toBe('"foo\' || 1=1 --"');
  });

  it("escapes double quotes inside the value", () => {
    expect(pbEscape('say "hi"')).toBe('"say \\"hi\\""');
  });

  it("escapes backslashes", () => {
    expect(pbEscape("a\\b")).toBe('"a\\\\b"');
  });

  it("treats null and undefined as an empty string", () => {
    expect(pbEscape(null)).toBe('""');
    expect(pbEscape(undefined)).toBe('""');
  });

  it("stringifies numbers and booleans", () => {
    expect(pbEscape(42)).toBe('"42"');
    expect(pbEscape(true)).toBe('"true"');
  });
});
