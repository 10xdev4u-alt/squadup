// ============================================================================
// Join requests domain module — Mode 2 request flow (§2, §5 Flow 3).
// DTO in, DTO out. The client sends team/role/message only; applicant and
// status are server-derived (create hook). Decisions are leader-only
// (updateRule team.leader = me). Decision delivery is realtime, deduped.
// ============================================================================

import type {
  JoinRequest,
  JoinRequestStatus,
  PrimaryRole,
} from "@/types/squadup";
import type { PbClient, UnsubscribeFunc } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";
import { pbEscape } from "./filter";

export interface RequestToJoinInput {
  roleAppliedFor: PrimaryRole;
  message?: string;
}

export interface FetchRequestsOptions {
  /** Leader view — pending requests for a specific team. */
  teamId?: string;
}

function toJoinRequest(record: Record<string, unknown>): JoinRequest {
  return {
    id: String(record.id),
    team: String(record.team),
    applicant: String(record.applicant),
    roleAppliedFor: record.roleAppliedFor as PrimaryRole,
    message: String(record.message ?? ""),
    status: record.status as JoinRequestStatus,
    createdAt: String(record.created),
  };
}

export function createJoinRequestsApi(client: PbClient) {
  const collection = () => client.collection("join_requests");

  /** Apply to an open team. applicant + status are derived server-side. */
  async function requestToJoin(
    teamId: string,
    input: RequestToJoinInput
  ): Promise<JoinRequest> {
    try {
      const record = await collection().create({
        team: teamId,
        roleAppliedFor: input.roleAppliedFor,
        message: input.message ?? "",
      });
      return toJoinRequest(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Leader view (teamId) — pending requests for that team.
   * Applicant view (no teamId) — my own requests.
   * The listRule scopes both to the requester.
   */
  async function fetchRequests(
    options: FetchRequestsOptions = {}
  ): Promise<JoinRequest[]> {
    try {
      const filter = options.teamId
        ? `team = ${pbEscape(options.teamId)} && status = 'pending'`
        : "applicant = @request.auth.id";
      const list = await collection().getList(1, 50, {
        sort: "-created",
        filter,
      });
      return list.items.map((r) => toJoinRequest(r as Record<string, unknown>));
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /** Leader decision on a pending request (accept adds the member server-side). */
  async function decideRequest(
    requestId: string,
    decision: "accepted" | "rejected"
  ): Promise<JoinRequest> {
    try {
      const record = await collection().update(requestId, {
        status: decision,
      });
      return toJoinRequest(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Live decision delivery to the applicant. Deduped by request id so a
   * reconnect that replays already-seen events never double-notifies.
   */
  async function subscribeMyRequests(
    onDecision: (request: JoinRequest) => void
  ): Promise<UnsubscribeFunc> {
    const meId = client.authStore.record?.id as string | undefined;
    const seen = new Set<string>();
    return collection().subscribe(
      "*",
      (event) => {
        const id = String(event.record.id ?? "");
        if (seen.has(id)) return;
        seen.add(id);
        onDecision(toJoinRequest(event.record));
      },
      { filter: `applicant = ${pbEscape(meId)}` }
    );
  }

  return { requestToJoin, fetchRequests, decideRequest, subscribeMyRequests };
}
