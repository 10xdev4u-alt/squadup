// pb_hooks/main.pb.js — SquadUp integrity hooks.
// Pure rules live in ./domain.js (unit-tested); this file only wires them
// into the PocketBase app lifecycle.

const {
  DEFAULT_COLLEGE_DOMAINS,
  isCollegeEmail,
  isOtpEmailAllowed,
  isDuplicateSwipe,
  shouldCreateMatch,
  findUserTeam,
  generateInviteCode,
  isMatchMember,
  hasPendingRequest,
  isSelfJoin,
  TEAM_DEADLINE_HOURS,
  deadlineFor,

  orderMatchPair,
} = require("./domain.js");

// College domains come from ALLOWED_SIGNUP_DOMAIN (comma-separated) when set,
// else the hardcoded default. Read once at boot — correct for a server process.
const COLLEGE_DOMAINS = (
  $os.getenv("ALLOWED_SIGNUP_DOMAIN") || DEFAULT_COLLEGE_DOMAINS.join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const COLLEGE_EMAIL_MSG = "Only college email addresses can register.";
const DUPLICATE_SWIPE_MSG = "You have already swiped on this profile.";
const SINGLE_TEAM_MSG = "You are already in a team.";
const OTP_GATE_MSG =
  "Only college email addresses (or allowlisted accounts) can request a login code.";

// users: only college-domain emails may register (§5 Flow 1, §8 API rules)
onRecordBeforeCreateRequest((e) => {
  const email = e.record.get("email");
  if (!isCollegeEmail(email, COLLEGE_DOMAINS)) {
    throw new Error(COLLEGE_EMAIL_MSG);
  }
}, "users");

// users: gate OTP emails at SEND time — the register hook only guards record
// creation, but request-otp fires for any address. The admin allowlist is the
// demo-day escape hatch (SQUADUP_OTP_ALLOWLIST, comma-separated exact emails).
const OTP_ALLOWLIST = ($os.getenv("SQUADUP_OTP_ALLOWLIST") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

onMailerRecordOTPSend((e) => {
  const email = e.record.get("email");
  if (!isOtpEmailAllowed(email, OTP_ALLOWLIST)) {
    throw new Error(OTP_GATE_MSG);
  }
  e.next();
}, "users");

// swipes: reject duplicates, and complete a mutual right-swipe by creating
// exactly one match record — atomically, inside the same transaction.
onRecordBeforeCreateRequest(async (e) => {
  const dao = e.app.dao();
  const rec = e.record;
  const fromUser = rec.get("fromUser");
  const toUser = rec.get("toUser");
  const direction = rec.get("direction");

  const existing = await dao.findRecordsByFilter(
    "swipes",
    "fromUser = {:from} && toUser = {:to}",
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
    throw new Error(DUPLICATE_SWIPE_MSG);
  }

  const reverse = await dao.findRecordsByFilter(
    "swipes",
    "fromUser = {:from} && toUser = {:to}",
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

  await dao.runInTransaction(async (txDao) => {
    await txDao.save(rec);
    if (makeMatch) {
      const [userA, userB] = orderMatchPair(fromUser, toUser);
      const matches = e.app.findCollectionByNameOrId("matches");
      const m = new Record(matches);
      m.set("userA", userA);
      m.set("userB", userB);
      m.set("status", "active");
      await txDao.save(m);
    }
  });
  // e.next() is intentionally NOT called: the swipe was saved above, inside the
  // same transaction as the match record — that is what makes it atomic.
}, "swipes");

// teams: a user may belong to at most one active team (§2, §8)
async function ensureMembersAreFree(dao, members, excludeTeamId) {
  for (const memberId of members || []) {
    const teams = await dao.findRecordsByFilter(
      "teams",
      "members ~ {:id}",
      10,
      0,
      { id: memberId }
    );
    const busy = teams.find((t) => t.id !== excludeTeamId);
    if (busy) {
      throw new Error(SINGLE_TEAM_MSG);
    }
  }
}

onRecordBeforeCreateRequest(async (e) => {
  await ensureMembersAreFree(e.app.dao(), e.record.get("members"), null);
}, "teams");

onRecordBeforeUpdateRequest(async (e) => {
  await ensureMembersAreFree(e.app.dao(), e.record.get("members"), e.record.id);
}, "teams");

// teams: creation derives the server-owned fields (§8) and enforces the
// single-active-team rule for the creator (§2). The creator leaves the deck
// immediately (status -> in_team, which the deck's status='solo' filter uses).
const TEAM_AUTH_MSG = "Authentication required to create a team.";
const NOT_MATCH_MEMBER_MSG = "You are not a member of this match.";

onRecordBeforeCreateRequest(async (e) => {
  const dao = e.app.dao();
  const rec = e.record;
  const leaderId = e.request.auth && e.request.auth.id;
  if (!leaderId) {
    throw new Error(TEAM_AUTH_MSG);
  }
  const allTeams = await dao.findRecordsByFilter(
    "teams",
    "id != ''",
    1000,
    0,
    {}
  );
  if (findUserTeam(allTeams, leaderId)) {
    throw new Error(SINGLE_TEAM_MSG);
  }

  // Server-owned fields — never trust the client body (§8).
  rec.set("leader", leaderId);
  rec.set("status", "open");
  rec.set("members", [leaderId]);

  // Unique invite code with a few collision retries (unique index backstop).
  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await dao.findRecordsByFilter(
      "teams",
      "inviteCode = {:code}",
      1,
      0,
      { code: inviteCode }
    );
    if (existing.length === 0) break;
    inviteCode = generateInviteCode();
  }
  rec.set("inviteCode", inviteCode);

  // Countdown target — server-owned like the rest (§4B, §9).
  const createdAt = new Date(rec.get("created") || Date.now());
  rec.set("deadline", deadlineFor(createdAt));

  // Flip the creator to in_team BEFORE the team saves: if the save fails they
  // can retry, and the deck (status='solo') already excludes them on success.
  const user = await dao.findRecordById("users", leaderId);
  user.set("status", "in_team");
  await dao.save(user);
}, "teams");

// match_messages: only the two matched users may write, and the sender is
// always the requester (never client-supplied) — chat privacy (§2 Mode 1).
// The collection rule scopes reads; this hook scopes writes.
onRecordBeforeCreateRequest(async (e) => {
  const dao = e.app.dao();
  const rec = e.record;
  const match = await dao.findRecordById("matches", rec.get("match"));
  const senderId = e.request.auth && e.request.auth.id;
  if (
    !senderId ||
    !isMatchMember(
      { userA: match.get("userA"), userB: match.get("userB") },
      senderId
    )
  ) {
    throw new Error(NOT_MATCH_MEMBER_MSG);
  }
  rec.set("sender", senderId);
}, "match_messages");

// join_requests: creating one derives status server-side and enforces the
// single-team, duplicate, and self-join guards (§2 Mode 2).
const ALREADY_IN_TEAM_MSG = "You are already in a team.";
const DUPLICATE_REQUEST_MSG =
  "You already have a pending request for this team.";
const SELF_JOIN_MSG = "You are the leader of this team.";
const TEAM_FULL_MSG = "This team is already full.";

onRecordBeforeCreateRequest(async (e) => {
  const dao = e.app.dao();
  const rec = e.record;
  const applicantId = e.request.auth && e.request.auth.id;
  if (!applicantId) {
    throw new Error("Authentication required.");
  }

  const team = await dao.findRecordById("teams", rec.get("team"));
  if (isSelfJoin({ leader: team.get("leader") }, applicantId)) {
    throw new Error(SELF_JOIN_MSG);
  }
  if (team.get("members").length >= 20) {
    throw new Error(TEAM_FULL_MSG);
  }

  const allTeams = await dao.findRecordsByFilter(
    "teams",
    "id != ''",
    1000,
    0,
    {}
  );
  if (findUserTeam(allTeams, applicantId)) {
    throw new Error(ALREADY_IN_TEAM_MSG);
  }

  const existing = await dao.findRecordsByFilter(
    "join_requests",
    "team = {:team} && applicant = {:applicant}",
    20,
    0,
    { team: rec.get("team"), applicant: applicantId }
  );
  if (hasPendingRequest(existing, rec.get("team"), applicantId)) {
    throw new Error(DUPLICATE_REQUEST_MSG);
  }

  // Server-owned fields — never trust the client body (§8).
  rec.set("applicant", applicantId);
  rec.set("status", "pending");
}, "join_requests");

// join_requests: only the leader may decide; accept adds the member and
// flips their status to in_team (leaves the deck, same as team creation).
const REQUEST_NOT_PENDING_MSG = "This request has already been decided.";

onRecordBeforeUpdateRequest(async (e) => {
  const dao = e.app.dao();
  const rec = e.record;
  const status = rec.get("status");
  const original = e.record.getOriginal(); // PB 0.23+ — DB state before save
  const previous = original ? original.get("status") : rec.get("status");
  if (previous !== "pending") {
    throw new Error(REQUEST_NOT_PENDING_MSG);
  }
  if (status !== "accepted" && status !== "rejected") {
    throw new Error(REQUEST_NOT_PENDING_MSG);
  }

  if (status === "accepted") {
    const team = await dao.findRecordById("teams", rec.get("team"));
    const members = team.get("members") || [];
    if (members.length >= 20) {
      throw new Error(TEAM_FULL_MSG);
    }
    const applicantId = rec.get("applicant");
    if (!members.includes(applicantId)) {
      members.push(applicantId);
      team.set("members", members);
      await dao.save(team);
    }
    const user = await dao.findRecordById("users", applicantId);
    user.set("status", "in_team");
    await dao.save(user);
  }
}, "join_requests");
