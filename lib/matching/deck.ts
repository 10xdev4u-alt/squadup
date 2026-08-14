// ============================================================================
// Discover deck — pure matching logic (PROPOSAL.md §10).
// No I/O here: callers fetch records, feed them in, get a sorted deck out.
//   - Exclusions: self, already-swiped pairs (either direction — I1 treats the
//     reverse swipe as a match-in-waiting, so it must not be re-decked).
//   - Ordering: skill-overlap score desc, then id asc for determinism.
//   - §10 complementary boost: a candidate with a different primaryRole scores
//     +5 (e.g. a Frontend user sees Backend/AI-ML profiles ranked higher).
// ============================================================================

import type { PrimaryRole, Skill, User } from "@/types/squadup";

export const SKILL_OVERLAP_WEIGHT = 10;
export const COMPLEMENTARY_ROLE_BONUS = 5;

/** A candidate surfaced to the swipe deck — DTO, never a raw record. */
export interface DeckCandidate {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  skills: Skill[];
  primaryRole: PrimaryRole;
  lookingFor: string;
  /** Deterministic relevance score — higher first. */
  score: number;
}

/** The minimal slice of the current user the scorer needs. */
export interface DeckMe {
  id: string;
  skills: Skill[];
  primaryRole: PrimaryRole;
}

/** A swipe pair (either direction counts as "already swiped"). */
export interface SwipePair {
  fromUser: string;
  toUser: string;
}

function sharedSkillCount(a: Skill[], b: Skill[]): number {
  const set = new Set(a);
  return b.reduce((n, skill) => (set.has(skill) ? n + 1 : n), 0);
}

/** Deterministic relevance score: overlap * weight + complementary-role bonus. */
export function scoreCandidate(me: DeckMe, candidate: User): number {
  const overlap = sharedSkillCount(me.skills, candidate.skills);
  const boost =
    me.primaryRole !== candidate.primaryRole ? COMPLEMENTARY_ROLE_BONUS : 0;
  return overlap * SKILL_OVERLAP_WEIGHT + boost;
}

function isSwiped(pair: SwipePair, userId: string): boolean {
  return (
    (pair.fromUser === userId || pair.toUser === userId) &&
    pair.fromUser !== pair.toUser
  );
}

/**
 * Builds the sorted deck.
 * - `candidates` should already be `status = 'solo'` (server-side filter).
 * - `swipedPairs` excludes anyone already paired with the current user in
 *   either direction, so match-in-waiting users never re-appear.
 */
export function buildDeck(input: {
  me: DeckMe;
  candidates: User[];
  swipedPairs: SwipePair[];
}): DeckCandidate[] {
  const { me, candidates, swipedPairs } = input;

  const deck = candidates
    .filter(
      (c) => c.id !== me.id && !swipedPairs.some((p) => isSwiped(p, c.id))
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar,
      bio: c.bio,
      skills: c.skills,
      primaryRole: c.primaryRole,
      lookingFor: c.lookingFor,
      score: scoreCandidate(me, c),
    }));

  deck.sort(
    (a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
  return deck;
}
