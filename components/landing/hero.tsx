import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Avatar from "@/components/avatar";

const mockSkills = ["React", "TypeScript", "UI Design"];

export default function Hero() {
  return (
    <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
      <div>
        <p className="inline-flex items-center gap-2 rounded-control border border-border bg-elevated px-3 py-1 text-xs font-medium text-muted-foreground">
          Built for college teams
        </p>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Find Your Squad. Build Something Real.
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground">
          SquadUp matches you with the right teammates on campus, then gives
          your team a workspace to plan, chat, and ship — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Get started
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-control border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            See how it works
          </a>
        </div>
      </div>

      {/* Product mock — pure CSS, mirrors the real deck */}
      <div aria-label="Product mock" className="relative">
        <div className="rounded-card border border-border bg-surface p-5 shadow-float">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your deck
            </p>
            <span className="rounded-control bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              PM
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Avatar name="Aarav Iyer" size="lg" />
            <div>
              <p className="font-medium">Aarav Iyer</p>
              <p className="text-sm text-muted-foreground">
                Building an AI study planner
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {mockSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-control bg-elevated px-2 py-1 text-xs text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <span className="flex-1 rounded-control bg-elevated py-2 text-center text-xs font-medium text-muted-foreground">
              Skip
            </span>
            <span className="flex-1 rounded-control bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
              Interested
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
