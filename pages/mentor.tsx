// ============================================================================
// Mentor inbox — the §4D "mentor workspace view". Mentors see every open
// ticket with its team, and can jump straight into that team's kanban +
// resources (the relaxed read rules from slice 2 make that possible) or the
// ticket thread (I25). Server-side: fetchMentorInbox is scoped by the
// ticket updateRule (mentor-only) and the teams viewRule stays broad.
// ============================================================================

import Link from "next/link";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import type { MentorTicket, TicketStatus } from "@/types/squadup";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "open",
  in_progress: "in progress",
  resolved: "resolved",
};

function statusVariant(
  status: TicketStatus
): "secondary" | "success" | "warning" | "danger" | "default" | "outline" {
  switch (status) {
    case "resolved":
      return "success";
    case "in_progress":
      return "warning";
    default:
      return "secondary";
  }
}

export default function MentorInboxPage() {
  useRequireAuth();
  const [tickets, setTickets] = useState<MentorTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api()
      .tickets.fetchMentorInbox()
      .then((page) => {
        if (!cancelled) setTickets(page.items);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error && tickets.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">
            Couldn&apos;t load the inbox
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-bold">Mentor inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teams need your context. Review their board and resources, then reply
          in the thread.
        </p>

        <section className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No open tickets — you&apos;re all caught up.
            </p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Team {ticket.team} · opened{" "}
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={statusVariant(ticket.status)}>
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    <Link
                      href={`/team/${ticket.team}/board`}
                      className="font-medium text-primary hover:underline"
                    >
                      Open team board
                    </Link>
                    <Link
                      href={`/team/${ticket.team}/resources`}
                      className="font-medium text-primary hover:underline"
                    >
                      Resources
                    </Link>
                    <Link
                      href={`/team/${ticket.team}/tickets/${ticket.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      View thread
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Layout>
  );
}
