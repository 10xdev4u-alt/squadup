import { describe, expect, it } from "vitest";
import {
  aggregateActivity,
  aggregateDomains,
  aggregateTicketVolume,
} from "@/lib/analytics";
import type { AdminTeamRow } from "@/lib/api/teams";
import type { MentorTicket } from "@/types/squadup";

function teamRow(overrides: Partial<AdminTeamRow> = {}): AdminTeamRow {
  return {
    id: "t1",
    name: "Alpha Force",
    status: "open",
    domain: "Software",
    memberCount: 2,
    memberNames: ["Arjun Patel", "Ana Souza"],
    deadline: "2026-09-01 00:00:00.000Z",
    createdAt: "2026-08-01 00:00:00.000Z",
    ...overrides,
  };
}

function ticket(overrides: Partial<MentorTicket> = {}): MentorTicket {
  return {
    id: "tk1",
    team: "t1",
    title: "Help with AWS",
    status: "open",
    assignedMentor: null,
    createdAt: "2026-08-01 00:00:00.000Z",
    ...overrides,
  };
}

describe("aggregateDomains", () => {
  it("counts teams per domain, sorted by count desc", () => {
    const rows = [
      teamRow({ id: "t1", domain: "Software" }),
      teamRow({ id: "t2", name: "Beta", domain: "Software" }),
      teamRow({ id: "t3", name: "Gamma", domain: "Hardware" }),
    ];

    expect(aggregateDomains(rows)).toEqual([
      { domain: "Software", count: 2 },
      { domain: "Hardware", count: 1 },
    ]);
  });

  it("returns an empty list for no teams", () => {
    expect(aggregateDomains([])).toEqual([]);
  });
});

describe("aggregateActivity", () => {
  const teams = [
    teamRow({ id: "t1" }),
    teamRow({ id: "t2", name: "Beta Builders" }),
  ];

  it("counts tasks + resources per team, sorted desc", () => {
    const tasks = [
      { id: "a", team: "t1" },
      { id: "b", team: "t1" },
      { id: "c", team: "t2" },
    ];
    const resources = [{ id: "r", team: "t1" }];

    expect(aggregateActivity(teams, tasks, resources)).toEqual([
      { teamId: "t1", teamName: "Alpha Force", count: 3 },
      { teamId: "t2", teamName: "Beta Builders", count: 1 },
    ]);
  });

  it("includes zero-activity teams at the bottom", () => {
    const tasks = [{ id: "a", team: "t2" }];
    const resources: { id: string; team: string }[] = [];

    expect(aggregateActivity(teams, tasks, resources)).toEqual([
      { teamId: "t2", teamName: "Beta Builders", count: 1 },
      { teamId: "t1", teamName: "Alpha Force", count: 0 },
    ]);
  });
});

describe("aggregateTicketVolume", () => {
  it("counts tickets by status and reports a total", () => {
    const tickets = [
      ticket({ id: "a", status: "open" }),
      ticket({ id: "b", status: "open" }),
      ticket({ id: "c", status: "in_progress" }),
      ticket({ id: "d", status: "resolved" }),
    ];

    expect(aggregateTicketVolume(tickets)).toEqual({
      byStatus: [
        { status: "open", count: 2 },
        { status: "in_progress", count: 1 },
        { status: "resolved", count: 1 },
      ],
      total: 4,
    });
  });

  it("handles no tickets", () => {
    expect(aggregateTicketVolume([])).toEqual({
      byStatus: [],
      total: 0,
    });
  });
});
