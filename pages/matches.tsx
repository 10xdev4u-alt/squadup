import Link from "next/link";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import EmptyState from "@/components/empty-state";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api } from "@/lib/api";
import type { MatchCard } from "@/lib/api/matches";

export default function Matches() {
  useRequireAuth();
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);

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
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Matches</h1>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading matches...</p>
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
                  className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="font-medium">{card.partnerName}</span>
                  <span className="text-xs text-muted-foreground">
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
