// ============================================================================
// Admin analytics data module (§4E) — one bundle fetch for the analytics page.
// Read-only: no create/update calls here. All four reads are admin-gated by
// the relaxed list/view rules (I25 migration); writes stay member-scoped.
// Aggregates are computed client-side in lib/analytics.ts — no PII in DTOs.
// ============================================================================

import type { PbClient } from "@/lib/api/types";
import { createTeamsApi, type AdminTeamRow } from "@/lib/api/teams";
import { createTasksApi } from "@/lib/api/tasks";
import { createResourcesApi } from "@/lib/api/resources";
import { createTicketsApi } from "@/lib/api/tickets";
import type { MentorTicket, Resource, Task } from "@/types/squadup";

export interface AdminAnalytics {
  teams: AdminTeamRow[];
  tasks: Task[];
  resources: Resource[];
  tickets: MentorTicket[];
}

export function createAnalyticsApi(client: PbClient) {
  async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
    const [teams, tasks, resources, tickets] = await Promise.all([
      createTeamsApi(client)
        .fetchAdminTeams(1, 200)
        .then((r) => r.items),
      createTasksApi(client).fetchAllTasks(),
      createResourcesApi(client).fetchAllResources(),
      createTicketsApi(client)
        .fetchMentorInbox(1, 200)
        .then((r) => r.items),
    ]);
    return { teams, tasks, resources, tickets };
  }

  return { fetchAdminAnalytics };
}
