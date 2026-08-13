import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "@/components/ui/badge";

describe("badge primitive", () => {
  it("renders a label with the success variant styled from tokens", () => {
    render(<Badge variant="success">Open</Badge>);
    const badge = screen.getByText("Open");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-success");
  });

  it("renders the default variant by default", () => {
    render(<Badge>In progress</Badge>);
    const badge = screen.getByText("In progress");
    expect(badge.className).toContain("bg-primary");
  });
});
