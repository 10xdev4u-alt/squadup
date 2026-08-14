import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Layout from "@/components/Layout";

describe("layout mobile navigation", () => {
  it("hides the menu button on desktop by default but renders the toggle", () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>
    );
    expect(
      screen.getByRole("button", { name: "Open navigation menu" })
    ).toBeInTheDocument();
    // Desktop nav links are present in the DOM.
    expect(
      screen.getByRole("navigation", { name: "Main" })
    ).toBeInTheDocument();
  });

  it("opens the mobile menu and exposes the nav links", () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Open navigation menu" })
    );
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    expect(mobile).toBeInTheDocument();
    expect(mobile.querySelector('a[href="/discover"]')).not.toBeNull();
    expect(mobile.querySelector('a[href="/matches"]')).not.toBeNull();
    expect(mobile.querySelector('a[href="/teams"]')).not.toBeNull();
    expect(mobile.querySelector('a[href="/profile"]')).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Close navigation menu" })
    ).toBeInTheDocument();
  });

  it("toggles the menu open and closed", () => {
    render(
      <Layout>
        <p>content</p>
      </Layout>
    );
    const toggle = screen.getByRole("button", { name: "Open navigation menu" });
    fireEvent.click(toggle);
    expect(
      screen.getByRole("navigation", { name: "Mobile" })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Close navigation menu" })
    );
    expect(
      screen.queryByRole("navigation", { name: "Mobile" })
    ).not.toBeInTheDocument();
  });
});
