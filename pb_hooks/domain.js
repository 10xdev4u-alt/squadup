// Pure domain rules for SquadUp's PocketBase hooks.
// Deliberately free of $app/DB references so every rule is unit-testable.

// College email domains allowed to register (§5, §8). Configure per college.
const COLLEGE_DOMAINS = ["college.edu"];

/**
 * True when the email belongs to the college domain (or a subdomain of it).
 * Lookalike domains like "college.edu.evil.com" are rejected by design.
 */
export function isCollegeEmail(email) {
  if (typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return COLLEGE_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
}
