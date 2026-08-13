// ============================================================================
// Mentorship tickets domain module — DTO in, DTO out.
// §8 rule: status/assignedMentor are server-owned; client sends team + title.
// ============================================================================

import type { MentorTicket, TicketStatus } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { clampPageParams, toPaginated, type Paginated } from "@/lib/api/pagination";
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
    assignedMentor: record.assignedMentor == null ? null : String(record.assignedMentor),
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

  return { createTicket, fetchTickets };
}
