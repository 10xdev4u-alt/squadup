import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

describe("input primitive", () => {
  it("is accessible by its label and applies token classes", () => {
    render(
      <>
        <Label htmlFor="team-name">Team name</Label>
        <Input id="team-name" placeholder="Project Alpha" />
      </>
    );
    const input = screen.getByLabelText("Team name");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Project Alpha");
    expect(input.className).toContain("border-input");
  });
});
