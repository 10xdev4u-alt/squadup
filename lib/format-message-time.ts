// ============================================================================
// Message timestamp formatting — PB stores `created` as "2026-08-14 12:30:00Z".
// Rows written before a timestamps backfill can carry an empty/invalid value,
// and new Date("") is Invalid Date, which would render "Invalid Date" in chat.
// Always format through here so a bad value degrades to no timestamp at all.
// ============================================================================

export function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
