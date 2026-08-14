// ============================================================================
// Ticket thread — the §4D context-aware help loop. Team members and mentors
// exchange messages (sender server-derived, names expanded), mentors move the
// status (server updateRule 403s non-mentors; this UI gates the same way via
// the I24 users.mentor flag). Realtime: new messages appear without reload.
// ============================================================================

import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import type {
  MentorTicket,
  TicketMessage,
  TicketStatus,
} from "@/types/squadup";

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

export default function TicketThreadPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");
  const ticketId = String(router.query.ticketId ?? "");
  const me = getCurrentUser(getClient());
  const meId = me?.id ?? "";
  const isMentor = me?.mentor === true;

  const [ticket, setTicket] = useState<MentorTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ticketId) return;
    let cancelled = false;
    api()
      .tickets.fetchTicket(ticketId)
      .then((t) => {
        if (!cancelled) setTicket(t);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      });
    api()
      .tickets.fetchTicketMessages(ticketId)
      .then((list) => {
        if (!cancelled) setMessages(list);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const unsub = api()
      .tickets.subscribeTicketMessages(ticketId, (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      })
      .catch(() => () => Promise.resolve());
    return () => {
      cancelled = true;
      void unsub.then((fn) => fn());
    };
  }, [ticketId]);

  useEffect(() => {
    // jsdom has no scrollTo on elements — guard for tests and older engines.
    scrollRef.current?.scrollTo?.({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !ticketId) return;
    setSending(true);
    setSendError(null);
    try {
      const created = await api().tickets.createTicketMessage(ticketId, text);
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });
      setDraft("");
    } catch (err) {
      setSendError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleStatus(next: TicketStatus) {
    if (!ticketId) return;
    try {
      await api().tickets.updateTicketStatus(ticketId, next);
      setTicket((prev) => (prev ? { ...prev, status: next } : prev));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  if (error && !ticket && messages.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">
            Couldn&apos;t load this thread
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {teamId && (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/team/${teamId}/tickets`}
              className="hover:text-foreground"
            >
              ← Back to Mentor Corner
            </Link>
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{ticket?.title ?? "Thread"}</h1>
          <div className="flex items-center gap-2">
            {ticket && (
              <Badge variant={statusVariant(ticket.status)}>
                {STATUS_LABELS[ticket.status]}
              </Badge>
            )}
            {isMentor && ticket && ticket.status !== "resolved" && (
              <div className="flex items-center gap-2">
                {ticket.status !== "in_progress" && (
                  <button
                    onClick={() => handleStatus("in_progress")}
                    className="rounded-md border px-3 py-1 text-sm font-medium hover:border-primary/40"
                  >
                    Mark in progress
                  </button>
                )}
                <button
                  onClick={() => handleStatus("resolved")}
                  className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Mark resolved
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {ticket?.assignedMentor
            ? "A mentor is on it."
            : "Waiting for a mentor to pick this up."}
        </p>

        <section className="mt-8 rounded-xl border bg-card">
          <div
            ref={scrollRef}
            className="max-h-96 space-y-4 overflow-y-auto p-5"
            aria-live="polite"
          >
            {loading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No messages yet — start the conversation.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                    message.sender === meId
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-xs font-medium opacity-80">
                    {message.senderName || message.sender}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap">
                    {message.message}
                  </p>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t p-3"
          >
            <label htmlFor="reply" className="sr-only">
              Reply
            </label>
            <input
              id="reply"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-ring focus:outline-none"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </form>
          {sendError && (
            <p role="alert" className="px-3 pb-3 text-sm text-destructive">
              {sendError}
            </p>
          )}
        </section>
      </main>
    </Layout>
  );
}
