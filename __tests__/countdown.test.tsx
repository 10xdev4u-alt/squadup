import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Countdown from "@/components/countdown";

describe("Countdown", () => {
  it("renders a timer element with the deadline label", () => {
    const deadline = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
    render(<Countdown deadline={deadline} />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
    expect(screen.getByLabelText("Time until deadline")).toHaveAttribute(
      "dateTime",
      deadline
    );
  });

  it("shows hours and minutes continuously (no 1h -> 59m cliff)", () => {
    // 61 minutes out — old code showed "1h", then jumped to "59m" at 60.
    const deadline = new Date(Date.now() + 61 * 60 * 1000).toISOString();
    render(<Countdown deadline={deadline} />);
    expect(screen.getByRole("timer").textContent).toMatch(/^\s*1h 1m\s*$/);
  });

  it("shows minutes when under an hour", () => {
    const deadline = new Date(Date.now() + 25 * 60 * 1000).toISOString();
    render(<Countdown deadline={deadline} />);
    expect(screen.getByRole("timer").textContent).toMatch(/^\s*25m\s*$/);
  });

  it("shows an explicit expired state past the deadline", () => {
    const deadline = new Date(Date.now() - 60 * 1000).toISOString();
    render(<Countdown deadline={deadline} />);
    expect(screen.getByRole("timer").textContent).toContain("Time's up");
  });
});
