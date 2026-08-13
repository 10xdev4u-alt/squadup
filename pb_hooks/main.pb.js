// pb_hooks/main.pb.js — SquadUp integrity hooks.
// Pure rules live in ./domain.js (unit-tested); this file only wires them
// into the PocketBase app lifecycle.

const {
  isCollegeEmail,
  isOtpEmailAllowed,
  isDuplicateSwipe,
  shouldCreateMatch,
  orderMatchPair,
} = require("./domain.js");

const COLLEGE_EMAIL_MSG = "Only college email addresses can register.";
const DUPLICATE_SWIPE_MSG = "You have already swiped on this profile.";
const SINGLE_TEAM_MSG = "You are already in a team.";
const OTP_GATE_MSG =
  "Only college email addresses (or allowlisted accounts) can request a login code.";

// users: only college-domain emails may register (§5 Flow 1, §8 API rules)
onRecordBeforeCreateRequest((e) => {
  const email = e.record.get("email");
  if (!isCollegeEmail(email)) {
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
