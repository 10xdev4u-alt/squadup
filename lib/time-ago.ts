// ============================================================================
// Relative time — "2h ago" style labels for matches and feeds. PB timestamps
// can be empty/invalid (pre-backfill rows), so a bad value degrades to "".
// ============================================================================

export function timeAgo(createdAt: string, nowMs: number = Date.now()): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Math.max(0, nowMs - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
