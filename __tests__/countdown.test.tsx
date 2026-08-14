import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Countdown from "@/components/countdown";

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the remaining time in mono type", () => {
    render(<Countdown deadline="2026-08-16T12:00:00.000Z" />);
    const timer = screen.getByRole("timer");
    expect(timer).toHaveTextContent("24h");
    expect(timer.className).toContain("font-mono");
  });

  it("ticks down over time", () => {
    render(<Countdown deadline="2026-08-16T12:00:00.000Z" />);
    expect(screen.getByRole("timer")).toHaveTextContent("24h");

    act(() => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });

    expect(screen.getByRole("timer")).toHaveTextContent("23h");
  });

  it("pulses red when the deadline is under 24 hours away", () => {
    render(<Countdown deadline="2026-08-16T10:00:00.000Z" />);
    const timer = screen.getByRole("timer");
    expect(timer.className).toContain("animate-pulse");
    expect(timer.className).toContain("text-destructive");
  });

  it("does not pulse red when comfortably above 24 hours", () => {
    render(<Countdown deadline="2026-08-20T12:00:00.000Z" />);
    const timer = screen.getByRole("timer");
    expect(timer.className).not.toContain("animate-pulse");
    expect(timer.className).not.toContain("text-destructive");
  });

  it("reads zero once the deadline has passed", () => {
    render(<Countdown deadline="2026-08-14T12:00:00.000Z" />);
    expect(screen.getByRole("timer")).toHaveTextContent("0h");
  });
});
