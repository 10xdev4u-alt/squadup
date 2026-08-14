import Link from "next/link";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/landing/hero";
import FeatureGrid from "@/components/landing/feature-grid";
import HowItWorks from "@/components/landing/how-it-works";
import CtaBand from "@/components/landing/cta-band";
import { api } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser, isAuthenticated } from "@/lib/api/session";
import type { TeamCard } from "@/types/squadup";

const QUICK_LINKS = [
  { href: "/discover", title: "Discover", description: "Swipe the deck" },
  { href: "/matches", title: "Matches", description: "Open your chats" },
  { href: "/teams", title: "Browse Teams", description: "Explore open teams" },
  { href: "/profile", title: "Profile", description: "Edit your details" },
];

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [team, setTeam] = useState<TeamCard | null | undefined>(undefined);

  useEffect(() => {
    const client = getClient();
    if (!isAuthenticated(client)) {
      setAuthed(false);
      setTeam(null);
      return;
    }
    setAuthed(true);
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

  if (!authed) {
    return (
      <Layout>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <CtaBand />
      </Layout>
    );
  }

  const me = getCurrentUser(getClient());

  return (
    <Layout>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {me ? `Signed in as ${me.name || "you"}` : "Welcome back"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            Your dashboard
          </h1>
        </div>
      </div>

      {team && (
        <section className="mt-8 rounded-card border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your team
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{team.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {team.problemStatement}
              </p>
            </div>
            <Link
              href={`/team/${team.id}`}
              className="inline-flex items-center rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Open workspace
            </Link>
          </div>
        </section>
      )}

      {team === null && (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Solo and ready to ship?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Swipe to find teammates, then form a team and unlock the
              workspace.
            </p>
          </div>
          <Link
            href="/discover"
            className="inline-flex items-center rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Find teammates
          </Link>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Jump back in
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-card border border-border bg-card p-5 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <p className="font-medium">{link.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
