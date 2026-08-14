import { describe, expect, it } from "vitest";
import { MSG, ensureMembersAreFree, userHasTeam } from "./hooks-common.js";

/**
 * Fake PB app whose findRecordsByFilter answers membership queries with
 * ?~ semantics (params.id contained in the members array).
 */
function makeApp(teams) {
  return {
    findRecordsByFilter(collection, filter, sort, limit, offset, params) {
      if (collection !== "teams") return [];
      const id = params && params.id;
      return teams.filter((t) => (t.members || []).includes(id));
    },
  };
}

describe("ensureMembersAreFree", () => {
  it("accepts a user not in any other team", () => {
    const app = makeApp([{ id: "t1", members: ["u1"] }]);
    expect(() => ensureMembersAreFree(app, ["u2"], null)).not.toThrow();
  });

  it("rejects a user already in another team", () => {
    const app = makeApp([{ id: "t1", members: ["u1"] }]);
    expect(() => ensureMembersAreFree(app, ["u1"], null)).toThrow(
      MSG.SINGLE_TEAM
    );
  });

  it("ignores the excluded team on member updates", () => {
    const app = makeApp([{ id: "t1", members: ["u1"] }]);
    expect(() => ensureMembersAreFree(app, ["u1"], "t1")).not.toThrow();
  });

  it("checks every member, not just the first", () => {
    const app = makeApp([{ id: "t1", members: ["u2"] }]);
    expect(() => ensureMembersAreFree(app, ["u1", "u2"], null)).toThrow(
      MSG.SINGLE_TEAM
    );
  });
});

describe("userHasTeam", () => {
  it("is false for a user with no team", () => {
    const app = makeApp([{ id: "t1", members: ["u1"] }]);
    expect(userHasTeam(app, "u2", null)).toBe(false);
  });

  it("is true for a user in another team", () => {
    const app = makeApp([{ id: "t1", members: ["u1"] }]);
    expect(userHasTeam(app, "u1", null)).toBe(true);
  });

  it("is false when the only team is the excluded one", () => {
    const app = makeApp([{ id: "t1", members: ["u1"] }]);
    expect(userHasTeam(app, "u1", "t1")).toBe(false);
  });

  it("is false for a member list that is empty or missing", () => {
    const app = makeApp([{ id: "t1", members: [] }]);
    expect(userHasTeam(app, "u1", null)).toBe(false);
  });
});
