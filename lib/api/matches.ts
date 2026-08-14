// ============================================================================
// Matches domain module — mutual matches + 1:1 chat (§2 Mode 1).
// DTO in, DTO out. Sender is server-derived on write (chat privacy hook);
// the matches listRule already scopes reads to the two participants.
// Realtime delivery is deduped by message id so reconnects never duplicate.
// ============================================================================

import type { MatchMessage } from "@/types/squadup";
import type { PbClient, UnsubscribeFunc } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";

/** A match in the inbox — the partner resolved against the current user. */
export interface MatchCard {
  id: string;
  partnerId: string;
  partnerName: string;
  createdAt: string;
}

function toMatchCard(record: Record<string, unknown>, meId: string): MatchCard {
  const expand = (record.expand ?? {}) as Record<string, unknown>;
  const partner =
    meId === String(record.userB)
      ? (expand.userA as { id?: string; name?: string } | undefined)
      : (expand.userB as { id?: string; name?: string } | undefined);
  return {
    id: String(record.id),
    partnerId: String(partner?.id ?? ""),
    partnerName: String(partner?.name ?? "A match"),
    createdAt: String(record.createdAt),
  };
}

function toMessage(record: Record<string, unknown>): MatchMessage {
  return {
    id: String(record.id),
    match: String(record.match),
    sender: String(record.sender),
    message: String(record.message),
    createdAt: String(record.createdAt),
  };
}

export function createMatchesApi(client: PbClient) {
  const matches = () => client.collection("matches");
  const messages = () => client.collection("match_messages");

  /** The inbox: every mutual match, newest first, partner expanded. */
  async function fetchMatches(): Promise<MatchCard[]> {
    try {
      const meId = client.authStore.record?.id as string | undefined;
      if (!meId) {
        throw new Error("Unauthorized");
      }
      const list = await matches().getList(1, 50, {
        sort: "-created",
        expand: "userA,userB",
      });
      return list.items
        .map((r) => toMatchCard(r as Record<string, unknown>, meId))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /** The full thread for one match, oldest first. */
  async function fetchMessages(matchId: string): Promise<MatchMessage[]> {
    try {
      const list = await messages().getList(1, 200, {
        filter: `match = '${matchId}'`,
        sort: "created",
      });
      return list.items.map((r) => toMessage(r as Record<string, unknown>));
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Send a message. Only match + message leave the client — the chat privacy
   * hook derives sender from the auth token and rejects non-members.
   */
  async function sendMessage(
    matchId: string,
    message: string
  ): Promise<MatchMessage> {
    try {
      const record = await messages().create({
        match: matchId,
        message,
      });
      return toMessage(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Live thread delivery. The subscription dedupes by message id so a
   * reconnect that replays already-seen events never duplicates a message.
   */
  async function subscribeMessages(
    matchId: string,
    onMessage: (message: MatchMessage) => void
  ): Promise<UnsubscribeFunc> {
    const seen = new Set<string>();
    return messages().subscribe(
      "*",
      (event) => {
        const id = String(event.record.id ?? "");
        if (seen.has(id)) return;
        seen.add(id);
        onMessage(toMessage(event.record));
      },
      { filter: `match = '${matchId}'` }
    );
  }

  return { fetchMatches, fetchMessages, sendMessage, subscribeMessages };
}
