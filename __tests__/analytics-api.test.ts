import { describe, expect, it, vi } from "vitest";
import { createAnalyticsApi } from "@/lib/api/analytics";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeClientWith(service: PbRecordService): PbClient {
  return {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({
      record: { id: "u-admin", admin: true },
      isValid: true,
    }),
  };
}

describe("analytics api", () => {
  it("bundles teams, tasks, resources, and tickets into one DTO", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 1,
        perPage: 200,
        totalItems: 1,
        totalPages: 1,
        items: [],
      })),
    });
    const api = createAnalyticsApi(makeClientWith(service));

    const data = await api.fetchAdminAnalytics();

    expect(data.teams).toBeDefined();
    expect(data.tasks).toBeDefined();
    expect(data.resources).toBeDefined();
    expect(data.tickets).toBeDefined();
    // Four collections hit (teams, tasks, resources, tickets).
    expect(service.getList).toHaveBeenCalledTimes(4);
  });

  it("normalizes failures into typed ApiErrors", async () => {
    const service = makeService({
      getList: vi.fn(async () => {
        throw new Error("fetch failed");
      }),
    });
    const api = createAnalyticsApi(makeClientWith(service));

    await expect(api.fetchAdminAnalytics()).rejects.toMatchObject({
      kind: "server",
    });
  });
});
