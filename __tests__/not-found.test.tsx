import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/pages/404";

describe("404 page", () => {
  it("renders a branded message and home link", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /wandered off/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to SquadUp" })
    ).toHaveAttribute("href", "/");
  });
});
