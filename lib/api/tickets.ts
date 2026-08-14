// ============================================================================
// Mentorship tickets domain module — DTO in, DTO out.
// §8 rule: status/assignedMentor are server-owned; client sends team + title.
// ============================================================================

import type {
  MentorTicket,
  TicketMessage,
  TicketStatus,
} from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import {
  clampPageParams,
  toPaginated,
  type Paginated,
} from "@/lib/api/pagination";
import { normalizeError } from "@/lib/api/error";

export interface CreateTicketInput {
  team: string;
  title: string;
}

function toTicket(record: Record<string, unknown>): MentorTicket {
  return {
    id: String(record.id),
    team: String(record.team),
    title: String(record.title),
    status: record.status as TicketStatus,
    assignedMentor:
      record.assignedMentor == null ? null : String(record.assignedMentor),
    createdAt: String(record.createdAt),
  };
}

function toMessage(record: Record<string, unknown>): TicketMessage {
  return {
    id: String(record.id),
    ticket: String(record.ticket),
    sender: String(record.sender),
    message: String(record.message),
    attachment: record.attachment == null ? null : String(record.attachment),
    createdAt: String(record.createdAt),
  };
}

export function createTicketsApi(client: PbClient) {
  const collection = () => client.collection("mentor_tickets");

  async function createTicket(input: CreateTicketInput): Promise<MentorTicket> {
    try {
      const record = await collection().create({ ...input });
      return toTicket(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function fetchTickets(
    teamId: string,
    page = 1,
    perPage?: number
  ): Promise<Paginated<MentorTicket>> {
    try {
      const { page: p, perPage: pp } = clampPageParams(page, perPage);
      // JSON.stringify gives us safe quoting for the filter value.
      const result = await collection().getList(p, pp, {
        filter: `team = ${JSON.stringify(teamId)}`,
        sort: "-created",
      });
      return toPaginated(result, toTicket);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function updateTicketStatus(
    ticketId: string,
    status: TicketStatus
  ): Promise<void> {
    try {
      await collection().update(ticketId, { status });
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /** Mentor inbox — server rules scope this to assigned/mentor-visible tickets. */
  async function fetchMentorInbox(
    page = 1,
    perPage = 100
  ): Promise<Paginated<MentorTicket>> {
    try {
      const { page: p, perPage: pp } = clampPageParams(page, perPage);
      const result = await collection().getList(p, pp, { sort: "-created" });
      return toPaginated(result, toTicket);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function createTicketMessage(
    ticketId: string,
    text: string
  ): Promise<TicketMessage> {
    try {
      const record = await client.collection("ticket_messages").create({
        ticket: ticketId,
        message: text,
      });
      return toMessage(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /** Thread oldest-first — sender is server-derived. */
  async function fetchTicketMessages(
    ticketId: string
  ): Promise<TicketMessage[]> {
    try {
      const result = await client
        .collection("ticket_messages")
        .getList(1, 200, {
          filter: `ticket = ${JSON.stringify(ticketId)}`,
          sort: "created",
        });
      return result.items.map((item) =>
        toMessage(item as Record<string, unknown>)
      );
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return {
    createTicket,
    fetchTickets,
    updateTicketStatus,
    fetchMentorInbox,
    createTicketMessage,
    fetchTicketMessages,
  };
}
