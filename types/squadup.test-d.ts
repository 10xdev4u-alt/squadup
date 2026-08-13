// Type-level tests for the SquadUp domain model (PROPOSAL.md §8).
// `tsc --noEmit` is the test runner: every Assert<...> must resolve to true,
// and every @ts-expect-error line must actually error.

import type {
  EditableProfile,
  JoinRequest,
  JoinRequestStatus,
  MatchStatus,
  NewJoinRequest,
  PrimaryRole,
  ProblemDomain,
  ResourceType,
  Skill,
  SwipeDirection,
  TaskStatus,
  Team,
  TeamCard,
  TeamStatus,
  TicketStatus,
  User,
  UserStatus,
} from "./squadup";

type AssertEqual<T, U> = [T] extends [U]
  ? [U] extends [T]
    ? true
    : false
  : false;
type Assert<T extends true> = T;
type Keys<T> = keyof T;

// ---------- §4A/§8 literal unions are exactly the spec values ----------

type _skills = Assert<
  AssertEqual<
    Skill,
    | "Frontend"
    | "Backend"
    | "Full Stack"
    | "AI/ML"
    | "Data Science"
    | "UI/UX Design"
    | "Mobile Dev"
    | "Hardware/IoT"
    | "Blockchain"
    | "DevOps"
    | "Cloud/AWS"
    | "Video/Content"
    | "Pitching/Presentation"
    | "Research"
    | "Project Management"
  >
>;

type _roles = Assert<
  AssertEqual<
    PrimaryRole,
    "Developer" | "Designer" | "Pitcher" | "Researcher" | "PM" | "Hardware"
  >
>;

type _swipe = Assert<AssertEqual<SwipeDirection, "left" | "right">>;
type _userStatus = Assert<AssertEqual<UserStatus, "solo" | "in_team">>;
type _matchStatus = Assert<
  AssertEqual<MatchStatus, "active" | "converted_to_team">
>;
type _teamStatus = Assert<AssertEqual<TeamStatus, "open" | "closed">>;
type _joinStatus = Assert<
  AssertEqual<JoinRequestStatus, "pending" | "accepted" | "rejected">
>;
type _ticketStatus = Assert<
  AssertEqual<TicketStatus, "open" | "in_progress" | "resolved">
>;
type _taskStatus = Assert<
  AssertEqual<
    TaskStatus,
    "idea" | "ppt_draft" | "prototype" | "testing" | "final_pitch"
  >
>;
type _resourceType = Assert<
  AssertEqual<
    ResourceType,
    "figma" | "canva" | "drive" | "github" | "excalidraw" | "other"
  >
>;

// ---------- DTOs expose exactly the client-supplied fields ----------

type _newJoinKeys = Assert<
  AssertEqual<
    Keys<NewJoinRequest>,
    "team" | "applicant" | "roleAppliedFor" | "message"
  >
>;

type _teamCardKeys = Assert<
  AssertEqual<
    Keys<TeamCard>,
    "id" | "name" | "problemStatement" | "status" | "rolesNeeded"
  >
>;

// ---------- field-level guarantees ----------

type _reqRole = Assert<AssertEqual<JoinRequest["roleAppliedFor"], PrimaryRole>>;

// ---------- ProblemDomain: known literals + open-ended (SIH "etc.") ----------

type _domain = Assert<
  AssertEqual<
    ProblemDomain,
    | "Healthcare"
    | "Agriculture"
    | "EdTech"
    | "FinTech"
    | "Smart Cities"
    | (string & {})
  >
>;

// ---------- negative tests: bogus values must be rejected at compile time ----------

// @ts-expect-error — "deck" is not a TaskStatus
type _noDeck = Assert<AssertEqual<"deck", TaskStatus>>;

// @ts-expect-error — "maybe" is not a SwipeDirection
type _noMaybe = Assert<AssertEqual<"maybe", SwipeDirection>>;

// @ts-expect-error — EditableProfile must NOT equal full User (id/collegeId/status are server-owned)
type _noServerId = Assert<AssertEqual<EditableProfile, User>>;

// @ts-expect-error — TeamCard must not expose members or chatLink (privacy, §8 API rules)
type _noTeamMembers = Assert<AssertEqual<TeamCard, Team>>;
