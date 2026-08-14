// ============================================================================
// Admin teams table — §4E, read-only by design. `users.admin` is a
// PB-dashboard-seeded flag; this route is gated on it (non-admins bounce to
// /). No mutation surface exists: fetchAdminTeams only, no update/create
// calls, no write buttons. Filters are client-side over the paginated fetch.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import EmptyState from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAdmin } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { filterAdminTeams } from "@/lib/admin-filter";
import type { AdminTeamRow } from "@/lib/api/teams";
import type { ProblemDomain } from "@/types/squadup";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
};

const DOMAIN_OPTIONS: ProblemDomain[] = [
  "Healthcare",
  "Agriculture",
  "EdTech",
  "FinTech",
  "Smart Cities",
];

export default function AdminTeamsPage() {
  const authed = useRequireAdmin();
  const [rows, setRows] = useState<AdminTeamRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [domain, setDomain] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    api()
      .teams.fetchAdminTeams(1, 200)
      .then((result) => {
        if (!cancelled) {
          setRows(result.items);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible: AdminTeamRow[] = useMemo(
    () => filterAdminTeams(rows, { status, domain, query }),
    [rows, status, domain, query]
  );

  if (!authed) return null;

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">
            Read-only overview of every team, open or closed.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-status">Status</Label>
            <select
              id="admin-status"
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 rounded-control border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-domain">Domain</Label>
            <select
              id="admin-domain"
              aria-label="Filter by domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="h-9 rounded-control border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All</option>
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="admin-query">Search</Label>
            <Input
              id="admin-query"
              aria-label="Search teams"
              placeholder="Search by team or member name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading teams…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : visible.length === 0 ? (
          <EmptyState
            title="No teams found"
            description="Try clearing the filters, or check back after teams form."
          />
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Team</th>
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Members</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">{row.domain || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.status === "open" ? "default" : "secondary"
                        }
                      >
                        {STATUS_LABELS[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{row.memberCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", {
                        dateStyle: "medium",
                      }).format(new Date(row.deadline))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
