import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Reset module registry + env between tests so the singleton rebuilds.
const envBackup: Record<string, string | undefined> = {};

beforeEach(() => {
  envBackup.NEXT_PUBLIC_PB_URL = process.env.NEXT_PUBLIC_PB_URL;
  vi.resetModules();
});

afterEach(() => {
  process.env.NEXT_PUBLIC_PB_URL = envBackup.NEXT_PUBLIC_PB_URL;
});

describe("pb client", () => {
  it("defaults to the local PocketBase URL when env is unset", async () => {
    delete process.env.NEXT_PUBLIC_PB_URL;
    const { getClient } = await import("@/lib/api/client");
    const client = getClient();
    expect(client.baseURL).toBe("http://127.0.0.1:8090");
  });

  it("uses NEXT_PUBLIC_PB_URL when set", async () => {
    process.env.NEXT_PUBLIC_PB_URL = "https://pb.squadup.app";
    const { getClient } = await import("@/lib/api/client");
    expect(getClient().baseURL).toBe("https://pb.squadup.app");
  });

  it("returns the same singleton instance across calls", async () => {
    const { getClient } = await import("@/lib/api/client");
    expect(getClient()).toBe(getClient());
  });
});
