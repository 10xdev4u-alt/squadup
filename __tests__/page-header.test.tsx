import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PageHeader from "@/components/page-header";

describe("page header", () => {
  it("renders the title and description", () => {
    render(<PageHeader title="Matches" description="Chat with your matches" />);
    expect(
      screen.getByRole("heading", { name: "Matches" })
    ).toBeInTheDocument();
    expect(screen.getByText("Chat with your matches")).toBeInTheDocument();
  });

  it("renders optional actions on the right", () => {
    render(
      <PageHeader
        title="Browse Teams"
        description="Open teams looking for members"
        actions={<button type="button">Join by code</button>}
      />
    );
    expect(
      screen.getByRole("button", { name: "Join by code" })
    ).toBeInTheDocument();
  });

  it("omits the description when not provided", () => {
    render(<PageHeader title="Discover" />);
    expect(
      screen.getByRole("heading", { name: "Discover" })
    ).toBeInTheDocument();
  });
});
