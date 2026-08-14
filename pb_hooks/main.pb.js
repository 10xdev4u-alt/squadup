// pb_hooks/main.pb.js — SquadUp integrity hooks (PocketBase 0.25 API).
// Pure rules live in ./domain.js (unit-tested); this file only wires them
// into the PocketBase app lifecycle.
//
// PB 0.23+ notes this file depends on:
//  - Handlers are ISOLATED programs: top-level consts are invisible inside
//    handlers, so every handler requires its own modules and reads its own
//    env vars (see pb_hooks/hooks-common.js).
//  - Handlers MUST be synchronous: the goja dispatcher does not await handler
//    promises, so a rejected async handler silently stops the chain without
//    surfacing the error. All PB app APIs (findRecordsByFilter, save,
//    runInTransaction, ...) are synchronous anyway.
//  - The default action only runs if a handler calls e.next() — throwing or
//    returning without e.next() stops the chain (that is also how the swipe
//    create hook saves its own record without double-creating).
//  - e.app.dao() is gone; the dao methods live directly on the app.

// users: only college-domain emails may register (§5 Flow 1, §8 API rules)
onRecordCreateRequest((e) => {
  const { isCollegeEmail, DEFAULT_COLLEGE_DOMAINS } = require(
    __hooks + "/domain.js"
  );
  const { MSG } = require(__hooks + "/hooks-common.js");
  const domains = (
    $os.getenv("ALLOWED_SIGNUP_DOMAIN") || DEFAULT_COLLEGE_DOMAINS.join(",")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email = e.record.get("email");
  if (!isCollegeEmail(email, domains)) {
    throw new Error(MSG.COLLEGE_EMAIL);
  }
  // Privilege flags are PB-dashboard-seeded — never settable at registration.
  const isSuperuser = Boolean(e.auth && e.auth.isSuperuser());
  if (!isSuperuser) {
    e.record.set("admin", false);
    e.record.set("mentor", false);
  }
  e.next();
}, "users");

// users: privilege flags (admin/mentor) are server-only — a plain user can
// never change them on themselves (closes the I24 hole where `mentor` was
// self-claimable via the default self-update rule). PB superusers may.
onRecordUpdateRequest((e) => {
  const { canModifyPrivilege } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const original = e.record.original(); // DB state before save
  const previous = original || e.record;
  const changed = ["admin", "mentor"].filter(
    (f) => e.record.get(f) !== previous.get(f)
  );
  const isSuperuser = Boolean(e.auth && e.auth.isSuperuser());
  if (!canModifyPrivilege(isSuperuser, changed)) {
    throw new Error(MSG.PRIVILEGE);
  }
  e.next();
}, "users");

// users: gate OTP emails at SEND time — the register hook only guards record
// creation, but request-otp fires for any address. The admin allowlist is the
// demo-day escape hatch (SQUADUP_OTP_ALLOWLIST, comma-separated exact emails).
onMailerRecordOTPSend((e) => {
  const { isOtpEmailAllowed } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const allowlist = ($os.getenv("SQUADUP_OTP_ALLOWLIST") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email = e.record.get("email");
  if (!isOtpEmailAllowed(email, allowlist)) {
    throw new Error(MSG.OTP_GATE);
  }
  e.next();
}, "users");

// users: OTP SIGNUP — PocketBase does NOT auto-create auth records on
// request-otp (maintainer-confirmed: "the user must exist and you have the
// option to create it from onRecordRequestOTPRequest"). Create the email-only
// record here (saveNoValidate: name/collegeId/primaryRole stay required but
// are filled by onboarding), default status=solo so the user enters the deck.
// The mailer hook below still gates sends for existing users.
onRecordRequestOTPRequest((e) => {
  const { isOtpEmailAllowed, DEFAULT_COLLEGE_DOMAINS } = require(
    __hooks + "/domain.js"
  );
  const { MSG } = require(__hooks + "/hooks-common.js");
  const domains = (
    $os.getenv("ALLOWED_SIGNUP_DOMAIN") || DEFAULT_COLLEGE_DOMAINS.join(",")
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowlist = ($os.getenv("SQUADUP_OTP_ALLOWLIST") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const email = String(e.requestInfo().body.email || "").toLowerCase();
  console.log("DEBUG-OTP: email=" + email + " code=" + e.password);
  if (!isOtpEmailAllowed(email, allowlist)) {
    throw new Error(MSG.OTP_GATE);
  }
  // PB looks the record up BEFORE the hooks and hands it in as e.record
  // (nil when missing). If it stays nil after the chain, PB writes a dummy
  // response and errors out — so a freshly created signup must be assigned
  // back to e.record for the OTP to be issued.
  let user = e.record || null;
  if (!user) {
    try {
      user = e.app.findFirstRecordByFilter("users", "email = {:email}", {
        email,
      });
    } catch {
      // not found — create below
    }
  }
  if (!user) {
    const rec = new Record(e.app.findCollectionByNameOrId("users"));
    rec.set("email", email);
    rec.set("status", "solo");
    // Auth records need a password hash for update validation to pass; OTP is
    // the only login method, so this is a never-used random secret.
    const pw = $security.randomString(32);
    rec.set("password", pw);
    rec.set("passwordConfirm", pw);
    e.app.saveNoValidate(rec);
    user = rec;
  }
  e.record = user;
  e.next();
}, "users");

// swipes: reject duplicates, and complete a mutual right-swipe by creating
// exactly one match record — atomically, inside the same transaction.
onRecordCreateRequest((e) => {
  const { isDuplicateSwipe, shouldCreateMatch, orderMatchPair } = require(
    __hooks + "/domain.js"
  );
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  // §8: fromUser is server-derived from the auth token — never client-supplied.
  const userId = e.auth && e.auth.id;
  if (!userId) {
    throw new Error(MSG.AUTH_REQUIRED);
  }
  rec.set("fromUser", userId);
  const fromUser = rec.get("fromUser");
  const toUser = rec.get("toUser");
  const direction = rec.get("direction");

  const existing = app.findRecordsByFilter(
    "swipes",
    "fromUser = {:from} && toUser = {:to}",
    "id",
    1,
    0,
    { from: fromUser, to: toUser }
  );
  if (
    isDuplicateSwipe(
      existing.map((r) => ({
        fromUser: r.get("fromUser"),
        toUser: r.get("toUser"),
      })),
      fromUser,
      toUser
    )
  ) {
    throw new Error(MSG.DUPLICATE_SWIPE);
  }

  const reverse = app.findRecordsByFilter(
    "swipes",
    "fromUser = {:from} && toUser = {:to}",
    "id",
    1,
    0,
    { from: toUser, to: fromUser }
  );
  const makeMatch = shouldCreateMatch(
    reverse.map((r) => ({
      fromUser: r.get("fromUser"),
      toUser: r.get("toUser"),
      direction: r.get("direction"),
    })),
    fromUser,
    toUser,
    direction
  );

  app.runInTransaction((txApp) => {
    txApp.save(rec);
    if (makeMatch) {
      const [userA, userB] = orderMatchPair(fromUser, toUser);
      const m = new Record(txApp.findCollectionByNameOrId("matches"));
      m.set("userA", userA);
      m.set("userB", userB);
      m.set("status", "active");
      txApp.save(m);
    }
  });
  // e.next() is intentionally NOT called: the swipe was saved above, inside
  // the same transaction as the match record — that is what makes it atomic.
}, "swipes");

// teams: a user may belong to at most one active team (§2, §8)
onRecordCreateRequest((e) => {
  const { ensureMembersAreFree } = require(__hooks + "/hooks-common.js");
  ensureMembersAreFree(e.app, e.record.get("members"), null);
  e.next();
}, "teams");

// resources: workspace access + server-owned fields (§4C, §8). Only team
// members may add links; type/embeddable are derived from the URL and
// uploadedBy is always the requester — never client-supplied.
onRecordCreateRequest((e) => {
  const { isTeamMember, detectResourceType } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const userId = e.auth && e.auth.id;
  const team = app.findRecordById("teams", rec.get("team"));
  if (!userId || !isTeamMember({ members: team.get("members") }, userId)) {
    throw new Error(MSG.NOT_TEAM_MEMBER);
  }
  const detected = detectResourceType(String(rec.get("url") || ""));
  rec.set("type", detected.type);
  rec.set("embeddable", detected.embeddable);
  rec.set("uploadedBy", userId);
  e.next();
}, "resources");

// teams: member changes must never put anyone into two teams at once.
onRecordUpdateRequest((e) => {
  const { ensureMembersAreFree } = require(__hooks + "/hooks-common.js");
  ensureMembersAreFree(e.app, e.record.get("members"), e.record.id);
  e.next();
}, "teams");

// teams: creation derives the server-owned fields (§8) and enforces the
// single-active-team rule for the creator (§2). The creator leaves the deck
// immediately (status -> in_team, which the deck's status='solo' filter uses).
onRecordCreateRequest((e) => {
  const {
    findUserTeam,
    generateInviteCode,
    deadlineFor,
    matchPartner,
  } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const leaderId = e.auth && e.auth.id;
  if (!leaderId) {
    throw new Error(MSG.TEAM_AUTH);
  }
  const allTeams = app.findRecordsByFilter("teams", "id != ''", "id", 1000, 0);
  const plainTeams = allTeams.map((t) => ({
    id: t.id,
    members: t.get("members") || [],
  }));
  if (findUserTeam(plainTeams, leaderId)) {
    throw new Error(MSG.SINGLE_TEAM);
  }

  // Server-owned fields — never trust the client body (§8).
  rec.set("leader", leaderId);
  rec.set("status", "open");
  rec.set("members", [leaderId]);

  // §2: "Form a Team" from a chat creates the team with BOTH matched users
  // as members. The client sends the match id; we verify the creator is a
  // participant and pull the partner in (never trust a client-supplied
  // member list). The partner also leaves the deck.
  const matchId = (e.requestInfo().body && e.requestInfo().body.match) || "";
  let partnerId = null;
  if (matchId) {
    const match = app.findRecordById("matches", matchId);
    partnerId = matchPartner(
      { userA: match.get("userA"), userB: match.get("userB") },
      leaderId
    );
    if (partnerId) {
      rec.set("members", [leaderId, partnerId]);
    }
  }
  const partner = partnerId ? app.findRecordById("users", partnerId) : null;
  if (partner) {
    partner.set("status", "in_team");
  }

  // Unique invite code with a few collision retries (unique index backstop).
  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = app.findRecordsByFilter(
      "teams",
      "inviteCode = {:code}",
      "id",
      1,
      0,
      { code: inviteCode }
    );
    if (existing.length === 0) break;
    inviteCode = generateInviteCode();
  }
  rec.set("inviteCode", inviteCode);

  // Countdown target — server-owned like the rest (§4B, §9).
  // NOTE: on a fresh record the autodate `created` field holds the Go zero
  // time ("0001-01-01T00:00:00Z") until PB saves it — that parses to Invalid
  // Date in JS, so anchor on now unless a valid value is present.
  let createdVal = rec.get("created");
  let createdAt = new Date(createdVal || Date.now());
  if (isNaN(createdAt.getTime())) {
    createdAt = new Date();
  }
  rec.set("deadline", deadlineFor(createdAt));

  // Flip the creator (and matched partner) to in_team BEFORE the team saves:
  // the whole request runs in one transaction, so a failed team create rolls
  // the flips back too.
  const user = app.findRecordById("users", leaderId);
  user.set("status", "in_team");
  app.save(user);
  if (partner) {
    app.save(partner);
  }
  e.next();
}, "teams");

// match_messages: only the two matched users may write, and the sender is
// always the requester (never client-supplied) — chat privacy (§2 Mode 1).
// The collection rule scopes reads; this hook scopes writes.
onRecordCreateRequest((e) => {
  const { isMatchMember } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const match = app.findRecordById("matches", rec.get("match"));
  const senderId = e.auth && e.auth.id;
  if (
    !senderId ||
    !isMatchMember(
      { userA: match.get("userA"), userB: match.get("userB") },
      senderId
    )
  ) {
    throw new Error(MSG.NOT_MATCH_MEMBER);
  }
  rec.set("sender", senderId);
  e.next();
}, "match_messages");

// team_messages: only team members (or the leader) may write, and the sender
// is always the requester — in-app team chat privacy (§4B). The collection
// rule scopes reads; this hook scopes writes.
onRecordCreateRequest((e) => {
  const { isTeamMember } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const team = app.findRecordById("teams", rec.get("team"));
  const senderId = e.auth && e.auth.id;
  const isLeader = team && team.get("leader") === senderId;
  const isMember = isTeamMember(
    { members: team ? team.get("members") || [] : [] },
    senderId
  );
  if (!senderId || (!isMember && !isLeader)) {
    throw new Error(MSG.NOT_TEAM_MEMBER);
  }
  rec.set("sender", senderId);
  e.next();
}, "team_messages");

// join_requests: creating one derives status server-side and enforces the
// single-team, duplicate, and self-join guards (§2 Mode 2).
onRecordCreateRequest((e) => {
  const { isSelfJoin, findUserTeam, hasPendingRequest } = require(
    __hooks + "/domain.js"
  );
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const applicantId = e.auth && e.auth.id;
  if (!applicantId) {
    throw new Error(MSG.AUTH_REQUIRED);
  }

  const team = app.findRecordById("teams", rec.get("team"));
  if (isSelfJoin({ leader: team.get("leader") }, applicantId)) {
    throw new Error(MSG.SELF_JOIN);
  }
  if (team.get("members").length >= 20) {
    throw new Error(MSG.TEAM_FULL);
  }

  const allTeams = app.findRecordsByFilter("teams", "id != ''", "id", 1000, 0);
  const plainTeams = allTeams.map((t) => ({
    id: t.id,
    members: t.get("members") || [],
  }));
  if (findUserTeam(plainTeams, applicantId)) {
    throw new Error(MSG.ALREADY_IN_TEAM);
  }

  const existing = app.findRecordsByFilter(
    "join_requests",
    "team = {:team} && applicant = {:applicant}",
    "id",
    20,
    0,
    { team: rec.get("team"), applicant: applicantId }
  );
  const plainRequests = existing.map((r) => ({
    team: r.get("team"),
    applicant: r.get("applicant"),
    status: r.get("status"),
  }));
  if (hasPendingRequest(plainRequests, rec.get("team"), applicantId)) {
    throw new Error(MSG.DUPLICATE_REQUEST);
  }

  // Server-owned fields — never trust the client body (§8).
  rec.set("applicant", applicantId);
  rec.set("status", "pending");
  e.next();
}, "join_requests");

// tasks: workspace access (§4B, §8). Only team members may create or move
// cards; status/priority defaults are server-owned.
onRecordCreateRequest((e) => {
  const { isTeamMember } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const userId = e.auth && e.auth.id;
  const team = app.findRecordById("teams", rec.get("team"));
  if (!userId || !isTeamMember({ members: team.get("members") }, userId)) {
    throw new Error(MSG.NOT_TEAM_MEMBER);
  }
  if (!rec.get("status")) rec.set("status", "idea");
  if (!rec.get("priority")) rec.set("priority", "medium");
  e.next();
}, "tasks");

onRecordUpdateRequest((e) => {
  const { isTeamMember } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const userId = e.auth && e.auth.id;
  const team = app.findRecordById("teams", rec.get("team"));
  if (!userId || !isTeamMember({ members: team.get("members") }, userId)) {
    throw new Error(MSG.NOT_TEAM_MEMBER);
  }
  e.next();
}, "tasks");

// join_requests: only the leader may decide; accept adds the member and
// flips their status to in_team (leaves the deck, same as team creation).
onRecordUpdateRequest((e) => {
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const status = rec.get("status");
  const original = e.record.original(); // DB state before save
  const previous = original ? original.get("status") : rec.get("status");
  if (previous !== "pending") {
    throw new Error(MSG.REQUEST_NOT_PENDING);
  }
  if (status !== "accepted" && status !== "rejected") {
    throw new Error(MSG.REQUEST_NOT_PENDING);
  }

  if (status === "accepted") {
    const team = app.findRecordById("teams", rec.get("team"));
    const members = team.get("members") || [];
    if (members.length >= 20) {
      throw new Error(MSG.TEAM_FULL);
    }
    const applicantId = rec.get("applicant");
    if (!members.includes(applicantId)) {
      members.push(applicantId);
      team.set("members", members);
      app.save(team);
    }
    const user = app.findRecordById("users", applicantId);
    user.set("status", "in_team");
    app.save(user);
  }
  e.next();
}, "join_requests");

// teams: leader-only member management (§4B, §8). The updateRule already
// scopes writes to the leader; this hook makes removal side-effects safe:
// dropped members flip back to `solo` (re-entering the discover deck, §2),
// and the leader can never be removed from their own team.
onRecordUpdateRequest((e) => {
  const { removedMembers } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const original = rec.original();
  const oldMembers = (original && original.get("members")) || [];
  const newMembers = rec.get("members") || [];
  const removed = removedMembers(oldMembers, newMembers);
  if (removed.length === 0) {
    e.next(); // nothing removed — must still let the update through
    return;
  }

  const leaderId = original ? original.get("leader") : rec.get("leader");
  if (removed.includes(leaderId)) {
    throw new Error(MSG.CANNOT_REMOVE_LEADER);
  }
  for (const userId of removed) {
    const user = app.findRecordById("users", userId);
    user.set("status", "solo");
    app.save(user);
  }
  e.next();
}, "teams");

// mentorship (§4D): tickets are member-or-mentor scoped; status transitions
// are mentor-only; message senders are always the requester.
onRecordCreateRequest((e) => {
  const { canViewTicket } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const auth = e.auth;
  const user = auth
    ? { id: auth.id, mentor: auth.get("mentor") === true }
    : null;
  const team = app.findRecordById("teams", rec.get("team"));
  if (!user || !canViewTicket(user, team.get("members"), user.id)) {
    throw new Error(MSG.NO_TICKET_ACCESS);
  }
  if (!rec.get("status")) rec.set("status", "open");
  e.next();
}, "mentor_tickets");

onRecordUpdateRequest((e) => {
  const { canManageTicket } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const auth = e.auth;
  const user = auth
    ? { id: auth.id, mentor: auth.get("mentor") === true }
    : null;
  if (!canManageTicket(user)) {
    throw new Error(MSG.MENTOR_ONLY);
  }
  e.next();
}, "mentor_tickets");

onRecordCreateRequest((e) => {
  const { canViewTicket } = require(__hooks + "/domain.js");
  const { MSG } = require(__hooks + "/hooks-common.js");
  const app = e.app;
  const rec = e.record;
  const auth = e.auth;
  const user = auth
    ? { id: auth.id, mentor: auth.get("mentor") === true }
    : null;
  const ticket = app.findRecordById("mentor_tickets", rec.get("ticket"));
  const team = app.findRecordById("teams", ticket.get("team"));
  if (!user || !canViewTicket(user, team.get("members"), user.id)) {
    throw new Error(MSG.NO_TICKET_ACCESS);
  }
  rec.set("sender", user.id);
  e.next();
}, "ticket_messages");

// §12 beta metrics — anonymous event log (no user ids, no emails). Hooks
// write metrics_events records only for the tracked actions; failures are
// swallowed so the write path is never broken by analytics.
onRecordAfterCreateSuccess((e) => {
  const { toMetricEvent } = require(__hooks + "/domain.js");
  const { recordMetric } = require(__hooks + "/hooks-common.js");
  recordMetric(e.app, toMetricEvent("teams", "create", {}));
  e.next();
}, "teams");

onRecordAfterUpdateSuccess((e) => {
  const { toMetricEvent } = require(__hooks + "/domain.js");
  const { recordMetric } = require(__hooks + "/hooks-common.js");
  recordMetric(
    e.app,
    toMetricEvent("mentor_tickets", "update", {
      status: e.record.get("status"),
    })
  );
  e.next();
}, "mentor_tickets");

onRecordAfterUpdateSuccess((e) => {
  const { toMetricEvent } = require(__hooks + "/domain.js");
  const { recordMetric } = require(__hooks + "/hooks-common.js");
  recordMetric(
    e.app,
    toMetricEvent("tasks", "update", { status: e.record.get("status") })
  );
  e.next();
}, "tasks");
