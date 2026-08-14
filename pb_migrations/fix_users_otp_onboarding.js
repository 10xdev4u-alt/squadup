// pb_migrations/fix_users_otp_onboarding.js
// Live-run fix: OTP signup creates an email-only record, then the onboarding
// wizard fills profile fields stepwise (name/bio/github → skills/primaryRole).
// `collegeId` and `primaryRole` were `required: true`, so the first profile
// PATCH failed validation for a fresh user (they're blank until later steps —
// collegeId has no UI at all yet). Required-ness is enforced by the app flow
// (onboarding + needsOnboarding), not the schema.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  for (const field of users.fields) {
    if (field.name === "collegeId" || field.name === "primaryRole") {
      field.required = false;
    }
  }
  app.save(users);
});
