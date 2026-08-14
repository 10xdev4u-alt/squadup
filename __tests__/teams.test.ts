import { describe, expect, it, vi } from "vitest";
import { createTeamsApi } from "@/lib/api/teams";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";

describe("teams api — fetchProblemStatements", () => {
  it("returns problem statements as DTOs", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 1,
        perPage: 100,
        totalItems: 2,
        totalPages: 1,
        items: [
          {
            id: "p1",
            title: "Smart campus navigation",
            domain: "Smart Cities",
          },
          { id: "p2", title: "Farm yield prediction", domain: "Agriculture" },
        ],
      })),
    });
    const client = makeClientWith(service);
    const api = createTeamsApi(client);

    const statements = await api.fetchProblemStatements();

    expect(statements).toEqual([
      { id: "p1", title: "Smart campus navigation", domain: "Smart Cities" },
      { id: "p2", title: "Farm yield prediction", domain: "Agriculture" },
    ]);
  });

  it("returns an empty list when none exist", async () => {
    const service = makeService();
    const api = createTeamsApi(makeClientWith(service));

    expect(await api.fetchProblemStatements()).toEqual([]);
  });
});

function makeClientWith(service: ReturnType<typeof makeService>) {
  return {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
  };
}
