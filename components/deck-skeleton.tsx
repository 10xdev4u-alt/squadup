// Loading placeholder that mirrors the real DeckCard shape (one centered
// card: avatar, name/role lines, skills, action buttons) so the swap-in
// doesn't cause a layout jump (§6.7).
export default function DeckSkeleton() {
  return (
    <div
      data-testid="deck-skeleton"
      aria-hidden="true"
      className="animate-pulse rounded-card border border-border bg-surface p-6"
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-elevated" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-elevated" />
          <div className="h-3 w-1/2 rounded bg-elevated" />
        </div>
        <div className="h-14 w-14 shrink-0 rounded-full bg-elevated" />
      </div>
      <div className="mt-5 h-3 w-2/3 rounded bg-elevated" />
      <div className="mt-2 h-3 w-4/5 rounded bg-elevated" />
      <div className="mt-6 flex justify-center gap-5">
        <div className="h-12 w-12 rounded-full bg-elevated" />
        <div className="h-12 w-12 rounded-full bg-elevated" />
      </div>
    </div>
  );
}
