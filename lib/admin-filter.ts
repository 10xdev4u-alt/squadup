// ============================================================================
// Admin teams table filters (§4E) — client-side, pure, typed. Lives here (not
// pb_hooks/domain.js) because it is UI logic over the AdminTeamRow DTO, not a
// server rule. The server never filters admin rows — fetchAdminTeams returns
// everything and the page reduces.
// ============================================================================

import type { AdminTeamRow } from "@/lib/api/teams";

export interface AdminFilters {
  status?: string;
  domain?: string;
  query?: string;
}

export function filterAdminTeams(
  rows: AdminTeamRow[],
  filters: AdminFilters = {}
): AdminTeamRow[] {
  const status = filters.status || "";
  const domain = filters.domain || "";
  const query = (filters.query || "").trim().toLowerCase();
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (domain && row.domain !== domain) return false;
    if (query) {
      const haystack = [row.name, ...row.memberNames].join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
