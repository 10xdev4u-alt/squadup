// ============================================================================
// SquadUp domain model — compile-time contracts for PROPOSAL.md §8.
// Type-tested by types/squadup.test-d.ts: `npm run typecheck` is the gate.
// ============================================================================

// ---------- Enumerations (§4A skill tags; §8 role select is authoritative) ----------

export const SKILLS = [
  "Frontend",
  "Backend",
  "Full Stack",
  "AI/ML",
  "Data Science",
  "UI/UX Design",
  "Mobile Dev",
  "Hardware/IoT",
  "Blockchain",
  "DevOps",
  "Cloud/AWS",
  "Video/Content",
  "Pitching/Presentation",
  "Research",
  "Project Management",
] as const;

/** §4A skill tags (multi-select, max 5 — enforced at runtime, not type level). */
export type Skill = (typeof SKILLS)[number];

export const PRIMARY_ROLES = [
  "Developer",
  "Designer",
  "Pitcher",
  "Researcher",
  "PM",
  "Hardware",
] as const;

/**
 * §8 primaryRole select. NOTE: §4A lists "PM/Coordinator" and "Hardware Engineer";
 * the schema (§8) wins — flag for a human decision before the auth hook is written.
 */
export type PrimaryRole = (typeof PRIMARY_ROLES)[number];

export const PROBLEM_DOMAINS = [
  "Healthcare",
  "Agriculture",
  "EdTech",
  "FinTech",
  "Smart Cities",
] as const;

/**
 * §8 domain select has an explicit "etc." — known literals for autocomplete,
 * open-ended via `(string & {})` so SIH problem statements never break the type.
 */
export type ProblemDomain = (typeof PROBLEM_DOMAINS)[number] | (string & {});

// ---------- Statuses (§8 selects, as literal unions) ----------

export type UserStatus = "solo" | "in_team";
export type SwipeDirection = "left" | "right";
export type MatchStatus = "active" | "converted_to_team";
export type TeamStatus = "open" | "closed";
export type JoinRequestStatus = "pending" | "accepted" | "rejected";
export type TaskStatus =
  "idea" | "ppt_draft" | "prototype" | "testing" | "final_pitch";
export type TaskPriority = "low" | "medium" | "high";
export type ResourceType =
  "figma" | "canva" | "drive" | "github" | "excalidraw" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved";

// ---------- Entities (§8 collections) ----------

export interface User {
  id: string;
  name: string;
  collegeId: string;
  avatar: string | null;
  bio: string;
  githubUrl: string | null;
  skills: Skill[];
  primaryRole: PrimaryRole;
  status: UserStatus;
  lookingFor: string;
}

export interface Swipe {
  id: string;
  fromUser: string;
  toUser: string;
  direction: SwipeDirection;
  createdAt: string;
}

export interface Match {
  id: string;
  userA: string;
  userB: string;
  status: MatchStatus;
  createdAt: string;
}

export interface MatchMessage {
  id: string;
  match: string;
  sender: string;
  message: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  problemStatement: string;
  inviteCode: string;
  status: TeamStatus;
  /** Open teams must have ≥1 entry — runtime rule (§10 directory filter). */
  rolesNeeded: PrimaryRole[];
  leader: string;
  members: string[];
  chatLink: string | null;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  team: string;
  applicant: string;
  roleAppliedFor: PrimaryRole;
  message: string;
  status: JoinRequestStatus;
  createdAt: string;
}

export interface Task {
  id: string;
  team: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string | null;
  dueDate: string | null;
  priority: TaskPriority;
}

export interface Resource {
  id: string;
  team: string;
  type: ResourceType;
  url: string;
  title: string;
  uploadedBy: string;
  /**
   * §4C needs this to choose iframe-preview vs link-card without re-detecting the
   * domain on every render. Schema gap flagged in review — not yet in §8.
   */
  embeddable: boolean;
  createdAt: string;
}

export interface MentorTicket {
  id: string;
  team: string;
  title: string;
  status: TicketStatus;
  assignedMentor: string | null;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticket: string;
  sender: string;
  message: string;
  attachment: string | null;
  createdAt: string;
}

export interface ProblemStatement {
  id: string;
  title: string;
  domain: ProblemDomain;
  description: string;
  source: string;
}

// ---------- DTOs: what the client may actually send (§8 API rules) ----------

/** Join request payload — status/createdAt are server-owned. */
export type NewJoinRequest = Omit<JoinRequest, "id" | "status" | "createdAt">;

/** Profile editing — id/collegeId/status are server-owned. */
export type EditableProfile = Omit<User, "id" | "collegeId" | "status">;

/** Directory card (§9 Browse Teams) — members/chatLink stay private. */
export type TeamCard = Pick<
  Team,
  "id" | "name" | "problemStatement" | "status" | "rolesNeeded"
>;

/** §4C link detection result — returned by detectResourceType(url). */
export interface ResourceInfo {
  type: ResourceType;
  embeddable: boolean;
}

// ---------- Realtime events (§7 PocketBase realtime; §10 match detection) ----------

export interface RealtimeEventMap {
  "match:created": { match: Match; otherUser: User };
  "join_request:created": { request: JoinRequest };
  "ticket:updated": { ticket: MentorTicket };
  "task:updated": { task: Task };
}

export type RealtimeEvent = keyof RealtimeEventMap;
