import { describe, expect, it, vi } from "vitest";
import { createSwipesApi } from "@/lib/api/swipes";
import {
  makeAuthStore,
  makeClient,
  makeService,
} from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeDeckClient(overrides: {
  me?: Record<string, unknown>;
  users?: Record<string, unknown>[];
  swipes?: Record<string, unknown>[];
}): {
  client: PbClient;
  usersService: PbRecordService;
  swipesService: PbRecordService;
} {
  const usersService = makeService({
    getOne: vi.fn(async () => overrides.me ?? {}),
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 200,
      totalItems: overrides.users?.length ?? 0,
      totalPages: 1,
      items: overrides.users ?? [],
    })),
  });
  const swipesService = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 200,
      totalItems: overrides.swipes?.length ?? 0,
      totalPages: 1,
      items: overrides.swipes ?? [],
    })),
  });
  const client: PbClient = {
    collection: vi.fn((name: string) =>
      name === "swipes" ? swipesService : usersService
    ),
    authStore: makeAuthStore({
      record: { id: "u-me" },
      isValid: true,
    }),
  };
  return { client, usersService, swipesService };
}

const ME = {
  id: "u-me",
  name: "Me",
  collegeId: "c1",
  avatar: null,
  bio: "",
  githubUrl: null,
  skills: ["Frontend", "Backend"],
  primaryRole: "Developer",
  status: "solo",
  lookingFor: "",
};

function user(id: string, skills: string[], role = "Developer") {
  return { ...ME, id, name: `User ${id}`, skills, primaryRole: role };
}

describe("swipes api — fetchDeck", () => {
  it("fetches solo users plus my swipes and returns a sorted deck", async () => {
    const { client, usersService, swipesService } = makeDeckClient({
      me: ME,
      users: [
        user("u-a", ["Frontend", "Backend"]), // overlap 2 → 20
        user("u-b", ["Research"], "Researcher"), // overlap 0 + boost → 5
        user("u-swiped", ["Frontend", "Backend"]),
      ],
      swipes: [{ id: "s1", fromUser: "u-me", toUser: "u-swiped" }],
    });
    const api = createSwipesApi(client);

    const deck = await api.fetchDeck();

    // Only solo users are fetched, and only my outgoing swipes are used
    // (the swipes listRule already guarantees fromUser = me server-side).
    expect(usersService.getList).toHaveBeenCalledWith(
      1,
      200,
      expect.objectContaining({ filter: "status = 'solo'" })
    );
    expect(swipesService.getList).toHaveBeenCalledWith(
      1,
      200,
      expect.objectContaining({ filter: "fromUser = 'u-me'" })
    );
    // Sorted by score desc; swiped user excluded.
    expect(deck.map((c) => c.id)).toEqual(["u-a", "u-b"]);
    expect(deck[0]?.score).toBe(20);
  });

  it("throws a normalized error when unauthenticated", async () => {
    const service = makeService();
    const client = makeClient(service, makeAuthStore());
    const api = createSwipesApi(client);

    await expect(api.fetchDeck()).rejects.toThrow();
  });

  it("returns an empty deck when everyone is swiped", async () => {
    const { client } = makeDeckClient({
      me: ME,
      users: [user("u-a", ["Frontend"])],
      swipes: [{ id: "s1", fromUser: "u-me", toUser: "u-a" }],
    });
    const api = createSwipesApi(client);

    const deck = await api.fetchDeck();

    expect(deck).toEqual([]);
  });

  it("normalizes fetch errors through the error boundary", async () => {
    const { client, usersService } = makeDeckClient({ me: ME });
    usersService.getList = vi.fn(async () => {
      throw new Error("boom");
    });
    const api = createSwipesApi(client);

    await expect(api.fetchDeck()).rejects.toThrow(
      "Something went wrong on our end. Please try again."
    );
  });
});
