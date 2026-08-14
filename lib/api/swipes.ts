// ============================================================================
// Swipes domain module — DTO in, DTO out.
// §8 rule: fromUser is derived server-side from the auth token (@request.auth.id),
// so the client only ever sends { toUser, direction }.
// §10 deck: fetchDeck pulls solo users + my outgoing swipes through the typed
// layer and runs the pure deck pipeline (lib/matching/deck) — scoring and
// exclusions happen there; this module only moves records.
// ============================================================================

import type { Swipe, SwipeDirection } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";
import { toUser } from "@/lib/api/auth";
import {
  buildDeck,
  type DeckCandidate,
  type SwipePair,
} from "@/lib/matching/deck";

export interface RecordSwipeInput {
  toUser: string;
  direction: SwipeDirection;
}

function toSwipe(record: Record<string, unknown>): Swipe {
  return {
    id: String(record.id),
    fromUser: String(record.fromUser),
    toUser: String(record.toUser),
    direction: record.direction as SwipeDirection,
    createdAt: String(record.createdAt),
  };
}

function toSwipePair(record: Record<string, unknown>): SwipePair {
  return {
    fromUser: String(record.fromUser),
    toUser: String(record.toUser),
  };
}

function toRecord(item: unknown): Record<string, unknown> {
  return item as Record<string, unknown>;
}

export function createSwipesApi(client: PbClient) {
  const collection = () => client.collection("swipes");
  const users = () => client.collection("users");

  async function recordSwipe(input: RecordSwipeInput): Promise<Swipe> {
    try {
      const record = await collection().create({ ...input });
      return toSwipe(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * The §10 discover deck: solo users, excluding self and anyone I already
   * swiped, ordered by deterministic skill-overlap score.
   * The swipes listRule (`fromUser = @request.auth.id`) guarantees we only
   * ever see our own outgoing swipes — someone who swiped us stays in the
   * deck so we can complete the mutual match.
   */
  async function fetchDeck(): Promise<DeckCandidate[]> {
    try {
      const meId = client.authStore.record?.id as string | undefined;
      if (!meId) {
        throw new Error("Unauthorized");
      }
      const meRecord = await users().getOne(meId);
      const me = toUser(meRecord);
      const [usersList, swipesList] = await Promise.all([
        users().getList(1, 200, { filter: "status = 'solo' && name != ''" }),
        collection().getList(1, 200, { filter: `fromUser = '${meId}'` }),
      ]);
      return buildDeck({
        me: {
          id: me.id,
          skills: me.skills,
          primaryRole: me.primaryRole,
        },
        candidates: usersList.items.map((r) => toUser(toRecord(r))),
        swipedPairs: swipesList.items.map((r) => toSwipePair(toRecord(r))),
      });
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { recordSwipe, fetchDeck };
}
