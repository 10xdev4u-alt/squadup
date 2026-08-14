import { describe, expect, it, vi } from "vitest";
import { createTeamsApi } from "@/lib/api/teams";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeClientWith(
  service: PbRecordService
): PbClient & { collection: ReturnType<typeof vi.fn> } {
  return {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
  };
}

describe("teams api — fetchTeamCards", () => {
  it("lists open teams with a non-empty rolesNeeded (§10 guard)", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 1,
        perPage: 12,
        totalItems: 1,
        totalPages: 1,
        items: [
          {
            id: "t1",
            name: "Navigators",
            problemStatement: "p1",
            status: "open",
            rolesNeeded: ["Developer"],
          },
        ],
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const result = await api.fetchTeamCards(1, 12);

    // §10 directory rule is always applied server-side.
    expect(service.getList).toHaveBeenCalledWith(
      1,
      12,
      expect.objectContaining({
        filter: "status = 'open' && rolesNeeded != null",
      })
    );
    expect(result.items[0]?.name).toBe("Navigators");
  });

  it("appends a role filter to the §10 guard", async () => {
    const service = makeService();
    const api = createTeamsApi(makeClientWith(service));

    await api.fetchTeamCards(1, 12, { role: "Designer" });

    expect(service.getList).toHaveBeenCalledWith(
      1,
      12,
      expect.objectContaining({
        filter:
          "status = 'open' && rolesNeeded != null && rolesNeeded ?~ 'Designer'",
      })
    );
  });
});

describe("teams api — fetchTeamDetail", () => {
  it("returns the expanded detail and drops private fields", async () => {
    const service = makeService({
      getOne: vi.fn(async () => ({
        id: "t1",
        name: "Navigators",
        status: "open",
        rolesNeeded: ["Developer", "Designer"],
        inviteCode: "ABC12345",
        chatLink: "https://chat.example/secret",
        problemStatement: "p1",
        leader: "u-lead",
        members: ["u-lead", "u-dev"],
        expand: {
          problemStatement: {
            id: "p1",
            title: "Smart campus navigation",
            domain: "Smart Cities",
          },
          leader: { id: "u-lead", name: "Arjun Patel" },
          members: [
            { id: "u-lead", name: "Arjun Patel" },
            { id: "u-dev", name: "Priya Sharma" },
          ],
        },
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const detail = await api.fetchTeamDetail("t1");

    expect(service.getOne).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ expand: "leader,members,problemStatement" })
    );
    // §8 privacy: chatLink + inviteCode never cross the boundary.
    expect(detail).toEqual({
      id: "t1",
      name: "Navigators",
      status: "open",
      rolesNeeded: ["Developer", "Designer"],
      problemStatement: {
        id: "p1",
        title: "Smart campus navigation",
        domain: "Smart Cities",
      },
      leader: { id: "u-lead", name: "Arjun Patel" },
      members: [
        { id: "u-lead", name: "Arjun Patel" },
        { id: "u-dev", name: "Priya Sharma" },
      ],
    });
  });

  it("handles a team with no problem statement", async () => {
    const service = makeService({
      getOne: vi.fn(async () => ({
        id: "t2",
        name: "Solo Squad",
        status: "open",
        rolesNeeded: ["PM"],
        problemStatement: "",
        leader: "u-lead",
        members: ["u-lead"],
        expand: { leader: { id: "u-lead", name: "Arjun Patel" } },
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const detail = await api.fetchTeamDetail("t2");

    expect(detail.problemStatement).toBeNull();
  });
});

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
    const api = createTeamsApi(makeClientWith(service));

    const statements = await api.fetchProblemStatements();

    expect(statements).toEqual([
      { id: "p1", title: "Smart campus navigation", domain: "Smart Cities" },
      { id: "p2", title: "Farm yield prediction", domain: "Agriculture" },
    ]);
  });

  it("returns an empty list when none exist", async () => {
    const api = createTeamsApi(makeClientWith(makeService()));
    expect(await api.fetchProblemStatements()).toEqual([]);
  });
});
