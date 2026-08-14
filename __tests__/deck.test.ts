import { describe, expect, it } from "vitest";
import { buildDeck, scoreCandidate } from "@/lib/matching/deck";
import type { User } from "@/types/squadup";

function makeUser(
  overrides: Partial<Pick<User, "id" | "skills" | "primaryRole">> = {}
): User {
  return {
    id: "u1",
    name: "Test User",
    collegeId: "c1",
    avatar: null,
    bio: "",
    githubUrl: null,
    skills: ["Frontend"],
    primaryRole: "Developer",
    status: "solo",
    lookingFor: "",
    ...overrides,
  };
}

describe("scoreCandidate", () => {
  it("scores shared skills as the overlap count times 10", () => {
    const me = makeUser({ id: "me", skills: ["Frontend", "Backend"] });
    const candidate = makeUser({
      id: "them",
      skills: ["Frontend", "Backend", "DevOps"],
    });

    expect(scoreCandidate(me, candidate)).toBe(20);
  });

  it("boosts complementary primary roles by 5 (the §10 boost)", () => {
    const me = makeUser({ id: "me", primaryRole: "Developer" });
    const candidate = makeUser({ id: "them", primaryRole: "Designer" });

    expect(scoreCandidate(me, candidate)).toBe(15); // 0 shared + 5 boost
  });

  it("does not boost identical primary roles", () => {
    const me = makeUser({
      id: "me",
      primaryRole: "Developer",
      skills: ["Frontend"],
    });
    const candidate = makeUser({
      id: "them",
      primaryRole: "Developer",
      skills: ["Backend"],
    });

    expect(scoreCandidate(me, candidate)).toBe(0);
  });

  it("is deterministic for identical inputs", () => {
    const me = makeUser({ id: "me", skills: ["AI/ML", "Backend"] });
    const candidate = makeUser({
      id: "them",
      skills: ["AI/ML", "Data Science"],
      primaryRole: "Researcher",
    });

    expect(scoreCandidate(me, candidate)).toBe(scoreCandidate(me, candidate));
  });

  it("scores zero for a candidate with no shared skills and same role", () => {
    const me = makeUser({ id: "me", skills: ["Frontend"] });
    const candidate = makeUser({ id: "them", skills: ["Research"] });

    expect(scoreCandidate(me, candidate)).toBe(0);
  });
});

describe("buildDeck", () => {
  const me = makeUser({
    id: "me",
    skills: ["Frontend", "Backend"],
    primaryRole: "Developer",
  });

  it("excludes the current user from the deck", () => {
    const deck = buildDeck({
      me,
      candidates: [makeUser({ id: "me" })],
      swipedPairs: [],
    });

    expect(deck).toHaveLength(0);
  });

  it("excludes pairs swiped in either direction", () => {
    const rightSwiped = makeUser({ id: "a" });
    const reverseSwiped = makeUser({ id: "b" });
    const fresh = makeUser({ id: "c" });

    const deck = buildDeck({
      me,
      candidates: [rightSwiped, reverseSwiped, fresh],
      swipedPairs: [
        { fromUser: "me", toUser: "a" },
        { fromUser: "b", toUser: "me" },
      ],
    });

    expect(deck.map((c) => c.id)).toEqual(["c"]);
  });

  it("sorts by score desc, then id asc for ties", () => {
    const low = makeUser({
      id: "low",
      skills: ["Research"],
      primaryRole: "Researcher",
    });
    const high = makeUser({
      id: "high",
      skills: ["Frontend", "Backend", "AI/ML"],
      primaryRole: "Developer",
    });
    const tieA = makeUser({ id: "tie-a", skills: ["Backend"] });
    const tieB = makeUser({ id: "tie-b", skills: ["Backend"] });

    const deck = buildDeck({
      me,
      candidates: [tieB, low, high, tieA],
      swipedPairs: [],
    });

    expect(deck.map((c) => c.id)).toEqual(["high", "tie-a", "tie-b", "low"]);
  });

  it("returns DTOs — no status or collegeId leak", () => {
    const deck = buildDeck({
      me,
      candidates: [makeUser({ id: "a", skills: ["Frontend"] })],
      swipedPairs: [],
    });

    expect(deck[0]).not.toHaveProperty("status");
    expect(deck[0]).not.toHaveProperty("collegeId");
    expect(deck[0]).not.toHaveProperty("githubUrl");
    expect(deck[0]).toHaveProperty("score");
  });

  it("returns an empty array when no candidates remain", () => {
    const deck = buildDeck({
      me,
      candidates: [],
      swipedPairs: [],
    });

    expect(deck).toEqual([]);
  });
});
