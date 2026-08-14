/**
 * Safely interpolate a value into a PocketBase filter string.
 *
 * PocketBase filter literals are JSON strings, so JSON.stringify gives us
 * correct quoting AND escapes any quotes/backslashes inside the value — the
 * same trick already used in tickets.ts. Never build a filter with raw
 * interpolation: a malicious invite code like `' || 1=1 --` must stay a
 * literal string, not become filter syntax (§3.1).
 */
export function pbEscape(
  value: string | number | boolean | null | undefined
): string {
  return JSON.stringify(String(value ?? ""));
}
