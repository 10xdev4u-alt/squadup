import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";

const replaceMock = vi.fn();
vi.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

let client = makeClient(makeService());
vi.mock("@/lib/api/client", () => ({
  getClient: () => client,
}));

import Discover from "@/pages/discover";

describe("discover page", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    client = makeClient(makeService());
  });

  it("renders the empty-state placeholder when authenticated", () => {
    client = makeClient(
      makeService(),
      makeAuthStore({ record: { id: "u1" }, isValid: true, token: "tok" })
    );
    render(<Discover />);
    expect(
      screen.getByText("Your match deck will appear here.")
    ).toBeInTheDocument();
  });

  it("redirects unauthenticated visitors to /auth", () => {
    render(<Discover />);
    expect(replaceMock).toHaveBeenCalledWith("/auth");
  });
});
