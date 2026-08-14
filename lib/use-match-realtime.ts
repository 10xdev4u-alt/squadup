// ============================================================================
// useMatchRealtime — live match toasts (§9).
// Subscribes to matches involving the current user and surfaces each new one
// as a MatchEvent; the toast layer renders it once and dismiss() clears it.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import type { MatchEvent } from "@/lib/api/realtime";

export function useMatchRealtime() {
  const [match, setMatch] = useState<MatchEvent | null>(null);

  useEffect(() => {
    const user = getCurrentUser(getClient());
    if (!user) return;

    let stop: (() => Promise<void>) | null = null;
    let active = true;

    api()
      .realtime.subscribeMatches(user.id, (event) => {
        if (active) setMatch(event);
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
      if (stop) {
        void stop();
      }
    };
  }, []);

  const dismiss = useCallback(() => setMatch(null), []);

  return { match, dismiss };
}
