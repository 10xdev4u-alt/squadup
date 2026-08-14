// ============================================================================
// Admin analytics aggregators (§4E) — pure, typed, DOM-free. Inputs are the
// admin-scoped DTOs; outputs are aggregates only — no member names, no emails,
// no raw records (the issue's "no PII leakage" rule).
// ============================================================================

import type { AdminTeamRow } from "@/lib/api/teams";
import type { MentorTicket, TicketStatus } from "@/types/squadup";

export interface DomainCount {
  domain: string;
  count: number;
}

export interface ActivityRow {
  teamId: string;
  teamName: string;
  count: number;
}

export interface TicketVolume {
  byStatus: { status: TicketStatus; count: number }[];
  total: number;
}

/** Most popular problem domains, most-frequent first. */
export function aggregateDomains(rows: AdminTeamRow[]): DomainCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.domain) continue;
    counts.set(row.domain, (counts.get(row.domain) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Team activity leaderboard — kanban tasks + hub resources per team.
 * Zero-activity teams still appear (at the bottom) so the table reads complete.
 */
export function aggregateActivity(
  teams: AdminTeamRow[],
  tasks: { id: string; team: string }[],
  resources: { id: string; team: string }[]
): ActivityRow[] {
  const counts = new Map<string, number>();
  for (const team of teams) counts.set(team.id, 0);
  for (const task of tasks) {
    if (counts.has(task.team))
      counts.set(task.team, (counts.get(task.team) ?? 0) + 1);
  }
  for (const resource of resources) {
    if (counts.has(resource.team))
      counts.set(resource.team, (counts.get(resource.team) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([teamId, count]) => ({
      teamId,
      teamName: teams.find((t) => t.id === teamId)?.name ?? "Unknown team",
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Mentor ticket volume by status, plus the running total. */
export function aggregateTicketVolume(tickets: MentorTicket[]): TicketVolume {
  const order: TicketStatus[] = ["open", "in_progress", "resolved"];
  const counts = new Map<TicketStatus, number>();
  for (const t of tickets) {
    counts.set(t.status, (counts.get(t.status) ?? 0) + 1);
  }
  return {
    byStatus: order
      .map((status) => ({ status, count: counts.get(status) ?? 0 }))
      .filter((entry) => entry.count > 0),
    total: tickets.length,
  };
}
