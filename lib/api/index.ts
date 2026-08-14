// ============================================================================
// API facade — the single import point for the whole data layer.
// `api().teams.fetchTeamCard(id)` etc. Components never see the SDK or the
// raw client; every call is DTO-in / DTO-out with normalized errors.
// ============================================================================

import { getClient } from "@/lib/api/client";
import { createTeamsApi } from "@/lib/api/teams";
import { createSwipesApi } from "@/lib/api/swipes";
import { createTicketsApi } from "@/lib/api/tickets";
import { createAuthApi } from "@/lib/api/auth";
import { createUsersApi } from "@/lib/api/users";
import { createRealtimeApi } from "@/lib/api/realtime";
import { createMatchesApi } from "@/lib/api/matches";
import { createJoinRequestsApi } from "@/lib/api/join-requests";
import { createTasksApi } from "@/lib/api/tasks";
import { createResourcesApi } from "@/lib/api/resources";
import { createAnalyticsApi } from "@/lib/api/analytics";
import { createTeamMessagesApi } from "@/lib/api/team-messages";

export function api() {
  const client = getClient();
  return {
    auth: createAuthApi(client),
    users: createUsersApi(client),
    teams: createTeamsApi(client),
    swipes: createSwipesApi(client),
    tickets: createTicketsApi(client),
    realtime: createRealtimeApi(client),
    matches: createMatchesApi(client),
    joinRequests: createJoinRequestsApi(client),
    tasks: createTasksApi(client),
    resources: createResourcesApi(client),
    analytics: createAnalyticsApi(client),
    teamMessages: createTeamMessagesApi(client),
  };
}

export type { ApiError, ApiErrorKind } from "@/lib/api/error";
export { getApiErrorMessage } from "@/lib/api/error";
export type { Paginated } from "@/lib/api/pagination";
export type {
  NewTeam,
  ProblemStatement,
  TeamDetail,
  TeamDirectoryFilters,
} from "@/lib/api/teams";
export type { RecordSwipeInput } from "@/lib/api/swipes";
export type { CreateTicketInput } from "@/lib/api/tickets";
export type { OtpSession, OtpRequest } from "@/lib/api/auth";
export type { ProfileUpdate } from "@/lib/api/users";
export type { MatchEvent } from "@/lib/api/realtime";
export type { MatchCard } from "@/lib/api/matches";
export type {
  RequestToJoinInput,
  FetchRequestsOptions,
} from "@/lib/api/join-requests";
export type { NewTask } from "@/lib/api/tasks";
export {
  getCurrentUser,
  isAuthenticated,
  requireAuth,
} from "@/lib/api/session";
