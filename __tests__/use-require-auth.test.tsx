import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";

const replaceMock = vi.fn();

vi.mock("next/router", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

// A mutable client whose authStore we flip between tests.
let client = makeClient(makeService());

vi.mock("@/lib/api/client", () => ({
  getClient: () => client,
}));

import { useRequireAuth } from "@/lib/use-require-auth";

function GuardProbe() {
  const authed = useRequireAuth();
  return <div>{authed ? "AUTHED" : "LOCKED"}</div>;
}

describe("useRequireAuth", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    client = makeClient(makeService());
  });

  it("renders through and does not redirect when authenticated", async () => {
    client = makeClient(
      makeService(),
      makeAuthStore({ record: { id: "u1" }, isValid: true, token: "tok" })
    );
    render(<GuardProbe />);
    expect(screen.getByText("AUTHED")).toBeInTheDocument();
    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });

  it("redirects to /auth when unauthenticated", async () => {
    render(<GuardProbe />);
    expect(screen.getByText("LOCKED")).toBeInTheDocument();
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/auth"));
  });

  it("uses the supplied redirect target", async () => {
    function CustomGuard() {
      const authed = useRequireAuth("/login");
      return <div>{authed ? "AUTHED" : "LOCKED"}</div>;
    }
    render(<CustomGuard />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });
});
