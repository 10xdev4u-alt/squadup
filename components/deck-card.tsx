// ============================================================================
// DeckCard — one candidate in the discover swipe deck (§9 Discover).
// Presentational: renders the DeckCandidate DTO, shows the §6 directional glow
// for the active intent, and fires onSwipe(direction) from Skip / Interested.
// ============================================================================

import { Heart, X } from "lucide-react";
import Avatar from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import type { DeckCandidate } from "@/lib/matching/deck";
import type { SwipeDirection } from "@/types/squadup";
import { cn } from "@/lib/utils";

function MatchScore({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="img"
      aria-label={`Match score ${pct}%`}
      className="relative h-11 w-11 shrink-0"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          className="stroke-border"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="stroke-primary transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
        {pct}%
      </span>
    </div>
  );
}

export default function DeckCard({
  candidate,
  intent = null,
  onSwipe,
}: {
  candidate: DeckCandidate;
  /** Active directional glow — "left" (skip) or "right" (interested). */
  intent?: SwipeDirection | null;
  onSwipe: (direction: SwipeDirection) => void;
}) {
  return (
    <article
      role="article"
      data-intent={intent}
      className={cn(
        "flex flex-col gap-4 rounded-card border border-border bg-card p-7 shadow-soft transition-shadow",
        intent === "left" &&
          "border-danger/60 ring-2 ring-danger/40 shadow-[0_0_24px_-6px_var(--color-danger)]",
        intent === "right" &&
          "border-success/60 ring-2 ring-success/40 shadow-[0_0_24px_-6px_var(--color-success)]"
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar name={candidate.name} src={candidate.avatar} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-tight">
            {candidate.name}
          </h2>
          <Badge variant="outline" className="mt-1.5">
            {candidate.primaryRole}
          </Badge>
        </div>
        <MatchScore score={candidate.score} />
      </div>

      {candidate.bio && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {candidate.bio}
        </p>
      )}

      {candidate.lookingFor && (
        <p className="rounded-control border border-border/70 bg-surface px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Looking for {candidate.lookingFor}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {candidate.skills.map((skill) => (
          <Badge key={skill} variant="secondary">
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={() => onSwipe("left")}
          className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:border-danger/50 hover:text-danger focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Skip
        </button>
        <button
          type="button"
          onClick={() => onSwipe("right")}
          className="inline-flex items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Heart className="h-4 w-4" aria-hidden="true" />
          Interested
        </button>
      </div>
    </article>
  );
}
