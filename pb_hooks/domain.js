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

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/**
 * Generates an 8-character team invite code (unique index on teams.inviteCode).
 * Unambiguous uppercase alphanumerics so codes are easy to read aloud.
 */
export function generateInviteCode() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
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

/**
 * True when the applicant already has a pending join request for the team —
 * duplicates are rejected (§2 Mode 2: one request at a time per team).
 */
export function hasPendingRequest(requests, teamId, applicantId) {
  return requests.some(
    (r) =>
      r.team === teamId && r.applicant === applicantId && r.status === "pending"
  );
}

/** True when the applicant is the team's own leader (self-join guard). */
export function isSelfJoin(team, applicantId) {
  return Boolean(team && applicantId && team.leader === applicantId);
}

// Teams: the countdown target (§4B, §9). Server-owned like leader/status —
// the create hook derives `deadline = createdAt + TEAM_DEADLINE_HOURS`.
export const TEAM_DEADLINE_HOURS = 48;

/** ISO string `hours` after the team's creation instant. */
export function deadlineFor(createdAt) {
  return new Date(
    createdAt.getTime() + TEAM_DEADLINE_HOURS * 3600 * 1000
  ).toISOString();
}

/** Whole hours remaining until the deadline (0 once passed). */
export function hoursUntil(deadline, now) {
  const ms = deadline.getTime() - now.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / (3600 * 1000));
}

/** True when the deadline is closer than the §9 red-pulse threshold (24h). */
export function isUrgent(remainingMs) {
  return remainingMs > 0 && remainingMs < 24 * 3600 * 1000;
}

/** Members dropped between an old and new roster (leader removal, §4B). */
export function removedMembers(oldMembers, newMembers) {
  const next = new Set(newMembers || []);
  return (oldMembers || []).filter((id) => !next.has(id));
}

/** True when the user is a member of the team (workspace access, §4B). */
export function isTeamMember(team, userId) {
  if (!team || !userId) return false;
  return (team.members || []).includes(userId);
}

// Resource link detection (§4C — universal embeds). Server-side source of
// truth: the create hook derives type/embeddable from the URL. Hostname must
// END with the known domain — lookalikes like "figma.com.evil.example" or
// "canva.com@evil.example" fall through to `other` (spoof guard).
const EMBEDDABLE_DOMAINS = { "figma.com": true, "excalidraw.com": true };
const KNOWN_DOMAINS = [
  "figma.com",
  "canva.com",
  "drive.google.com",
  "github.com",
  "excalidraw.com",
];

export function detectResourceType(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const match = KNOWN_DOMAINS.find(
      (d) => hostname === d || hostname.endsWith("." + d)
    );
    if (!match) {
      return { type: "other", embeddable: false };
    }
    return {
      type: match.split(".")[0],
      embeddable: EMBEDDABLE_DOMAINS[match] === true,
    };
  } catch {
    return { type: "other", embeddable: false };
  }
}
