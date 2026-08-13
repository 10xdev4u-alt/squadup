import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn helper", () => {
  it("joins classes and lets later conflicting ones win", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("bg-primary", "text-foreground")).toBe(
      "bg-primary text-foreground"
    );
  });
});
