// ============================================================================
// Swipes domain module — DTO in, DTO out.
// §8 rule: fromUser is derived server-side from the auth token (@request.auth.id),
// so the client only ever sends { toUser, direction }.
// ============================================================================

import type { Swipe, SwipeDirection } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";

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

export function createSwipesApi(client: PbClient) {
  const collection = () => client.collection("swipes");

  async function recordSwipe(input: RecordSwipeInput): Promise<Swipe> {
    try {
      const record = await collection().create({ ...input });
      return toSwipe(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { recordSwipe };
}
