import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("button primitive", () => {
  it("renders with the primary variant styled from tokens", () => {
    render(<Button>Join Team</Button>);
    const button = screen.getByRole("button", { name: /join team/i });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("text-primary-foreground");
  });

  it("keeps raw hex color literals out of primitive sources", () => {
    const dir = "components/ui";
    const files = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(join(dir, file), "utf-8");
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});
