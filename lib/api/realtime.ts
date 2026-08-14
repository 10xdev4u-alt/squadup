// ============================================================================
// Realtime domain module — PocketBase realtime, DTO-out.
// Only surface today: match events (§9 "match toast via realtime"). The
// matches listRule already limits visibility to the two involved users.
// Events arrive normalized as { action, record } (see lib/api/client.ts).
// ============================================================================

import type { PbClient, UnsubscribeFunc } from "@/lib/api/types";
import { pbEscape } from "./filter";

export interface MatchEvent {
  id: string;
  userA: string;
  userB: string;
  partnerName: string | null;
}

function toMatchEvent(
  record: Record<string, unknown>,
  meId: string
): MatchEvent {
  const expand = (record.expand ?? {}) as Record<string, unknown>;
  const partner =
    meId === String(record.userB)
      ? (expand.userA as { name?: string } | undefined)
      : (expand.userB as { name?: string } | undefined);
  return {
    id: String(record.id),
    userA: String(record.userA),
    userB: String(record.userB),
    partnerName: partner?.name ?? null,
  };
}

export function createRealtimeApi(client: PbClient) {
  /**
   * Subscribe to matches involving me. `expand` brings the partner's record
   * so the toast can show a name without an extra round-trip.
   */
  async function subscribeMatches(
    meId: string,
    onMatch: (event: MatchEvent) => void
  ): Promise<UnsubscribeFunc> {
    // Dedup by record id: PB replays events on reconnect, and without this
    // every replay fires a duplicate match toast (§5.14).
    const seen = new Set<string>();
    return client.collection("matches").subscribe(
      "*",
      (event) => {
        const id = String(event.record.id ?? "");
        if (seen.has(id)) return;
        seen.add(id);
        onMatch(toMatchEvent(event.record, meId));
      },
      {
        filter: `userA = ${pbEscape(meId)} || userB = ${pbEscape(meId)}`,
        expand: "userA,userB",
      }
    );
  }

  return { subscribeMatches };
}
