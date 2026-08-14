import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TabBar from "@/components/tab-bar";

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("TabBar — iOS-style bottom navigation", () => {
  it("renders the four core destinations", () => {
    render(<TabBar />);

    expect(screen.getByRole("link", { name: /discover/i })).toHaveAttribute(
      "href",
      "/discover"
    );
    expect(screen.getByRole("link", { name: /matches/i })).toHaveAttribute(
      "href",
      "/matches"
    );
    expect(screen.getByRole("link", { name: /browse teams/i })).toHaveAttribute(
      "href",
      "/teams"
    );
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
      "href",
      "/profile"
    );
  });

  it("marks the active route with aria-current", () => {
    window.history.replaceState({}, "", "/matches");
    render(<TabBar />);

    expect(screen.getByRole("link", { name: /matches/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /discover/i })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("is labelled as the main navigation", () => {
    render(<TabBar />);
    expect(
      screen.getByRole("navigation", { name: "Main" })
    ).toBeInTheDocument();
  });
});
