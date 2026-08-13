import { describe, expect, it, vi } from "vitest";
import { createSwipesApi } from "@/lib/api/swipes";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeService(overrides: Partial<PbRecordService> = {}): PbRecordService {
  return {
    getOne: vi.fn(async () => ({})),
    getList: vi.fn(async () => ({ page: 1, perPage: 20, totalItems: 0, totalPages: 0, items: [] })),
    create: vi.fn(async () => ({})),
    ...overrides,
  };
}

function makeClient(service: PbRecordService): PbClient {
  return { collection: vi.fn(() => service) };
}

describe("swipes api", () => {
  it("records a swipe sending only toUser and direction", async () => {
    const service = makeService({
      create: vi.fn(async () => ({
        id: "s1",
        fromUser: "u-me",
        toUser: "u-them",
        direction: "right",
        createdAt: "2026-08-13 10:00:00.000Z",
      })),
    });
    const api = createSwipesApi(makeClient(service));

    const swipe = await api.recordSwipe({ toUser: "u-them", direction: "right" });

    // §8 rule: fromUser is derived server-side from the auth token — the
    // client must never send it.
    expect(service.create).toHaveBeenCalledWith({
      toUser: "u-them",
      direction: "right",
    });
    expect(swipe).toEqual({
      id: "s1",
      fromUser: "u-me",
      toUser: "u-them",
      direction: "right",
      createdAt: "2026-08-13 10:00:00.000Z",
    });
  });
});
