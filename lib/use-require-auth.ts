// ============================================================================
// Client-side route guard. Returns whether the current session is valid and
// redirects to `redirectTo` (default /auth) when it is not. Read happens on
// render, navigation in an effect (no render-phase router calls).
// ============================================================================

import { useEffect } from "react";
import { useRouter } from "next/router";
import { getClient } from "@/lib/api/client";
import { isAuthenticated } from "@/lib/api/session";

export function useRequireAuth(redirectTo = "/auth"): boolean {
  const router = useRouter();
  const authed = isAuthenticated(getClient());

  useEffect(() => {
    if (!authed) {
      router.replace(redirectTo);
    }
  }, [authed, redirectTo, router]);

  return authed;
}
