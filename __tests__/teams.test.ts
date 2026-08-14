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
        deadline: "2026-08-16T12:00:00.000Z",
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
      deadline: "2026-08-16T12:00:00.000Z",
      chatLink: null,
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

  it("exposes the deadline for the dashboard countdown", async () => {
    const service = makeService({
      getOne: vi.fn(async () => ({
        id: "t3",
        name: "Countdown Crew",
        status: "open",
        rolesNeeded: ["Developer"],
        deadline: "2026-08-16T12:00:00.000Z",
        leader: "u-lead",
        members: ["u-lead"],
        expand: { leader: { id: "u-lead", name: "Arjun Patel" } },
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const detail = await api.fetchTeamDetail("t3");

    expect(detail.deadline).toBe("2026-08-16T12:00:00.000Z");
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

const UPDATED_TEAM = () => ({
  id: "t1",
  name: "Navigators",
  status: "closed",
  rolesNeeded: ["Developer"],
  chatLink: "https://chat.example/invite",
  leader: "u-lead",
  members: ["u-lead", "u-a"],
  expand: {
    leader: { id: "u-lead", name: "Arjun Patel" },
    members: [
      { id: "u-lead", name: "Arjun Patel" },
      { id: "u-a", name: "Priya Sharma" },
    ],
  },
});

describe("teams api — updateTeamSettings", () => {
  it("sends only client-owned fields (chatLink, status, deadline, members)", async () => {
    const service = makeService({ update: vi.fn(async () => UPDATED_TEAM()) });
    const api = createTeamsApi(makeClientWith(service));

    await api.updateTeamSettings("t1", {
      chatLink: "https://chat.example/invite",
      status: "closed",
      deadline: "2026-08-16T12:00:00.000Z",
      members: ["u-lead", "u-a"],
    });

    expect(service.update).toHaveBeenCalledWith("t1", {
      chatLink: "https://chat.example/invite",
      status: "closed",
      deadline: "2026-08-16T12:00:00.000Z",
      members: ["u-lead", "u-a"],
    });
  });

  it("never sends name/leader/inviteCode", async () => {
    const updateMock = vi.fn(
      async (_id: string, _body: Record<string, unknown>) => UPDATED_TEAM()
    );
    const service = makeService({ update: updateMock });
    const api = createTeamsApi(makeClientWith(service));

    await api.updateTeamSettings("t1", { chatLink: "https://x.example" });

    const sent = updateMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(sent.chatLink).toBe("https://x.example");
    expect(sent).not.toHaveProperty("name");
    expect(sent).not.toHaveProperty("leader");
    expect(sent).not.toHaveProperty("inviteCode");
  });
});

describe("teams api — chatLink visibility (§8 privacy, closes the I1 flag)", () => {
  it("exposes chatLink to a member of the team", async () => {
    const service = makeService({
      getOne: vi.fn(async () => ({
        id: "t1",
        name: "Navigators",
        status: "open",
        rolesNeeded: ["Developer"],
        chatLink: "https://chat.example/invite",
        leader: "u-lead",
        members: ["u-lead", "u-me"],
        expand: {
          leader: { id: "u-lead", name: "Arjun Patel" },
          members: [
            { id: "u-lead", name: "Arjun Patel" },
            { id: "u-me", name: "Priya Sharma" },
          ],
        },
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const detail = await api.fetchTeamDetail("t1");

    expect(detail.chatLink).toBe("https://chat.example/invite");
  });

  it("hides chatLink from a non-member", async () => {
    const service = makeService({
      getOne: vi.fn(async () => ({
        id: "t1",
        name: "Navigators",
        status: "open",
        rolesNeeded: ["Developer"],
        chatLink: "https://chat.example/invite",
        leader: "u-lead",
        members: ["u-lead", "u-other"],
        expand: {
          leader: { id: "u-lead", name: "Arjun Patel" },
          members: [
            { id: "u-lead", name: "Arjun Patel" },
            { id: "u-other", name: "Sara Khan" },
          ],
        },
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const detail = await api.fetchTeamDetail("t1");

    expect(detail.chatLink).toBeNull();
  });
});

describe("teams api — fetchAdminTeams", () => {
  it("lists teams without the §10 directory filter (admin sees all)", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 1,
        perPage: 50,
        totalItems: 2,
        totalPages: 1,
        items: [
          {
            id: "t1",
            name: "Alpha Force",
            status: "open",
            rolesNeeded: ["Developer"],
            leader: "u-lead",
            members: ["u-lead", "u-ana"],
            deadline: "2026-09-01 00:00:00.000Z",
            createdAt: "2026-08-01 00:00:00.000Z",
            problemStatement: "p1",
            expand: {
              problemStatement: {
                id: "p1",
                title: "Health AI",
                domain: "Software",
                description: "d",
                source: "faculty",
              },
              leader: { id: "u-lead", name: "Arjun Patel" },
              members: [
                { id: "u-lead", name: "Arjun Patel" },
                { id: "u-ana", name: "Ana Souza" },
              ],
            },
          },
          {
            id: "t2",
            name: "Beta Builders",
            status: "closed",
            rolesNeeded: [],
            leader: "u-bob",
            members: ["u-bob"],
            deadline: "2026-09-01 00:00:00.000Z",
            createdAt: "2026-07-01 00:00:00.000Z",
            problemStatement: "p2",
            expand: {
              problemStatement: {
                id: "p2",
                title: "Drone Swarm",
                domain: "Hardware",
                description: "d",
                source: "faculty",
              },
              leader: { id: "u-bob", name: "Bob Chen" },
              members: [{ id: "u-bob", name: "Bob Chen" }],
            },
          },
        ],
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const result = await api.fetchAdminTeams(1, 50);

    expect(service.getList).toHaveBeenCalledWith(
      1,
      50,
      expect.objectContaining({ filter: "" })
    );
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: "t1",
      name: "Alpha Force",
      status: "open",
      domain: "Software",
      memberCount: 2,
      memberNames: ["Arjun Patel", "Ana Souza"],
      deadline: "2026-09-01 00:00:00.000Z",
    });
    expect(result.items[1]?.status).toBe("closed");
  });

  it("paginates like other list endpoints", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 2,
        perPage: 25,
        totalItems: 30,
        totalPages: 2,
        items: [],
      })),
    });
    const api = createTeamsApi(makeClientWith(service));

    const result = await api.fetchAdminTeams(2, 25);

    expect(result.page).toBe(2);
    expect(result.totalItems).toBe(30);
  });
});
