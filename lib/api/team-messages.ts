// ============================================================================
// Team messages domain module — in-app team chat (§4B "team chat for collab").
// DTO in, DTO out. Sender is server-derived on write (team-chat privacy hook);
// the team_messages listRule scopes reads to team members + the leader.
// Realtime delivery is deduped by message id so reconnects never duplicate.
// ============================================================================

import type { TeamMessage } from "@/types/squadup";
import type { PbClient, UnsubscribeFunc } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";

function toMessage(record: Record<string, unknown>): TeamMessage {
  return {
    id: String(record.id),
    team: String(record.team),
    sender: String(record.sender),
    message: String(record.message),
    createdAt: String(record.created),
  };
}

export function createTeamMessagesApi(client: PbClient) {
  const messages = () => client.collection("team_messages");

  /** The full thread for one team, oldest first. */
  async function fetchMessages(teamId: string): Promise<TeamMessage[]> {
    try {
      const list = await messages().getList(1, 200, {
        filter: `team = '${teamId}'`,
        sort: "created",
      });
      return list.items.map((r) => toMessage(r as Record<string, unknown>));
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Send a message. Only team + message leave the client — the team-chat hook
   * derives sender from the auth token and rejects non-members.
   */
  async function sendMessage(
    teamId: string,
    message: string
  ): Promise<TeamMessage> {
    try {
      const record = await messages().create({
        team: teamId,
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
    teamId: string,
    onMessage: (message: TeamMessage) => void
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
      { filter: `team = '${teamId}'` }
    );
  }

  return { fetchMessages, sendMessage, subscribeMessages };
}
