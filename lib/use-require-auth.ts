// ============================================================================
// Client-side route guards. Returns whether the current session is valid and
// redirects to `redirectTo` when it is not. Read happens on render,
// navigation in an effect (no render-phase router calls).
//   - useRequireAuth:  any authenticated session (default redirect /auth)
//   - useRequireAdmin: authenticated + the server-seeded `admin` flag
//                      (default redirect /) — closes §5.16, where each
//                      admin page re-implemented the same gate inline.
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

export function useRequireAdmin(redirectTo = "/"): boolean {
  const router = useRouter();
  const client = getClient();
  const authed = isAuthenticated(client);
  const record = client.authStore.record as {
    id: string;
    admin?: boolean;
  } | null;
  const isAdmin = authed && record?.admin === true;

  useEffect(() => {
    if (!isAdmin) {
      router.replace(redirectTo);
    }
  }, [isAdmin, redirectTo, router]);

  return isAdmin;
}
