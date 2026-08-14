import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "@/components/empty-state";

describe("EmptyState", () => {
  it("renders the title as a heading", () => {
    render(<EmptyState title="No squads yet" />);
    expect(
      screen.getByRole("heading", { name: "No squads yet" })
    ).toBeInTheDocument();
  });

  it("renders the description when provided", () => {
    render(
      <EmptyState
        title="No squads yet"
        description="Invite friends to start."
      />
    );
    expect(screen.getByText("Invite friends to start.")).toBeInTheDocument();
  });

  it("renders an action button when label and handler are provided", () => {
    const onAction = () => {};
    render(
      <EmptyState
        title="No squads yet"
        actionLabel="Invite friends"
        onAction={onAction}
      />
    );
    expect(
      screen.getByRole("button", { name: "Invite friends" })
    ).toBeInTheDocument();
  });
});
