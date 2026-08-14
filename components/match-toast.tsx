// ============================================================================
// MatchToast — the §9 mutual-match celebration, delivered as an accessible
// live region (role="status") so screen readers announce it. Fired by
// realtime match events (lib/use-match-realtime).
// ============================================================================

import type { MatchEvent } from "@/lib/api/realtime";

export default function MatchToast({
  match,
  onDismiss,
}: {
  match: MatchEvent | null;
  onDismiss: () => void;
}) {
  if (!match) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-4 z-50 mx-auto flex w-fit max-w-sm items-center gap-4 rounded-card border border-success/40 bg-card px-5 py-3 shadow-lg"
    >
      <span aria-hidden="true" className="text-2xl leading-none text-success">
        {"\u2728"}
      </span>
      <p className="text-sm font-medium">
        It&apos;s a Match!{" "}
        <span className="text-muted-foreground">
          {match.partnerName ?? "Someone"} is interested in you too.
        </span>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss match toast"
        className="ml-2 rounded-control px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Dismiss
      </button>
    </div>
  );
}
