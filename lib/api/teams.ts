// ============================================================================
// Teams domain module — DTO in, DTO out. Never returns raw PocketBase records.
// §8 privacy rule: TeamCard drops members + chatLink at the boundary.
// ============================================================================

import type { Team, TeamCard, PrimaryRole } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { clampPageParams, toPaginated, type Paginated } from "@/lib/api/pagination";
import { normalizeError } from "@/lib/api/error";

/** Fields the client may send when creating a team (§8 — leader/status/inviteCode are server-owned). */
export type NewTeam = Pick<Team, "name" | "problemStatement" | "rolesNeeded">;

function toTeamCard(record: Record<string, unknown>): TeamCard {
  return {
    id: String(record.id),
    name: String(record.name),
    problemStatement: String(record.problemStatement),
    status: record.status as TeamCard["status"],
    rolesNeeded: (record.rolesNeeded ?? []) as PrimaryRole[],
  };
}

export function createTeamsApi(client: PbClient) {
  const collection = () => client.collection("teams");

  async function fetchTeamCard(id: string): Promise<TeamCard> {
    try {
      const record = await collection().getOne(id);
      return toTeamCard(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function fetchTeamCards(page = 1, perPage?: number): Promise<Paginated<TeamCard>> {
    try {
      const { page: p, perPage: pp } = clampPageParams(page, perPage);
      const result = await collection().getList(p, pp, { sort: "-created" });
      return toPaginated(result, toTeamCard);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function createTeam(input: NewTeam): Promise<TeamCard> {
    try {
      const record = await collection().create({ ...input });
      return toTeamCard(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { fetchTeamCard, fetchTeamCards, createTeam };
}
