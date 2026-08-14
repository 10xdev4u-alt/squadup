import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Avatar, { initialsOf } from "@/components/avatar";

describe("Avatar", () => {
  it("renders two-letter initials when no image is provided", () => {
    render(<Avatar name="Priya Sharma" />);
    expect(screen.getByText("PS")).toBeInTheDocument();
  });

  it("renders a single initial for one-word names", () => {
    render(<Avatar name="Beyonce" />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("renders the image when a source is provided", () => {
    const { container } = render(
      <Avatar name="Priya Sharma" src="/files/u1.png" />
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/files/u1.png");
    expect(screen.queryByText("PS")).not.toBeInTheDocument();
  });

  it("is decorative (aria-hidden) by default", () => {
    render(<Avatar name="Priya Sharma" />);
    expect(screen.getByText("PS").closest("div")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("picks a deterministic color for the same name", () => {
    const a = render(<Avatar name="Priya Sharma" />);
    const b = render(<Avatar name="Priya Sharma" />);
    const colorA = a.container.querySelector("div")?.className ?? "";
    const colorB = b.container.querySelector("div")?.className ?? "";
    expect(colorA).toBe(colorB);
  });
});

describe("initialsOf", () => {
  it("produces initials from the first two words", () => {
    expect(initialsOf("Aarav Iyer")).toBe("AI");
    expect(initialsOf("  spaced   out  name ")).toBe("SO");
  });
});
