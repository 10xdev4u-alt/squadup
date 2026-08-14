import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminNavLink from "@/components/admin-nav-link";

const getClientMock = vi.fn();

vi.mock("@/lib/api/client", () => ({
  getClient: () => getClientMock(),
}));

describe("admin nav link", () => {
  it("renders the Admin link for admins", () => {
    getClientMock.mockReturnValue({
      authStore: {
        isValid: true,
        record: { id: "u1", admin: true },
      },
    });
    render(<AdminNavLink />);
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/admin"
    );
  });

  it("renders nothing for non-admins", () => {
    getClientMock.mockReturnValue({
      authStore: {
        isValid: true,
        record: { id: "u1", admin: false },
      },
    });
    const { container } = render(<AdminNavLink />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when signed out", () => {
    getClientMock.mockReturnValue({
      authStore: { isValid: false, record: null },
    });
    const { container } = render(<AdminNavLink />);
    expect(container).toBeEmptyDOMElement();
  });
});
