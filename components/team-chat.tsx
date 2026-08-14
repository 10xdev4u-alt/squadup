// ============================================================================
// Team chat — in-app collaboration for the workspace (§4B). Optimistic send
// plus a single appendUnique guard so the realtime echo of a just-sent
// message never duplicates it (realtime can fire mid-POST, before the
// optimistic append lands).
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import type { TeamMessage } from "@/types/squadup";

interface TeamChatProps {
  teamId: string;
}

export default function TeamChat({ teamId }: TeamChatProps) {
  const meId = getCurrentUser(getClient())?.id ?? "";
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const appendUnique = useCallback((message: TeamMessage) => {
    setMessages((current) =>
      current.some((m) => m.id === message.id) ? current : [...current, message]
    );
  }, []);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;
    api()
      .teamMessages.fetchMessages(teamId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    let active = true;
    let stop: (() => Promise<void>) | null = null;
    api()
      .teamMessages.subscribeMessages(teamId, (message) => {
        if (active) appendUnique(message);
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
  }, [teamId, appendUnique]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const sent = await api().teamMessages.sendMessage(teamId, text);
      appendUnique(sent);
      setDraft("");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      aria-labelledby="team-chat-heading"
      className="mt-10 rounded-card border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 id="team-chat-heading" className="text-lg font-semibold">
          Team Chat
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Private to your team — plan, split work, and stay in sync.
        </p>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages yet — say hi and start building together.
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.sender === meId;
            return (
              <div
                key={message.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  <p>{message.message}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="px-5 pb-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2 border-t border-border p-4">
        <label htmlFor="team-chat-message" className="sr-only">
          Message
        </label>
        <input
          id="team-chat-message"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Message the team..."
          className="flex-1 rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || !draft.trim()}
          className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </section>
  );
}
