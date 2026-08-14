// Pure domain rules for SquadUp's PocketBase hooks.
// Deliberately free of $app/DB references so every rule is unit-testable.

// College email domains allowed to register (§5, §8). The hook (main.pb.js)
// overrides this via the ALLOWED_SIGNUP_DOMAIN env var; this is the fallback.
export const DEFAULT_COLLEGE_DOMAINS = ["college.edu"];

/**
 * True when the email belongs to one of the given college domains (or a
 * subdomain of one). Lookalike domains like "college.edu.evil.com" are
 * rejected by design.
 */
export function isCollegeEmail(email, domains = DEFAULT_COLLEGE_DOMAINS) {
  if (typeof email !== "string") return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return domains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * True when this email may receive an OTP: college-domain (reuses
 * isCollegeEmail) OR an exact match in the admin allowlist (case-insensitive).
 * The allowlist is the demo-day escape hatch — never a substring match.
 */
export function isOtpEmailAllowed(email, allowlist = []) {
  if (!Array.isArray(allowlist) || typeof email !== "string") return false;
  if (isCollegeEmail(email)) return true;
  const normalized = email.toLowerCase();
  return allowlist.some(
    (entry) => typeof entry === "string" && entry.toLowerCase() === normalized
  );
}

/**
 * True when this exact (fromUser, toUser) swipe already exists.
 * The reverse direction is NOT a duplicate — that is a mutual match in waiting.
 */
export function isDuplicateSwipe(swipes, fromUser, toUser) {
  return swipes.some((s) => s.fromUser === fromUser && s.toUser === toUser);
}

/**
 * True when this swipe completes a mutual right-swipe (the target already
 * swiped right on the source). The caller is responsible for creating the
 * match record atomically with the swipe — the unique index is the backstop.
 */
export function shouldCreateMatch(
  swipes,
  fromUser,
  toUser,
  direction = "right"
) {
  if (direction !== "right") return false;
  return swipes.some(
    (s) =>
      s.fromUser === toUser && s.toUser === fromUser && s.direction === "right"
  );
}

/**
 * Returns the id of the team the user currently belongs to, or null.
 * Backs the single-active-team rule (§2: in any team -> out of the deck).
 */
export function findUserTeam(teams, userId) {
  const team = teams.find((t) => t.members.includes(userId));
  return team ? team.id : null;
}

/**
 * Canonical ordering for a match pair, so the unique index on (userA, userB)
 * catches both directions and no (a, b) / (b, a) duplicates can exist.
 */
export function orderMatchPair(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * True when the user is one of the two participants of the match.
 * Backs the chat security rule (§2): only the two matched users may read
 * or write a conversation. `match` is a plain { userA, userB } shape.
 */
export function isMatchMember(match, userId) {
  if (!match || !userId) return false;
  return match.userA === userId || match.userB === userId;
}
