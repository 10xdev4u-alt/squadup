// ============================================================================
// Admin analytics — §4E. Three aggregate views (popular domains, team activity
// leaderboard, mentor ticket volume) computed from admin-scoped reads.
// Aggregates only: no member names, no emails, no raw records — the page only
// ever renders the outputs of lib/analytics.ts.
// ============================================================================

import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import EmptyState from "@/components/empty-state";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import {
  aggregateActivity,
  aggregateDomains,
  aggregateTicketVolume,
} from "@/lib/analytics";
import type { AdminAnalytics } from "@/lib/api/analytics";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export default function AdminAnalyticsPage() {
  const authed = useRequireAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin gate — same as the teams table (flag is PB-dashboard-seeded).
  useEffect(() => {
    const record = getClient().authStore.record as {
      id: string;
      admin?: boolean;
    } | null;
    if (authed && record && record.admin !== true) {
      router.replace("/");
    }
  }, [authed, router]);

  useEffect(() => {
    let cancelled = false;
    api()
      .analytics.fetchAdminAnalytics()
      .then((result) => {
        if (!cancelled) {
          setData(result);
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

  const domains = useMemo(
    () => (data ? aggregateDomains(data.teams) : []),
    [data]
  );
  const activity = useMemo(
    () =>
      data ? aggregateActivity(data.teams, data.tasks, data.resources) : [],
    [data]
  );
  const volume = useMemo(
    () => (data ? aggregateTicketVolume(data.tickets) : null),
    [data]
  );

  if (!authed) return null;

  const maxDomain = domains.length > 0 ? domains[0]!.count : 1;
  const maxActivity = activity.length > 0 ? activity[0]!.count : 1;

  return (
    <Layout>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Aggregate overview — domains, activity, and mentor tickets.
          </p>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Loading analytics…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : data && data.teams.length === 0 ? (
          <EmptyState
            title="No data yet"
            description="Analytics will appear once teams form and start working."
          />
        ) : data ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Domains */}
            <section className="rounded-card border border-border p-5">
              <h2 className="text-lg font-semibold">Popular domains</h2>
              {domains.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No teams yet.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {domains.map((d) => (
                    <li key={d.domain} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{d.domain}</span>
                        <span className="text-muted-foreground">{d.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(d.count / maxDomain) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Ticket volume */}
            <section className="rounded-card border border-border p-5">
              <h2 className="text-lg font-semibold">Mentor tickets</h2>
              <p className="mt-1 text-3xl font-bold">{volume?.total ?? 0}</p>
              <p className="text-sm text-muted-foreground">total tickets</p>
              {volume && volume.byStatus.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2 text-sm">
                  {volume.byStatus.map((entry) => (
                    <li
                      key={entry.status}
                      className="flex items-center justify-between"
                    >
                      <span>{STATUS_LABELS[entry.status] ?? entry.status}</span>
                      <span className="text-muted-foreground">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Activity leaderboard */}
            <section className="rounded-card border border-border p-5 lg:col-span-2">
              <h2 className="text-lg font-semibold">Team activity</h2>
              <p className="text-sm text-muted-foreground">
                Tasks and resources per team.
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2 font-medium">Team</th>
                      <th className="px-2 py-2 font-medium">Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr
                        key={row.teamId}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-2 py-2 font-medium">
                          {row.teamName}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{
                                  width: `${(row.count / maxActivity) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-muted-foreground">
                              {row.count}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
