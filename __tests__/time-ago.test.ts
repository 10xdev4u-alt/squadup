import { describe, expect, it } from "vitest";
import { timeAgo } from "@/lib/time-ago";

describe("timeAgo", () => {
  const now = new Date("2026-08-14T12:00:00Z").getTime();

  it("says just now for recent timestamps", () => {
    expect(timeAgo(new Date(now - 30_000).toISOString(), now)).toBe("just now");
  });

  it("formats minutes", () => {
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toMatch(
      /5m ago/
    );
  });

  it("formats hours", () => {
    expect(timeAgo(new Date(now - 2 * 3_600_000).toISOString(), now)).toMatch(
      /2h ago/
    );
  });

  it("formats days", () => {
    expect(timeAgo(new Date(now - 3 * 86_400_000).toISOString(), now)).toMatch(
      /3d ago/
    );
  });

  it("handles empty values", () => {
    expect(timeAgo("", now)).toBe("");
  });
});
