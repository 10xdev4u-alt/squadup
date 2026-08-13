import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Layout from "@/components/Layout";

describe("layout", () => {
  it("renders the SquadUp wordmark and its children", () => {
    render(
      <Layout>
        <p>page content</p>
      </Layout>
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("SquadUp")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });
});
