import { describe, expect, it, vi } from "vitest";
import { createSwipesApi } from "@/lib/api/swipes";
import { makeClient, makeService } from "@/__tests__/helpers/client";

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

    const swipe = await api.recordSwipe({
      toUser: "u-them",
      direction: "right",
    });

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
