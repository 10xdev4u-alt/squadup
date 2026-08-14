import { describe, expect, it } from "vitest";
import { filterAdminTeams } from "@/lib/admin-filter";
import type { AdminTeamRow } from "@/lib/api/teams";

function row(overrides: Partial<AdminTeamRow> = {}): AdminTeamRow {
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

const rows = [
  row(),
  row({
    id: "t2",
    name: "Beta Builders",
    status: "closed",
    domain: "Hardware",
    memberCount: 1,
    memberNames: ["Bob Chen"],
  }),
  row({ id: "t3", name: "Gamma Go", memberNames: ["Dee"] }),
];

describe("filterAdminTeams", () => {
  it("returns everything with no filters", () => {
    expect(filterAdminTeams(rows, {})).toHaveLength(3);
  });

  it("filters by status", () => {
    const out = filterAdminTeams(rows, { status: "closed" });
    expect(out.map((r) => r.name)).toEqual(["Beta Builders"]);
  });

  it("filters by domain", () => {
    const out = filterAdminTeams(rows, { domain: "Software" });
    expect(out.map((r) => r.name)).toEqual(["Alpha Force", "Gamma Go"]);
  });

  it("searches the team name case-insensitively", () => {
    const out = filterAdminTeams(rows, { query: "alpha" });
    expect(out.map((r) => r.name)).toEqual(["Alpha Force"]);
  });

  it("searches member names too", () => {
    const out = filterAdminTeams(rows, { query: "bob" });
    expect(out.map((r) => r.name)).toEqual(["Beta Builders"]);
  });

  it("combines filters", () => {
    const out = filterAdminTeams(rows, {
      status: "open",
      domain: "Software",
    });
    expect(out.map((r) => r.name)).toEqual(["Alpha Force", "Gamma Go"]);
  });
});
