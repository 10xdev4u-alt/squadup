import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Layout from "@/components/Layout";

describe("Layout a11y", () => {
  it("provides a skip link to the main content", () => {
    render(<Layout>content</Layout>);
    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    expect(skipLink).toHaveAttribute("href", "#main-content");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
