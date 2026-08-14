// pb_migrations/fix_users_self_update.js
// Live-run fix (found while spinning up locally against real PB 0.25):
// the users auth collection shipped with NO updateRule, which PB treats as
// "nobody" — so the onboarding profile update (name/collegeId/bio/githubUrl/
// skills) was denied for every real user. This restores self-update; the
// onRecordUpdateRequest hook (canModifyPrivilege) still makes admin/mentor
// server-only, closing the I24 privilege-claim hole.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.updateRule = "id = @request.auth.id";
  app.save(users);
});
