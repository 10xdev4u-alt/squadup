export default function DeckSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="animate-pulse rounded-card border border-border bg-surface p-6"
        >
          <div className="h-4 w-2/3 rounded bg-elevated" />
          <div className="mt-4 h-3 w-full rounded bg-elevated" />
          <div className="mt-2 h-3 w-4/5 rounded bg-elevated" />
          <div className="mt-6 h-8 w-full rounded-control bg-elevated" />
        </div>
      ))}
    </div>
  );
}
