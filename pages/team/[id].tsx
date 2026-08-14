// ============================================================================
// Team dashboard — the M2 workspace home (§4B, §9). Sidebar-navigation hub:
// countdown to the server-derived deadline (red pulse < 24h), problem
// statement, member roster, and entry points into the kanban + resource hub
// (their laps land in I20/I21). Private to team members via useRequireAuth.
// ============================================================================

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Avatar from "@/components/avatar";
import Countdown from "@/components/countdown";
import TeamChat from "@/components/team-chat";
import TeamStats from "@/components/team-stats";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import type { TeamDetail } from "@/lib/api/teams";

export default function TeamDashboardPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    openTickets: number;
    resources: number;
  } | null>(null);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    api()
      .teams.fetchTeamDetail(teamId)
      .then((detail) => {
        if (!cancelled) setTeam(detail);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    Promise.all([
      api().tickets.fetchTickets(teamId, 1, 1),
      api().resources.fetchResources(teamId, 1),
    ])
      .then(([tickets, resources]) => {
        if (!cancelled) {
          setStats({
            openTickets: tickets.totalItems,
            resources: resources.totalItems,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setStats({ openTickets: 0, resources: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (error) {
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

  if (!team) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-8 h-24 animate-pulse rounded-card bg-muted" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team Workspace
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {team.name}
            </h1>
            {team.problemStatement && (
              <div className="mt-3 max-w-xl">
                <p className="text-sm text-muted-foreground">
                  Problem statement
                </p>
                <p className="mt-1 text-base font-medium">
                  {team.problemStatement.title}
                </p>
                <Badge className="mt-2" variant="secondary">
                  {team.problemStatement.domain}
                </Badge>
              </div>
            )}
          </div>

          <aside className="flex flex-col items-stretch gap-3">
            <div className="rounded-card border border-border bg-card p-6 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Deadline
              </p>
              <div className="mt-2">
                <Countdown deadline={team.deadline} />
              </div>
            </div>
            <Link
              href={`/team/${team.id}/settings`}
              className="rounded-control border border-border bg-card px-4 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              Team Settings
            </Link>
          </aside>
        </header>

        {team && stats && (
          <div className="mt-8">
            <TeamStats
              members={team.members.length}
              openTickets={stats.openTickets}
              resources={stats.resources}
            />
          </div>
        )}

        <nav
          aria-label="Team workspace"
          className="mt-10 grid gap-4 sm:grid-cols-2"
        >
          <Link
            href={`/team/${team.id}/board`}
            className="rounded-card border border-border bg-card p-6 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <h2 className="text-lg font-semibold">Kanban Board</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan and track the build — Idea to Final Pitch.
            </p>
          </Link>
          <Link
            href={`/team/${team.id}/resources`}
            className="rounded-card border border-border bg-card p-6 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <h2 className="text-lg font-semibold">Resource Hub</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share links and embed designs for the team.
            </p>
          </Link>
          <Link
            href={`/team/${team.id}/tickets`}
            className="rounded-card border border-border bg-card p-6 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <h2 className="text-lg font-semibold">Mentor Corner</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a ticket and get help from a mentor.
            </p>
          </Link>
        </nav>

        <TeamChat teamId={team.id} />

        {team.chatLink && (
          <p className="mt-3 text-sm text-muted-foreground">
            External chat{" "}
            <a
              href={team.chatLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              (Discord / WhatsApp)
            </a>
          </p>
        )}

        <section aria-labelledby="members-heading" className="mt-10">
          <h2 id="members-heading" className="text-lg font-semibold">
            Members
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-card px-5 py-4"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={member.name} size="sm" />
                  <span className="truncate font-medium">{member.name}</span>
                </span>
                {member.id === team.leader.id && (
                  <Badge variant="secondary">Leader</Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Layout>
  );
}
