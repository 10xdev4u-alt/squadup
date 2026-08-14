import Layout from "@/components/Layout";
import EmptyState from "@/components/empty-state";
import DeckSkeleton from "@/components/deck-skeleton";
import DeckCard from "@/components/deck-card";
import MatchToast from "@/components/match-toast";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useDeck } from "@/lib/use-deck";
import { useMatchRealtime } from "@/lib/use-match-realtime";

export default function Discover() {
  useRequireAuth();
  const { candidates, loading, empty, error, swipe } = useDeck();
  const { match, dismiss } = useMatchRealtime();
  const top = candidates[0];

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Discover</h1>

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 max-w-md">
        {loading ? (
          <DeckSkeleton />
        ) : empty ? (
          <EmptyState
            title="No squads to swipe yet"
            description="You've seen everyone currently on the deck. Invite a friend to get fresh profiles flowing."
          />
        ) : top ? (
          <DeckCard candidate={top} onSwipe={swipe} />
        ) : null}
      </div>

      <MatchToast match={match} onDismiss={dismiss} />
    </Layout>
  );
}
