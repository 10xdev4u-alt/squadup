// ============================================================================
// Teams domain module — DTO in, DTO out. Never returns raw PocketBase records.
// §8 privacy rule: TeamCard drops members + chatLink at the boundary.
// §10 directory rule: only open teams with a non-empty rolesNeeded are listed.
// ============================================================================

import type {
  Team,
  TeamCard,
  PrimaryRole,
  ProblemDomain,
  TeamStatus,
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

/** Directory filters — role narrows the §10 open-teams guard. */
export interface TeamDirectoryFilters {
  role?: PrimaryRole;
}

/** A problem statement for the form-team select (§5 Flow 2: "select/create"). */
export interface ProblemStatement {
  id: string;
  title: string;
  domain: ProblemDomain;
}

/** Team detail — §8 privacy: chatLink + inviteCode never cross the boundary. */
export interface TeamDetail {
  id: string;
  name: string;
  status: TeamStatus;
  rolesNeeded: PrimaryRole[];
  problemStatement: ProblemStatement | null;
  leader: { id: string; name: string };
  members: { id: string; name: string }[];
  /** ISO timestamp of the countdown target (§4B, §9). */
  deadline: string;
  /**
   * §8 privacy (I1 flag): only exposed to members/leader. Non-members see
   * null — the raw record keeps chatLink, but the DTO drops it for them.
   */
  chatLink: string | null;
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

function toPerson(record: unknown): { id: string; name: string } {
  const r = record as Record<string, unknown>;
  return { id: String(r.id ?? ""), name: String(r.name ?? "Unknown") };
}

function toTeamDetail(
  record: Record<string, unknown>,
  meId: string
): TeamDetail {
  const expand = (record.expand ?? {}) as Record<string, unknown>;
  const statement = expand.problemStatement as
    Record<string, unknown> | undefined;
  const leader = toPerson(expand.leader);
  const members = Array.isArray(expand.members)
    ? (expand.members as unknown[]).map(toPerson)
    : [];
  const isMember =
    meId !== "" && (leader.id === meId || members.some((m) => m.id === meId));
  return {
    id: String(record.id),
    name: String(record.name),
    status: record.status as TeamStatus,
    rolesNeeded: (record.rolesNeeded ?? []) as PrimaryRole[],
    problemStatement: statement ? toProblemStatement(statement) : null,
    leader,
    members,
    deadline: String(record.deadline ?? ""),
    // §8 privacy: the chat link is members-only (closes the I1 flag).
    chatLink: isMember && record.chatLink ? String(record.chatLink) : null,
  };
}

/** §10 directory rule — always applied, filters append to it. */
const DIRECTORY_FILTER = "status = 'open' && rolesNeeded != null";

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
    perPage?: number,
    filters?: TeamDirectoryFilters
  ): Promise<Paginated<TeamCard>> {
    try {
      const { page: p, perPage: pp } = clampPageParams(page, perPage);
      let filter = DIRECTORY_FILTER;
      if (filters?.role) {
        filter += ` && rolesNeeded ?~ '${filters.role}'`;
      }
      const result = await collection().getList(p, pp, {
        sort: "-created",
        filter,
      });
      return toPaginated(result, toTeamCard);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /** Detail view with the leader, members and statement expanded. */
  async function fetchTeamDetail(id: string): Promise<TeamDetail> {
    try {
      const record = await collection().getOne(id, {
        expand: "leader,members,problemStatement",
      });
      const meId = client.authStore.record?.id as string | undefined;
      return toTeamDetail(record, meId ?? "");
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

  /**
   * Leader-only settings (the updateRule enforces who). Sends only
   * client-owned fields — name/leader/inviteCode never leave the client.
   */
  async function updateTeamSettings(
    id: string,
    fields: Partial<
      Pick<TeamDetail, "chatLink" | "status" | "deadline"> & {
        /** Raw member ids — the API contract, not the expanded DTO shape. */
        members?: string[];
      }
    >
  ): Promise<TeamDetail> {
    try {
      const body: Record<string, unknown> = {};
      if (fields.chatLink !== undefined) body.chatLink = fields.chatLink;
      if (fields.status !== undefined) body.status = fields.status;
      if (fields.deadline !== undefined) body.deadline = fields.deadline;
      if (fields.members !== undefined) body.members = fields.members;
      const record = await collection().update(id, body);
      const meId = client.authStore.record?.id as string | undefined;
      return toTeamDetail(record, meId ?? "");
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return {
    fetchTeamCard,
    fetchTeamCards,
    fetchTeamDetail,
    createTeam,
    fetchProblemStatements,
    updateTeamSettings,
  };
}
