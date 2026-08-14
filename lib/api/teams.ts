// ============================================================================
// Teams domain module — DTO in, DTO out. Never returns raw PocketBase records.
// §8 privacy rule: TeamCard drops members + chatLink at the boundary.
// ============================================================================

import type {
  Team,
  TeamCard,
  PrimaryRole,
  ProblemDomain,
} from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import {
  clampPageParams,
  toPaginated,
  type Paginated,
} from "@/lib/api/pagination";
import { normalizeError } from "@/lib/api/error";

/**
 * Fields the client may send when creating a team.
 * §8 — leader/status/inviteCode are server-owned. problemStatement is optional
 * (the schema field allows empty; teams may form before one is picked).
 */
export type NewTeam = Pick<Team, "name" | "rolesNeeded"> & {
  problemStatement?: string;
};

/** A problem statement for the form-team select (§5 Flow 2: "select/create"). */
export interface ProblemStatement {
  id: string;
  title: string;
  domain: ProblemDomain;
}

function toTeamCard(record: Record<string, unknown>): TeamCard {
  return {
    id: String(record.id),
    name: String(record.name),
    problemStatement: String(record.problemStatement),
    status: record.status as TeamCard["status"],
    rolesNeeded: (record.rolesNeeded ?? []) as PrimaryRole[],
  };
}

function toProblemStatement(record: Record<string, unknown>): ProblemStatement {
  return {
    id: String(record.id),
    title: String(record.title),
    domain: String(record.domain) as ProblemDomain,
  };
}

export function createTeamsApi(client: PbClient) {
  const collection = () => client.collection("teams");
  const problems = () => client.collection("problem_statements");

  async function fetchTeamCard(id: string): Promise<TeamCard> {
    try {
      const record = await collection().getOne(id);
      return toTeamCard(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function fetchTeamCards(
    page = 1,
    perPage?: number
  ): Promise<Paginated<TeamCard>> {
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

  /** The §5 form-team select — existing problem statements. */
  async function fetchProblemStatements(): Promise<ProblemStatement[]> {
    try {
      const result = await problems().getList(1, 100, { sort: "title" });
      return result.items.map((r) =>
        toProblemStatement(r as Record<string, unknown>)
      );
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { fetchTeamCard, fetchTeamCards, createTeam, fetchProblemStatements };
}
