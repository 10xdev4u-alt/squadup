import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TeamStats from "@/components/team-stats";

describe("team stats strip", () => {
  it("renders the three stats with labels", () => {
    render(<TeamStats members={4} openTickets={7} resources={12} />);
    expect(screen.getByText("Members")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Open tickets")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
