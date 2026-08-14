// ============================================================================
// Mentor Corner — a team's mentorship tickets (§4D). Team members open tickets
// ("Help with X"), mentors reply via the thread (I25) and move status. Status
// is server-owned on create (defaults `open`); only mentors may change it
// (mentor-only updateRule). This page lists + opens; the thread lives at
// /team/[id]/tickets/[ticketId] once I25 lands.
// ============================================================================

import Link from "next/link";
import { useRouter } from "next/router";
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

export default function TeamTicketsPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");

  const [tickets, setTickets] = useState<MentorTicket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    api()
      .tickets.fetchTickets(teamId)
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
  }, [teamId]);

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !teamId) return;
    setOpening(true);
    setOpenError(null);
    try {
      const created = await api().tickets.createTicket({
        team: teamId,
        title: trimmed,
      });
      setTickets((prev) => [created, ...prev]);
      setTitle("");
    } catch (err) {
      setOpenError(getApiErrorMessage(err));
    } finally {
      setOpening(false);
    }
  }

  if (error && tickets.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">
            Couldn&apos;t load this team&apos;s tickets
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href={`/team/${teamId}`} className="hover:text-foreground">
                ← Back to workspace
              </Link>
            </p>
            <h1 className="mt-1 text-3xl font-bold">Mentor Corner</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Stuck? Open a ticket and a mentor will jump in with context on
              your board and resources.
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Open a ticket</h2>
          <form
            onSubmit={handleOpen}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="ticket-title" className="sr-only">
              What do you need help with?
            </label>
            <input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need help with?"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none"
              maxLength={200}
            />
            <button
              type="submit"
              disabled={opening || !title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {opening ? "Opening…" : "Open ticket"}
            </button>
          </form>
          {openError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {openError}
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Your tickets</h2>
          {loading ? (
            <div className="mt-4 space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No tickets yet — when you open one, it shows up here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4"
                >
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Opened {new Date(ticket.createdAt).toLocaleDateString()}
                      {ticket.assignedMentor
                        ? " · assigned"
                        : " · waiting for a mentor"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(ticket.status)}>
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                    <Link
                      href={`/team/${teamId}/tickets/${ticket.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Thread
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
