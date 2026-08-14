import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import type { TeamDetail } from "@/lib/api/teams";

export default function TeamDetailPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Layout>
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
              {team.rolesNeeded.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
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
        </div>
      )}
    </Layout>
  );
}
