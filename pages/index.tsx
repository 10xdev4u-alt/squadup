import Link from "next/link";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { isAuthenticated } from "@/lib/api/session";
import type { TeamCard } from "@/types/squadup";

export default function Home() {
  const [team, setTeam] = useState<TeamCard | null | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated(getClient())) {
      setTeam(null);
      return;
    }
    let cancelled = false;
    api()
      .teams.fetchMyTeam()
      .then((found) => {
        if (!cancelled) setTeam(found);
      })
      .catch(() => {
        if (!cancelled) setTeam(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <h1 className="text-4xl font-bold">SquadUp</h1>
      <p className="mt-2 text-lg">Find Your Squad. Build Something Real.</p>

      {team && (
        <section className="mt-8 max-w-md rounded-card border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your team
          </p>
          <h2 className="mt-1 text-xl font-bold">{team.name}</h2>
          <Link
            href={`/team/${team.id}`}
            className="mt-4 inline-block rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Open workspace
          </Link>
        </section>
      )}

      {team === null && (
        <section className="mt-8 max-w-md rounded-card border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">
            {isAuthenticated(getClient())
              ? "Solo and ready to ship?"
              : "Join the build."}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAuthenticated(getClient())
              ? "Swipe to find teammates, then form a team and unlock the workspace."
              : "Sign in with your college email and start building something real with your classmates."}
          </p>
          <Link
            href={isAuthenticated(getClient()) ? "/discover" : "/auth"}
            className="mt-4 inline-block rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {isAuthenticated(getClient()) ? "Find teammates" : "Get started"}
          </Link>
        </section>
      )}
    </Layout>
  );
}
