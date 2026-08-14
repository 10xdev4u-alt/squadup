import { describe, expect, it, vi } from "vitest";
import { createMatchesApi } from "@/lib/api/matches";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeMatchesClient(overrides: {
  meId?: string;
  matches?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
}): {
  client: PbClient;
  matchesService: PbRecordService;
  messagesService: PbRecordService;
} {
  const meId = overrides.meId ?? "u-me";
  const matchesService = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 50,
      totalItems: overrides.matches?.length ?? 0,
      totalPages: 1,
      items: overrides.matches ?? [],
    })),
  });
  const messagesService = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 200,
      totalItems: overrides.messages?.length ?? 0,
      totalPages: 1,
      items: overrides.messages ?? [],
    })),
    create: vi.fn(async () => ({})),
    subscribe: vi.fn(async () => vi.fn(async () => {})),
  });
  const client: PbClient = {
    collection: vi.fn((name: string) =>
      name === "match_messages" ? messagesService : matchesService
    ),
    authStore: makeAuthStore({ record: { id: meId }, isValid: true }),
  };
  return { client, matchesService, messagesService };
}

function makeSubscribeClient() {
  let callback:
    | ((event: { action: string; record: Record<string, unknown> }) => void)
    | null = null;
  const stop = vi.fn(async () => {});
  const service = makeService({
    subscribe: vi.fn(
      async (
        _topic: string,
        cb: (event: {
          action: string;
          record: Record<string, unknown>;
        }) => void,
        _options?: Record<string, unknown>
      ) => {
        callback = cb;
        return stop;
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
    stop,
    fire: (record: Record<string, unknown>) =>
      callback?.({ action: "create", record }),
  };
}

describe("matches api — fetchMatches", () => {
  it("returns match cards with the partner resolved against me", async () => {
    const { client, matchesService } = makeMatchesClient({
      meId: "u-me",
      matches: [
        {
          id: "m1",
          userA: "u-me",
          userB: "u-other",
          status: "active",
          createdAt: "2026-08-14 10:00:00.000Z",
          expand: {
            userA: { id: "u-me", name: "Me" },
            userB: { id: "u-other", name: "Priya Sharma" },
          },
        },
      ],
    });
    const api = createMatchesApi(client);

    const cards = await api.fetchMatches();

    expect(matchesService.getList).toHaveBeenCalledWith(
      1,
      50,
      expect.objectContaining({ expand: "userA,userB" })
    );
    expect(cards).toEqual([
      {
        id: "m1",
        partnerId: "u-other",
        partnerName: "Priya Sharma",
        createdAt: "2026-08-14 10:00:00.000Z",
      },
    ]);
  });

  it("resolves the partner from the other side of the match", async () => {
    const { client } = makeMatchesClient({
      meId: "u-me",
      matches: [
        {
          id: "m2",
          userA: "u-other",
          userB: "u-me",
          createdAt: "2026-08-14 09:00:00.000Z",
          expand: {
            userA: { id: "u-other", name: "Arjun Patel" },
            userB: { id: "u-me", name: "Me" },
          },
        },
      ],
    });
    const api = createMatchesApi(client);

    const cards = await api.fetchMatches();

    expect(cards[0]?.partnerName).toBe("Arjun Patel");
  });

  it("returns an empty list when there are no matches", async () => {
    const { client } = makeMatchesClient({});
    const api = createMatchesApi(client);

    expect(await api.fetchMatches()).toEqual([]);
  });
});

describe("matches api — messages", () => {
  it("fetches messages for a match, oldest first", async () => {
    const { client, messagesService } = makeMatchesClient({
      messages: [
        {
          id: "msg1",
          match: "m1",
          sender: "u-me",
          message: "Hi!",
          createdAt: "2026-08-14 10:00:00.000Z",
        },
        {
          id: "msg2",
          match: "m1",
          sender: "u-other",
          message: "Hey!",
          createdAt: "2026-08-14 10:01:00.000Z",
        },
      ],
    });
    const api = createMatchesApi(client);

    const messages = await api.fetchMessages("m1");

    expect(messagesService.getList).toHaveBeenCalledWith(
      1,
      200,
      expect.objectContaining({ filter: "match = 'm1'" })
    );
    expect(messages.map((m) => m.id)).toEqual(["msg1", "msg2"]);
  });

  it("sends a message with only match + message (sender is server-derived)", async () => {
    const { client, messagesService } = makeMatchesClient({
      messages: [],
    });
    messagesService.create = vi.fn(async () => ({
      id: "msg3",
      match: "m1",
      sender: "u-me",
      message: "Let's build!",
      createdAt: "2026-08-14 10:02:00.000Z",
    }));
    const api = createMatchesApi(client);

    const sent = await api.sendMessage("m1", "Let's build!");

    // §8 pattern: the client never sends sender — the hook derives it.
    expect(messagesService.create).toHaveBeenCalledWith({
      match: "m1",
      message: "Let's build!",
    });
    expect(sent.message).toBe("Let's build!");
  });
});

describe("matches api — subscribeMessages", () => {
  it("subscribes to the match thread with a filter", async () => {
    const { client, service } = makeSubscribeClient();
    const api = createMatchesApi(client);

    await api.subscribeMessages("m1", () => {});

    expect(service.subscribe).toHaveBeenCalledWith(
      "*",
      expect.any(Function),
      expect.objectContaining({ filter: "match = 'm1'" })
    );
  });

  it("delivers new messages and dedupes replays on reconnect", async () => {
    const { client, fire } = makeSubscribeClient();
    const api = createMatchesApi(client);
    const onMessage = vi.fn();

    await api.subscribeMessages("m1", onMessage);
    const msg = {
      id: "msg9",
      match: "m1",
      sender: "u-other",
      message: "Ready when you are",
      createdAt: "2026-08-14 10:10:00.000Z",
    };

    fire(msg);
    fire(msg); // reconnect replay — must be dropped

    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({
      id: "msg9",
      match: "m1",
      sender: "u-other",
      message: "Ready when you are",
      createdAt: "2026-08-14 10:10:00.000Z",
    });
  });

  it("returns an unsubscribe handle", async () => {
    const { client, stop } = makeSubscribeClient();
    const api = createMatchesApi(client);

    const unsubscribe = await api.subscribeMessages("m1", () => {});
    await unsubscribe();

    expect(stop).toHaveBeenCalledOnce();
  });
});
