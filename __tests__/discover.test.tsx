import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";

vi.mock("next/router", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

let client = makeClient(makeService());
vi.mock("@/lib/api/client", () => ({
  getClient: () => client,
}));

import Discover from "@/pages/discover";

describe("Discover page", () => {
  it("shows the discover heading", () => {
    render(<Discover />);
    expect(
      screen.getByRole("heading", { name: "Discover" })
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no teams to swipe yet", () => {
    render(<Discover />);
    expect(
      screen.getByRole("heading", { name: "No squads to swipe yet" })
    ).toBeInTheDocument();
  });
});
