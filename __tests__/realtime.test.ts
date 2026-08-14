import { describe, expect, it, vi } from "vitest";
import { createRealtimeApi } from "@/lib/api/realtime";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, SubscriptionEvent } from "@/lib/api/types";

function makeRealtimeClient() {
  let callback: ((event: SubscriptionEvent) => void) | null = null;
  const unsubscribe = vi.fn(async () => {});
  const service = makeService({
    subscribe: vi.fn(
      async (
        _topic: string,
        cb: (event: SubscriptionEvent) => void,
        _options?: Record<string, unknown>
      ) => {
        callback = cb;
        return unsubscribe;
      }
    ),
  });
  const client: PbClient = {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
  };
  return {
    client,
    service,
    unsubscribe,
    fire: (event: SubscriptionEvent) => callback?.(event),
  };
}

describe("realtime api — subscribeMatches", () => {
  it("subscribes to matches involving me with expand", async () => {
    const { client, service } = makeRealtimeClient();
    const api = createRealtimeApi(client);

    await api.subscribeMatches("u-me", () => {});

    expect(service.subscribe).toHaveBeenCalledWith(
      "*",
      expect.any(Function),
      expect.objectContaining({
        filter: "userA = 'u-me' || userB = 'u-me'",
        expand: "userA,userB",
      })
    );
  });

  it("fires with the partner name from the expanded record", async () => {
    const { client, fire } = makeRealtimeClient();
    const api = createRealtimeApi(client);
    const onMatch = vi.fn();

    await api.subscribeMatches("u-me", onMatch);
    fire({
      action: "create",
      record: {
        id: "m1",
        userA: "u-me",
        userB: "u-other",
        status: "active",
        expand: { userA: { name: "Me" }, userB: { name: "Priya Sharma" } },
      },
    });

    expect(onMatch).toHaveBeenCalledWith({
      id: "m1",
      userA: "u-me",
      userB: "u-other",
      partnerName: "Priya Sharma",
    });
  });

  it("resolves the partner from the other side of the match", async () => {
    const { client, fire } = makeRealtimeClient();
    const api = createRealtimeApi(client);
    const onMatch = vi.fn();

    await api.subscribeMatches("u-me", onMatch);
    fire({
      action: "create",
      record: {
        id: "m2",
        userA: "u-other",
        userB: "u-me",
        expand: { userA: { name: "Arjun Patel" }, userB: { name: "Me" } },
      },
    });

    expect(onMatch).toHaveBeenCalledWith(
      expect.objectContaining({ partnerName: "Arjun Patel" })
    );
  });

  it("returns an unsubscribe handle", async () => {
    const { client, unsubscribe } = makeRealtimeClient();
    const api = createRealtimeApi(client);

    const stop = await api.subscribeMatches("u-me", () => {});
    await stop();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
