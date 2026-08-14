// pb_migrations/seed_demo.js
// §11 Phase 8 — beta launch demo seed. Opt-in via SQUADUP_SEED_DEMO=1 and
// idempotent: runs only when the teams collection is empty (never clobbers
// real data). Creates 8 demo users, 6 problem statements and 6 teams with
// tasks/resources so the dashboard, board and analytics have data to show.

migrate((app) => {
  const shouldRun = $os.getenv("SQUADUP_SEED_DEMO") === "1";
  if (!shouldRun) {
    return;
  }

  const existingTeams = app.countRecords("teams");
  if (existingTeams > 0) {
    // Never seed over real data.
    return;
  }

  const now = new Date();

  // --- 6 problem statements (§8 fields) ---
  const statementData = [
    { title: "Smart campus navigation app", domain: "Smart Cities" },
    { title: "AI crop disease detection", domain: "Agriculture" },
    { title: "Personalized learning assistant", domain: "EdTech" },
    { title: "Peer-to-peer payment for campus", domain: "FinTech" },
    { title: "Remote patient vitals monitoring", domain: "Healthcare" },
    { title: "Farm-to-table marketplace", domain: "Agriculture" },
  ];
  const statements = [];
  for (const data of statementData) {
    const st = new Record(app.findCollectionByNameOrId("problem_statements"));
    st.set("title", data.title);
    st.set("domain", data.domain);
    st.set("description", "Demo problem statement for beta launch.");
    st.set("source", "faculty");
    app.save(st);
    statements.push(st);
  }

  // --- 8 demo users (auth records, random passwords — demo-only) ---
  const userData = [
    {
      name: "Arjun Patel",
      collegeId: "21CS001",
      primaryRole: "Developer",
      skills: ["Frontend", "Backend"],
    },
    {
      name: "Sara Khan",
      collegeId: "21CS002",
      primaryRole: "Designer",
      skills: ["UI/UX Design"],
    },
    {
      name: "Dev Malhotra",
      collegeId: "21CS003",
      primaryRole: "Developer",
      skills: ["AI/ML", "Backend"],
    },
    {
      name: "Priya Sharma",
      collegeId: "21CS004",
      primaryRole: "Pitcher",
      skills: ["Pitching/Presentation"],
    },
    {
      name: "Rohan Iyer",
      collegeId: "21CS005",
      primaryRole: "Developer",
      skills: ["Mobile Dev"],
    },
    {
      name: "Meera Nair",
      collegeId: "21CS006",
      primaryRole: "Researcher",
      skills: ["Data Science", "Research"],
    },
    {
      name: "Kabir Singh",
      collegeId: "21CS007",
      primaryRole: "PM",
      skills: ["Project Management"],
    },
    {
      name: "Ananya Rao",
      collegeId: "21CS008",
      primaryRole: "Developer",
      skills: ["Hardware/IoT"],
    },
    {
      name: "Admin User",
      collegeId: "ADMIN001",
      primaryRole: "PM",
      skills: ["Project Management"],
      admin: true,
    },
    {
      name: "Mentor User",
      collegeId: "MENTOR001",
      primaryRole: "PM",
      skills: ["Project Management"],
      mentor: true,
    },
  ];
  const users = [];
  for (const data of userData) {
    const user = new Record(app.findCollectionByNameOrId("users"));
    user.set("email", `${data.collegeId.toLowerCase()}@svce.ac.in`);
    user.set("name", data.name);
    user.set("collegeId", data.collegeId);
    user.set("primaryRole", data.primaryRole);
    user.set("skills", data.skills);
    user.set("status", "in_team");
    if (data.admin) user.set("admin", true);
    if (data.mentor) user.set("mentor", true);
    user.setRandomPassword();
    app.save(user);
    users.push(user);
  }

  // --- 6 teams: leader + 1-2 members, deadline 48h out, 3 open / 3 closed ---
  const teamData = [
    {
      name: "NavTech",
      statement: statements[0],
      members: [0, 1, 4],
      status: "open",
      rolesNeeded: ["Researcher"],
    },
    {
      name: "AgriSense",
      statement: statements[1],
      members: [2, 5],
      status: "open",
      rolesNeeded: ["Designer", "Pitcher"],
    },
    {
      name: "EduLift",
      statement: statements[2],
      members: [6, 3],
      status: "open",
      rolesNeeded: ["Developer"],
    },
    {
      name: "CampusPay",
      statement: statements[3],
      members: [1, 4, 7],
      status: "closed",
      rolesNeeded: [],
    },
    {
      name: "VitaTrack",
      statement: statements[4],
      members: [0, 5],
      status: "closed",
      rolesNeeded: [],
    },
    {
      name: "FarmLink",
      statement: statements[5],
      members: [2, 3, 6],
      status: "closed",
      rolesNeeded: [],
    },
  ];
  for (let i = 0; i < teamData.length; i++) {
    const data = teamData[i];
    const leader = users[data.members[0]];
    const memberIds = data.members.map((idx) => users[idx].id);
    const team = new Record(app.findCollectionByNameOrId("teams"));
    team.set("name", data.name);
    team.set("problemStatement", data.statement.id);
    team.set("inviteCode", "DEMO" + String(i + 1).padStart(4, "0"));
    team.set("status", data.status);
    team.set("rolesNeeded", data.rolesNeeded);
    team.set("leader", leader.id);
    team.set("members", memberIds);
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    team.set("deadline", deadline);
    app.save(team);

    // 2-3 tasks per team on the kanban.
    const taskTitles = [
      "Finalize problem statement",
      "Build landing page",
      "Prepare demo script",
    ];
    for (const title of taskTitles) {
      const task = new Record(app.findCollectionByNameOrId("tasks"));
      task.set("team", team.id);
      task.set("title", title);
      task.set("description", "Demo task for beta launch.");
      task.set("status", "idea");
      task.set("priority", "medium");
      app.save(task);
    }
  }
});
