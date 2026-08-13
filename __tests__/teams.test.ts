import { describe, expect, it, vi } from "vitest";
import { ClientResponseError } from "pocketbase";
import { createTeamsApi } from "@/lib/api/teams";
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

const teamRecord = {
  id: "t1",
  name: "Hackstreet Boys",
  problemStatement: "ps1",
  inviteCode: "SECRET-CODE",
  status: "open",
  rolesNeeded: ["Developer"],
  leader: "u1",
  members: ["u1", "u2"],
  chatLink: "https://discord.gg/secret",
  createdAt: "2026-08-13 10:00:00.000Z",
};

describe("teams api", () => {
  it("maps a team record to TeamCard, dropping private fields", async () => {
    const service = makeService({ getOne: vi.fn(async () => teamRecord) });
    const api = createTeamsApi(makeClient(service));

    const card = await api.fetchTeamCard("t1");

    expect(card).toEqual({
      id: "t1",
      name: "Hackstreet Boys",
      problemStatement: "ps1",
      status: "open",
      rolesNeeded: ["Developer"],
    });
    // Privacy rule (§8): members + chatLink must never leave the module.
    expect("members" in card).toBe(false);
    expect("chatLink" in card).toBe(false);
  });

  it("fetches a paginated directory of TeamCards", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 2,
        perPage: 20,
        totalItems: 42,
        totalPages: 3,
        items: [teamRecord],
      })),
    });
    const api = createTeamsApi(makeClient(service));

    const result = await api.fetchTeamCards(2);

    expect(service.getList).toHaveBeenCalledWith(2, 20, expect.anything());
    const first = result.items[0]!;
    expect(first).toMatchObject({ id: "t1", name: "Hackstreet Boys" });
    expect(result.totalItems).toBe(42);
    expect("chatLink" in first).toBe(false);
  });

  it("creates a team sending only client-owned fields", async () => {
    const service = makeService({ create: vi.fn(async () => teamRecord) });
    const api = createTeamsApi(makeClient(service));

    await api.createTeam({
      name: "Hackstreet Boys",
      problemStatement: "ps1",
      rolesNeeded: ["Developer", "Designer"],
    });

    expect(service.create).toHaveBeenCalledWith({
      name: "Hackstreet Boys",
      problemStatement: "ps1",
      rolesNeeded: ["Developer", "Designer"],
    });
  });

  it("normalizes SDK failures into typed ApiErrors", async () => {
    const service = makeService({
      getOne: vi.fn(async () => {
        throw new ClientResponseError({
          url: "http://127.0.0.1:8090/api/collections/teams/records/t1",
          status: 404,
          response: { code: 404, message: "missing", data: {} },
        });
      }),
    });
    const api = createTeamsApi(makeClient(service));

    await expect(api.fetchTeamCard("t1")).rejects.toMatchObject({
      kind: "not_found",
      status: 404,
    });
  });
});
