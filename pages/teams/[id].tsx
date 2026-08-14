import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import {
  PRIMARY_ROLES,
  type JoinRequest,
  type PrimaryRole,
} from "@/types/squadup";
import type { TeamDetail } from "@/lib/api/teams";

export default function TeamDetailPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");
  const meId = getCurrentUser(getClient())?.id ?? "";

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // join flow state
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [myRequest, setMyRequest] = useState<JoinRequest | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<PrimaryRole>(PRIMARY_ROLES[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decision, setDecision] = useState<string | null>(null);

  const isLeader = team ? team.leader.id === meId : false;
  const isMember = team ? team.members.some((m) => m.id === meId) : false;

  const loadRequests = useCallback(async () => {
    try {
      const [pending, mine] = await Promise.all([
        api().joinRequests.fetchRequests({ teamId }),
        api().joinRequests.fetchRequests({}),
      ]);
      setRequests(pending);
      setMyRequest(mine.find((r) => r.team === teamId) ?? null);
    } catch {
      // non-critical — request UI degrades gracefully
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    api()
      .teams.fetchTeamDetail(teamId)
      .then((detail) => {
        if (!cancelled) setTeam(detail);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    void loadRequests();
  }, [teamId, loadRequests]);

  useEffect(() => {
    if (!teamId || !meId) return;
    let active = true;
    let stop: (() => Promise<void>) | null = null;
    api()
      .joinRequests.subscribeMyRequests((request) => {
        if (!active) return;
        if (request.team === teamId) {
          setDecision(
            request.status === "accepted"
              ? "You were accepted — welcome to the team!"
              : "Your request was declined."
          );
          setMyRequest(request);
        }
      })
      .then((unsubscribe) => {
        if (!active) {
          void unsubscribe();
        } else {
          stop = unsubscribe;
        }
      });
    return () => {
      active = false;
      if (stop) void stop();
    };
  }, [teamId, meId]);

  const submitRequest = async () => {
    setActionError(null);
    setSubmitting(true);
    try {
      const created = await api().joinRequests.requestToJoin(teamId, {
        roleAppliedFor: role,
        message: note.trim(),
      });
      setMyRequest(created);
      setShowForm(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const decide = async (
    requestId: string,
    decisionValue: "accepted" | "rejected"
  ) => {
    setActionError(null);
    try {
      await api().joinRequests.decideRequest(requestId, decisionValue);
      setRequests((current) => current.filter((r) => r.id !== requestId));
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  return (
    <Layout>
      {decision && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-card border border-success/40 bg-card px-4 py-3 text-sm font-medium"
        >
          {decision}
        </div>
      )}

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-danger">
          {actionError}
        </p>
      )}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : !team ? (
        <p className="text-sm text-muted-foreground">Loading team...</p>
      ) : (
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold">{team.name}</h1>

          {team.problemStatement ? (
            <div className="mt-4 rounded-card border border-border bg-card p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Problem statement · {team.problemStatement.domain}
              </p>
              <p className="mt-1">{team.problemStatement.title}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No problem statement yet.
            </p>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Roles needed
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.rolesNeeded.map((needed) => (
                <Badge key={needed} variant="outline">
                  {needed}
                </Badge>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Team
            </h2>
            <ul className="mt-2 space-y-1">
              <li className="text-sm">
                {team.leader.name}{" "}
                <span className="text-xs text-muted-foreground">(lead)</span>
              </li>
              {team.members
                .filter((m) => m.id !== team.leader.id)
                .map((member) => (
                  <li key={member.id} className="text-sm">
                    {member.name}
                  </li>
                ))}
            </ul>
          </section>

          {/* --- join flow --- */}
          {isLeader ? (
            <section className="mt-8 rounded-card border border-border bg-card p-5">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Join requests
              </h2>
              {requests.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No pending requests.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {requests.map((request) => (
                    <li
                      key={request.id}
                      className="flex items-center justify-between gap-4 rounded-control border border-border bg-surface px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {request.roleAppliedFor}
                          {request.message ? (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {request.message}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void decide(request.id, "accepted")}
                          className="rounded-control bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => void decide(request.id, "rejected")}
                          className="rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : isMember ? (
            <p className="mt-8 text-sm text-muted-foreground">
              You are a member of this team.
            </p>
          ) : myRequest ? (
            <p className="mt-8 text-sm text-muted-foreground">
              Your request is{" "}
              <span className="font-medium">{myRequest.status}</span>
              {myRequest.status === "pending"
                ? " — the leader will respond soon."
                : "."}
            </p>
          ) : (
            <section className="mt-8 rounded-card border border-border bg-card p-5">
              {!showForm ? (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  Request to Join
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="join-role"
                      className="block text-sm font-medium"
                    >
                      Role
                    </label>
                    <select
                      id="join-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as PrimaryRole)}
                      className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {PRIMARY_ROLES.map((candidate) => (
                        <option key={candidate} value={candidate}>
                          {candidate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="join-note"
                      className="block text-sm font-medium"
                    >
                      Note{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <textarea
                      id="join-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitRequest()}
                    className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {submitting ? "Sending..." : "Send request"}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </Layout>
  );
}
