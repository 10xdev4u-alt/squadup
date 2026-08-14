// pb_migrations/init_collections.js
// SquadUp §8 schema — all collections, API rules and unique indexes.
// Auto-applied by PocketBase on serve. The frontend contract mirrors this in
// types/squadup.ts; keep the two in sync (drift is a Gate 2 failure).

migrate(
  (app) => {
    // --- referenced collections first (ids are resolved for relation fields) ---

    const users = new Collection({
      type: "auth",
      name: "users",
      listRule: "@request.auth.id != null",
      viewRule: "@request.auth.id != null",
      fields: [
        { type: "text", name: "name", required: true, max: 100 },
        { type: "text", name: "collegeId", required: true, max: 50 },
        {
          type: "file",
          name: "avatar",
          maxSelect: 1,
          maxSize: 2097152,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        },
        { type: "text", name: "bio", max: 500 },
        { type: "url", name: "githubUrl" },
        { type: "json", name: "skills" },
        {
          type: "select",
          name: "primaryRole",
          values: [
            "Developer",
            "Designer",
            "Pitcher",
            "Researcher",
            "PM",
            "Hardware",
          ],
          maxSelect: 1,
          required: true,
        },
        {
          type: "select",
          name: "status",
          values: ["solo", "in_team"],
          maxSelect: 1,
          required: true,
        },
        { type: "text", name: "lookingFor", max: 200 },
        // I24: §4D mentor identity — schema gap closed (was no mentor flag).
        { type: "bool", name: "mentor" },
        // I24(M5): §4E admin identity — PB-dashboard-seeded, never self-claimable.
        { type: "bool", name: "admin" },
      ],
      passwordAuth: { enabled: true },
      otp: { enabled: true },
      indexes: ["CREATE UNIQUE INDEX idx_users_collegeId ON users (collegeId)"],
    });
    app.save(users);
    const usersId = users.id;

    const problemStatements = new Collection({
      type: "base",
      name: "problem_statements",
      listRule: "@request.auth.id != null",
      viewRule: "@request.auth.id != null",
      fields: [
        { type: "text", name: "title", required: true, max: 300 },
        {
          type: "select",
          name: "domain",
          values: [
            "Healthcare",
            "Agriculture",
            "EdTech",
            "FinTech",
            "Smart Cities",
            "Other",
          ],
          maxSelect: 1,
          required: true,
        },
        { type: "text", name: "description", required: true, max: 2000 },
        { type: "text", name: "source", max: 200 },
      ],
    });
    app.save(problemStatements);
    const problemsId = problemStatements.id;

    // --- matchmaking (§2 Mode 1, §8, §10) ---

    const swipes = new Collection({
      type: "base",
      name: "swipes",
      listRule: "fromUser = @request.auth.id",
      viewRule: "fromUser = @request.auth.id",
      createRule: "fromUser = @request.auth.id",
      fields: [
        {
          type: "relation",
          name: "fromUser",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "relation",
          name: "toUser",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "select",
          name: "direction",
          values: ["left", "right"],
          maxSelect: 1,
          required: true,
        },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_swipes_from_to ON swipes (fromUser, toUser)",
      ],
    });
    app.save(swipes);

    const matches = new Collection({
      type: "base",
      name: "matches",
      listRule: "userA = @request.auth.id || userB = @request.auth.id",
      viewRule: "userA = @request.auth.id || userB = @request.auth.id",
      fields: [
        {
          type: "relation",
          name: "userA",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "relation",
          name: "userB",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "select",
          name: "status",
          values: ["active", "converted_to_team"],
          maxSelect: 1,
          required: true,
        },
      ],
      // userA/userB are stored canonically (orderMatchPair) so both directions
      // collide on this index — the race backstop for simultaneous swipes.
      indexes: [
        "CREATE UNIQUE INDEX idx_matches_a_b ON matches (userA, userB)",
      ],
    });
    app.save(matches);
    const matchesId = matches.id;

    const matchMessages = new Collection({
      type: "base",
      name: "match_messages",
      listRule:
        "match.userA = @request.auth.id || match.userB = @request.auth.id",
      viewRule:
        "match.userA = @request.auth.id || match.userB = @request.auth.id",
      createRule:
        "match.userA = @request.auth.id || match.userB = @request.auth.id",
      fields: [
        {
          type: "relation",
          name: "match",
          collectionId: matchesId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "relation",
          name: "sender",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
        },
        { type: "text", name: "message", required: true, max: 2000 },
      ],
    });
    app.save(matchMessages);

    // --- teams + requests (§2 Mode 2) ---

    const teams = new Collection({
      type: "base",
      name: "teams",
      listRule: "@request.auth.id != null",
      viewRule: "@request.auth.id != null",
      createRule: "@request.auth.id != null",
      updateRule: "leader = @request.auth.id",
      fields: [
        { type: "text", name: "name", required: true, max: 100 },
        {
          type: "relation",
          name: "problemStatement",
          collectionId: problemsId,
          maxSelect: 1,
        },
        { type: "text", name: "inviteCode", required: true, max: 20 },
        {
          type: "select",
          name: "status",
          values: ["open", "closed"],
          maxSelect: 1,
          required: true,
        },
        { type: "json", name: "rolesNeeded" },
        {
          type: "relation",
          name: "leader",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
        },
        {
          type: "relation",
          name: "members",
          collectionId: usersId,
          maxSelect: 20,
        },
        { type: "url", name: "chatLink" },
        { type: "date", name: "deadline", required: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_teams_inviteCode ON teams (inviteCode)",
      ],
    });
    app.save(teams);
    const teamsId = teams.id;

    const joinRequests = new Collection({
      type: "base",
      name: "join_requests",
      listRule:
        "applicant = @request.auth.id || team.leader = @request.auth.id",
      viewRule:
        "applicant = @request.auth.id || team.leader = @request.auth.id",
      createRule: "applicant = @request.auth.id",
      updateRule: "team.leader = @request.auth.id",
      fields: [
        {
          type: "relation",
          name: "team",
          collectionId: teamsId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "relation",
          name: "applicant",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "select",
          name: "roleAppliedFor",
          values: [
            "Developer",
            "Designer",
            "Pitcher",
            "Researcher",
            "PM",
            "Hardware",
          ],
          maxSelect: 1,
          required: true,
        },
        { type: "text", name: "message", max: 500 },
        {
          type: "select",
          name: "status",
          values: ["pending", "accepted", "rejected"],
          maxSelect: 1,
          required: true,
        },
      ],
    });
    app.save(joinRequests);

    // --- workspace (§4B) ---

    const tasks = new Collection({
      type: "base",
      name: "tasks",
      listRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      viewRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      createRule: "team.members ~ @request.auth.id",
      updateRule: "team.members ~ @request.auth.id",
      fields: [
        {
          type: "relation",
          name: "team",
          collectionId: teamsId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { type: "text", name: "title", required: true, max: 200 },
        { type: "text", name: "description", max: 2000 },
        {
          type: "select",
          name: "status",
          values: ["idea", "ppt_draft", "prototype", "testing", "final_pitch"],
          maxSelect: 1,
          required: true,
        },
        {
          type: "relation",
          name: "assignedTo",
          collectionId: usersId,
          maxSelect: 1,
        },
        { type: "date", name: "dueDate" },
        {
          type: "select",
          name: "priority",
          values: ["low", "medium", "high"],
          maxSelect: 1,
          required: true,
        },
      ],
    });
    app.save(tasks);

    // --- resources (§4C) ---

    const resources = new Collection({
      type: "base",
      name: "resources",
      listRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      viewRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      createRule: "team.members ~ @request.auth.id",
      fields: [
        {
          type: "relation",
          name: "team",
          collectionId: teamsId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "select",
          name: "type",
          values: ["figma", "canva", "drive", "github", "excalidraw", "other"],
          maxSelect: 1,
          required: true,
        },
        { type: "url", name: "url", required: true },
        { type: "text", name: "title", required: true, max: 200 },
        {
          type: "relation",
          name: "uploadedBy",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
        },
        // §4C needs this to choose iframe-preview vs link card (spec gap, closed here)
        { type: "bool", name: "embeddable" },
      ],
    });
    app.save(resources);

    // --- mentorship (§4D) ---

    const mentorTickets = new Collection({
      type: "base",
      name: "mentor_tickets",
      listRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      viewRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      createRule:
        "team.members ~ @request.auth.id || @request.auth.mentor = true",
      // §4D: status transitions (assign/resolve) are mentor-only — 403 others.
      updateRule: "@request.auth.mentor = true",
      fields: [
        {
          type: "relation",
          name: "team",
          collectionId: teamsId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        { type: "text", name: "title", required: true, max: 200 },
        {
          type: "select",
          name: "status",
          values: ["open", "in_progress", "resolved"],
          maxSelect: 1,
          required: true,
        },
        {
          type: "relation",
          name: "assignedMentor",
          collectionId: usersId,
          maxSelect: 1,
        },
      ],
    });
    app.save(mentorTickets);
    const ticketsId = mentorTickets.id;

    const ticketMessages = new Collection({
      type: "base",
      name: "ticket_messages",
      listRule:
        "ticket.team.members ~ @request.auth.id || @request.auth.mentor = true",
      viewRule:
        "ticket.team.members ~ @request.auth.id || @request.auth.mentor = true",
      createRule:
        "ticket.team.members ~ @request.auth.id || @request.auth.mentor = true",
      fields: [
        {
          type: "relation",
          name: "ticket",
          collectionId: ticketsId,
          maxSelect: 1,
          required: true,
          cascadeDelete: true,
        },
        {
          type: "relation",
          name: "sender",
          collectionId: usersId,
          maxSelect: 1,
          required: true,
        },
        { type: "text", name: "message", required: true, max: 2000 },
        { type: "file", name: "attachment", maxSelect: 1, maxSize: 5242880 },
      ],
    });
    app.save(ticketMessages);
  },
  (app) => {
    // down — reverse creation order
    const names = [
      "ticket_messages",
      "mentor_tickets",
      "resources",
      "tasks",
      "join_requests",
      "teams",
      "match_messages",
      "matches",
      "swipes",
      "problem_statements",
      "users",
    ];
    for (const name of names) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch {
        // already gone — fine
      }
    }
  }
);
