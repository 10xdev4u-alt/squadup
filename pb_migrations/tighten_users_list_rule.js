// pb_migrations/tighten_users_list_rule.js
// Security hardening (§4.11): the users listRule shipped as
// "@request.auth.id != null" — any logged-in user could enumerate the full
// account table (emails, bios, GitHub URLs). The only consumer that lists
// users is the discover deck (filter: status = 'solo' && name != ''), so
// the list rule is tightened to the deck population. Direct views (getOne,
// member expand) are untouched — viewRule stays auth-gated for the app.

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.listRule = "@request.auth.id != null && status = 'solo'";
  app.save(users);
});
