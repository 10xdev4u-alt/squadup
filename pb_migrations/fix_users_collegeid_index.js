// pb_migrations/fix_users_collegeid_index.js
// Live-run fix: OTP signup creates email-only user records whose collegeId is
// still empty (filled by onboarding — a flow gap: nothing collects it yet).
// A plain unique index on collegeId made the SECOND such signup fail with
// validation_not_unique (SQLite treats '' as a value). A partial index keeps
// §8 uniqueness for real college IDs while allowing empty pending values.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.indexes = users.indexes.map((idx) =>
    idx.includes("idx_users_collegeId")
      ? "CREATE UNIQUE INDEX idx_users_collegeId ON users (collegeId) WHERE collegeId != ''"
      : idx
  );
  app.save(users);
});
