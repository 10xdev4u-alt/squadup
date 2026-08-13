import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Design from "@/pages/design";

describe("design tokens page", () => {
  it("renders the token reference with swatch labels and font specimens", () => {
    render(<Design />);
    expect(
      screen.getByRole("heading", { name: /design tokens/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Electric Indigo")).toBeInTheDocument();
    expect(screen.getByText("Signal Green")).toBeInTheDocument();
    expect(screen.getByText("Space Grotesk")).toBeInTheDocument();
    expect(screen.getByText("Inter")).toBeInTheDocument();
    expect(screen.getByText("JetBrains Mono")).toBeInTheDocument();
  });
});
