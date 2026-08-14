// pb_hooks/hooks-common.js — shared messages + DB helpers for the hook wiring.
// PB hook handlers are isolated programs (top-level consts in main.pb.js are
// invisible inside handlers), so everything handlers need beyond the pure
// rules lives here and is required per-handler. No PB globals at load time.
//
// Everything here is synchronous: the goja dispatcher does not await handler
// promises, and all PB app APIs are synchronous anyway.

const MSG = Object.freeze({
  COLLEGE_EMAIL: "Only college email addresses can register.",
  DUPLICATE_SWIPE: "You have already swiped on this profile.",
  SELF_SWIPE: "You cannot swipe on yourself.",
  SINGLE_TEAM: "You are already in a team.",
  OTP_GATE:
    "Only college email addresses (or allowlisted accounts) can request a login code.",
  PRIVILEGE: "Privilege fields (admin/mentor) are server-managed.",
  NOT_TEAM_MEMBER: "You are not a member of this team.",
  TEAM_AUTH: "Authentication required to create a team.",
  NOT_MATCH_MEMBER: "You are not a member of this match.",
  AUTH_REQUIRED: "Authentication required.",
  ALREADY_IN_TEAM: "You are already in a team.",
  DUPLICATE_REQUEST: "You already have a pending request for this team.",
  SELF_JOIN: "You are the leader of this team.",
  TEAM_FULL: "This team is already full.",
  REQUEST_NOT_PENDING: "This request has already been decided.",
  CANNOT_REMOVE_LEADER: "The leader cannot be removed from the team.",
  MENTOR_ONLY: "Only mentors can update ticket status.",
  NO_TICKET_ACCESS: "You do not have access to this ticket.",
});

/**
 * Single-active-team rule (§2): none of the given users may already belong to
 * another team (optionally excluding one team id, used on member updates).
 */
function ensureMembersAreFree(app, members, excludeTeamId) {
  for (const memberId of members || []) {
    const teams = app.findRecordsByFilter(
      "teams",
      // ?~ is array-contains; ~ is substring — the latter would match a
      // user id contained inside another id, never a real membership.
      "members ?~ {:id}",
      "id",
      10,
      0,
      { id: memberId }
    );
    const busy = teams.find((t) => t.id !== excludeTeamId);
    if (busy) {
      throw new Error(MSG.SINGLE_TEAM);
    }
  }
}

/**
 * §12 beta metrics — anonymous event log (no user ids, no emails). Failures are
 * swallowed so the write path is never broken by analytics.
 */
function recordMetric(app, event) {
  if (!event) return;
  try {
    const record = new Record(app.findCollectionByNameOrId("metrics_events"));
    record.set("action", event.action);
    record.set("at", event.at);
    app.save(record);
  } catch {
    // metrics must never break the write path
  }
}

/**
 * Whether the user already belongs to another team. Per-user query (not a
 * full-table scan), so the check stays correct past 1000 teams.
 */
function userHasTeam(app, userId, excludeTeamId) {
  try {
    ensureMembersAreFree(app, [userId], excludeTeamId);
    return false;
  } catch {
    return true;
  }
}

module.exports = { MSG, ensureMembersAreFree, userHasTeam, recordMetric };
