// ============================================================================
// DeckCard — one candidate in the discover swipe deck (§9 Discover).
// Presentational: renders the DeckCandidate DTO, shows the §6 directional glow
// for the active intent, and fires onSwipe(direction) from Skip / Interested.
// ============================================================================

import { Badge } from "@/components/ui/badge";
import type { DeckCandidate } from "@/lib/matching/deck";
import type { SwipeDirection } from "@/types/squadup";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
        "flex flex-col gap-4 rounded-card border border-border bg-card p-6 shadow-sm transition-shadow",
        intent === "left" &&
          "border-danger/60 ring-2 ring-danger/40 shadow-[0_0_24px_-6px_var(--color-danger)]",
        intent === "right" &&
          "border-success/60 ring-2 ring-success/40 shadow-[0_0_24px_-6px_var(--color-success)]"
      )}
    >
      <div className="flex items-center gap-4">
        {candidate.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.avatar}
            alt=""
            className="h-14 w-14 rounded-full border border-border bg-surface object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/10 text-base font-semibold text-primary"
          >
            {initials(candidate.name)}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{candidate.name}</h2>
          <Badge variant="outline" className="mt-1">
            {candidate.primaryRole}
          </Badge>
        </div>
      </div>

      {candidate.bio && (
        <p className="text-sm text-muted-foreground">{candidate.bio}</p>
      )}

      {candidate.lookingFor && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
          className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => onSwipe("right")}
          className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Interested
        </button>
      </div>
    </article>
  );
}
