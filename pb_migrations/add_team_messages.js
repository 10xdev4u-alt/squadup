// pb_migrations/add_team_messages.js
// In-app team chat (§4B "team chat for collab"): team_messages mirrors
// match_messages — reads scoped to team members + leader via listRule, and
// the create hook derives sender server-side so clients can never spoof it.
migrate((app) => {
  const teams = app.findCollectionByNameOrId("teams");
  const users = app.findCollectionByNameOrId("users");

  const teamMessages = new Collection({
    type: "base",
    name: "team_messages",
    listRule:
      "team.members ?~ @request.auth.id || team.leader = @request.auth.id",
    viewRule:
      "team.members ?~ @request.auth.id || team.leader = @request.auth.id",
    createRule:
      "team.members ?~ @request.auth.id || team.leader = @request.auth.id",
    fields: [
      {
        type: "relation",
        name: "team",
        collectionId: teams.id,
        maxSelect: 1,
        required: true,
        cascadeDelete: true,
      },
      {
        type: "relation",
        name: "sender",
        collectionId: users.id,
        maxSelect: 1,
        required: true,
      },
      { type: "text", name: "message", required: true, max: 2000 },
    ],
  });
  app.save(teamMessages);
});
