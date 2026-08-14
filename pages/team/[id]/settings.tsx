// ============================================================================
// Team settings — leader-only (§4B, §8). The updateRule (leader = auth id)
// already 403s non-leader writes server-side; this page gates the UI the
// same way. Fields: chat link (Discord/WhatsApp invite), open/closed status,
// the I19 deadline (countdown target), and member management — removal flips
// the member back to `solo` server-side so they re-enter the discover deck.
// ============================================================================

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import type { TeamDetail } from "@/lib/api/teams";
import type { TeamStatus } from "@/types/squadup";

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function TeamSettingsPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");
  const meId = getCurrentUser(getClient())?.id ?? "";

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [chatLink, setChatLink] = useState("");
  const [status, setStatus] = useState<TeamStatus>("open");
  const [deadline, setDeadline] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    api()
      .teams.fetchTeamDetail(teamId)
      .then((detail) => {
        if (cancelled) return;
        setTeam(detail);
        setChatLink(detail.chatLink ?? "");
        setStatus(detail.status);
        setDeadline(toDatetimeLocal(detail.deadline));
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const isLeader = team ? team.leader.id === meId : false;

  if (error && !team) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">
            Couldn&apos;t load this team
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </Layout>
    );
  }

  if (loading || !team) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 h-40 animate-pulse rounded-card bg-muted" />
        </div>
      </Layout>
    );
  }

  if (!isLeader) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">Team Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only the leader can manage team settings.
          </p>
          <Link
            href={`/team/${teamId}`}
            className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  // `team` is narrowed here (all null paths returned above) — capture it so
  // the closures below keep the narrowing.
  const currentTeam = team;

  const remainingMembers = currentTeam.members.filter(
    (m) => !pendingRemoval.has(m.id)
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const body: {
        chatLink?: string;
        status?: TeamStatus;
        deadline?: string;
        members?: string[];
      } = {};
      if (chatLink !== currentTeam.chatLink) body.chatLink = chatLink;
      if (status !== currentTeam.status) body.status = status;
      const nextDeadline = deadline
        ? new Date(deadline).toISOString()
        : undefined;
      if (nextDeadline && nextDeadline !== currentTeam.deadline) {
        body.deadline = nextDeadline;
      }
      if (pendingRemoval.size > 0) {
        body.members = remainingMembers.map((m) => m.id);
      }
      const updated = await api().teams.updateTeamSettings(teamId, body);
      setTeam(updated);
      setChatLink(updated.chatLink ?? "");
      setStatus(updated.status);
      setDeadline(toDatetimeLocal(updated.deadline));
      setPendingRemoval(new Set());
      setSaved(true);
    } catch (err) {
      setSaveError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Team Settings
            </h1>
          </div>
          <Link
            href={`/team/${teamId}`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to dashboard
          </Link>
        </header>

        <form
          onSubmit={handleSave}
          className="mt-8 space-y-8 rounded-card border border-border bg-card p-6"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Team chat link (Discord / WhatsApp invite)
              </span>
              <input
                type="url"
                value={chatLink}
                onChange={(e) => setChatLink(e.target.value)}
                placeholder="https://discord.gg/..."
                className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Team status
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TeamStatus)}
                className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="open">Open (visible in directory)</option>
                <option value="closed">Closed (hidden from directory)</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">
                Submission deadline (countdown target)
              </span>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <section aria-labelledby="members-heading">
            <h2 id="members-heading" className="text-base font-semibold">
              Members
            </h2>
            <ul className="mt-3 divide-y divide-border rounded-control border border-border bg-background">
              {team.members.map((member) => {
                const marked = pendingRemoval.has(member.id);
                if (marked) return null;
                return (
                  <li
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {member.name}
                      {member.id === team.leader.id && (
                        <Badge variant="secondary">Leader</Badge>
                      )}
                    </span>
                    {member.id !== team.leader.id && (
                      <button
                        type="button"
                        onClick={() =>
                          setPendingRemoval((prev) => {
                            const next = new Set(prev);
                            next.add(member.id);
                            return next;
                          })
                        }
                        aria-label={`Remove ${member.name}`}
                        className="text-xs font-medium text-destructive underline-offset-4 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
              {remainingMembers.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">
                  No members left after removal.
                </li>
              )}
            </ul>
            {pendingRemoval.size > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {pendingRemoval.size} member
                {pendingRemoval.size === 1 ? "" : "s"} will be removed on save —
                they return to the discover deck.
              </p>
            )}
          </section>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Save Changes
            </button>
            {saved && (
              <p role="status" className="text-sm text-success">
                Saved.
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-destructive">
                {saveError}
              </p>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}
