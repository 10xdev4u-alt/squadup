import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import Avatar from "@/components/avatar";
import type { MatchCard } from "@/lib/api/matches";
import type { MatchMessage } from "@/types/squadup";
import { cn } from "@/lib/utils";

export default function MatchThread() {
  useRequireAuth();
  const router = useRouter();
  const matchId = String(router.query.id ?? "");
  const meId = getCurrentUser(getClient())?.id ?? "";

  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [partner, setPartner] = useState<MatchCard | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Appends a message unless it is already in the thread. Both the optimistic
  // send result and the realtime echo can deliver the same record — order
  // depends on whether realtime fires before or after the POST resolves — so
  // every append path goes through here.
  const appendUnique = useCallback((message: MatchMessage) => {
    setMessages((current) =>
      current.some((m) => m.id === message.id) ? current : [...current, message]
    );
  }, []);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    api()
      .matches.fetchMatch(matchId)
      .then((match) => {
        if (!cancelled) setPartner(match);
      })
      .catch(() => {
        // non-critical — header degrades to "Chat"
      });
    api()
      .matches.fetchMessages(matchId)
      .then((msgs) => {
        if (!cancelled) setMessages(msgs);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    let active = true;
    let stop: (() => Promise<void>) | null = null;
    api()
      .matches.subscribeMessages(matchId, (message) => {
        if (active) {
          appendUnique(message);
        }
      })
      .then((unsubscribe) => {
        if (!active) {
          void unsubscribe();
        } else {
          stop = unsubscribe;
        }
      });
    return () => {
      active = false;
      if (stop) void stop();
    };
  }, [matchId, appendUnique]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || !matchId) return;
    setError(null);
    setSending(true);
    try {
      const sent = await api().matches.sendMessage(matchId, text);
      appendUnique(sent);
      setDraft("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  }, [draft, sending, matchId, appendUnique]);

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {partner ? (
              <Avatar name={partner.partnerName} size="md" />
            ) : (
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
            )}
            <h1 className="truncate text-xl font-bold">
              {partner ? partner.partnerName : "Chat"}
            </h1>
          </div>
          <Link
            href={`/team/new?match=${matchId}`}
            className="rounded-control bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Form a Team
          </Link>
        </header>

        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div
          aria-live="polite"
          className="mt-4 flex-1 space-y-3 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet — say hi and start building together.
            </p>
          ) : (
            messages.map((message) => {
              const mine = meId !== "" && message.sender === meId;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "max-w-[75%] rounded-card border px-4 py-2 text-sm",
                    mine
                      ? "ml-auto border-primary/40 bg-primary/10"
                      : "border-border bg-card"
                  )}
                >
                  {message.message}
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="mt-4 flex gap-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message..."
            maxLength={2000}
            className="w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Message"
          />
          <button
            type="submit"
            disabled={sending || draft.trim().length === 0}
            className="rounded-control bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Send
          </button>
        </form>
      </div>
    </Layout>
  );
}
