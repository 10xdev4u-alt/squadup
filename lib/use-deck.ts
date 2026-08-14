// ============================================================================
// useDeck — deck state for the discover page (§9).
// Loads the §10 deck through the typed data layer, then owns the local card
// stack: swiping records the action and removes the top card optimistically;
// an error keeps the card and surfaces the message.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DeckCandidate } from "@/lib/matching/deck";
import type { SwipeDirection } from "@/types/squadup";

export function useDeck() {
  const [candidates, setCandidates] = useState<DeckCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api()
      .swipes.fetchDeck()
      .then((deck) => {
        if (!cancelled) {
          setCandidates(deck);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load deck");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const swipe = useCallback(
    async (direction: SwipeDirection) => {
      const top = candidates[0];
      if (!top) return;
      setError(null);
      try {
        await api().swipes.recordSwipe({
          toUser: top.id,
          direction,
        });
        setCandidates((current) => current.slice(1));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong on our end. Please try again."
        );
      }
    },
    [candidates]
  );

  return {
    candidates,
    loading,
    empty: !loading && candidates.length === 0,
    error,
    swipe,
  };
}
