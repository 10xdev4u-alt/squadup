import { describe, expect, it } from "vitest";
import { formatMessageTime } from "@/lib/format-message-time";

describe("formatMessageTime", () => {
  it("formats a valid PB timestamp as local HH:MM", () => {
    expect(formatMessageTime("2026-08-14 12:30:00.000Z")).toMatch(
      /\d{1,2}:\d{2} [AP]M/
    );
  });

  it("returns an empty string for a missing timestamp", () => {
    expect(formatMessageTime("")).toBe("");
  });

  it("returns an empty string for an invalid timestamp", () => {
    expect(formatMessageTime("garbage")).toBe("");
  });
});
