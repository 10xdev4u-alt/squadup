import Link from "next/link";
import { useEffect, useState } from "react";
import Avatar from "@/components/avatar";
import Layout from "@/components/Layout";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { timeAgo } from "@/lib/time-ago";
import type { MatchCard } from "@/lib/api/matches";

export default function Matches() {
  useRequireAuth();
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api()
      .matches.fetchMatches()
      .then((matches) => {
        if (!cancelled) {
          setCards(matches);
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

  return (
    <Layout>
      <PageHeader
        title="Matches"
        description="Conversations with classmates you've matched with."
      />

      <div className="mt-6">
        {error ? (
          <div
            role="alert"
            className="rounded-card border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : loading ? (
          <div className="animate-pulse space-y-2 rounded-card border border-border bg-card p-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                aria-hidden="true"
                className="flex items-center gap-4 px-3 py-4"
              >
                <div className="h-10 w-10 rounded-full bg-elevated" />
                <div className="flex-1">
                  <div className="h-3 w-1/3 rounded bg-elevated" />
                  <div className="mt-2 h-2.5 w-1/4 rounded bg-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            title="No matches yet"
            description="Keep swiping — when you and another student swipe right on each other, the conversation starts here."
            actionLabel="Go discover"
          />
        ) : (
          <ul className="divide-y divide-border rounded-card border border-border bg-card">
            {cards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/matches/${card.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Avatar name={card.partnerName} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {card.partnerName}
                    </span>
                    {card.createdAt && (
                      <span className="block text-xs text-muted-foreground">
                        Matched {timeAgo(card.createdAt)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-primary">
                    Open chat
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
