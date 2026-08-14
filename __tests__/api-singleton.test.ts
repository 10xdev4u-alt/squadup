import { describe, expect, it, vi } from "vitest";

const getClientMock = vi.fn(() => ({}));

vi.mock("@/lib/api/client", () => ({
  getClient: () => getClientMock(),
}));

describe("api facade", () => {
  it("builds the facade exactly once and reuses it", async () => {
    vi.resetModules();
    getClientMock.mockClear();
    const { api } = await import("@/lib/api");

    const first = api();
    const second = api();

    expect(second).toBe(first);
    expect(getClientMock).toHaveBeenCalledTimes(1);
  });
});
