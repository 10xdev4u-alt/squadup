import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { isAuthenticated } from "@/lib/api/session";
import type { TeamCard } from "@/types/squadup";

/**
 * The "My Team" nav entry — resolves the current user's team (§2: at most one
 * active team) and links to its workspace. Renders nothing for signed-out
 * users or solo users, so the top bar stays meaningful in every state.
 */
export default function TeamNavLink() {
  const [team, setTeam] = useState<TeamCard | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const resolve = () => {
      const client = getClient();
      const fetchMyTeam = api().teams?.fetchMyTeam;
      if (!client || !fetchMyTeam || !isAuthenticated(client)) {
        if (!cancelled) setTeam(null);
        return;
      }
      fetchMyTeam()
        .then((found) => {
          if (!cancelled) setTeam(found);
        })
        .catch(() => {
          if (!cancelled) setTeam(null);
        });
    };
    try {
      resolve();
    } catch {
      if (!cancelled) setTeam(null);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  if (!team) return null;

  return (
    <Link
      href={`/team/${team.id}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      My Team
    </Link>
  );
}
