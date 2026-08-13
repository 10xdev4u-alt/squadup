// ============================================================================
// Session helpers — "who am I" + auth guards, built on the SDK authStore.
// Components use these instead of touching client.authStore directly.
// ============================================================================

import type { User } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { toUser } from "@/lib/api/auth";
import type { ApiError } from "@/lib/api/error";

/** The current authenticated user, or null when signed out. */
export function getCurrentUser(client: PbClient): User | null {
  const record = client.authStore.record;
  return record ? toUser(record) : null;
}

/** True when a valid (non-expired) session exists. */
export function isAuthenticated(client: PbClient): boolean {
  return client.authStore.isValid;
}

/**
 * Guard for data-fetch paths: returns the current user or throws a normalized
 * unauthorized ApiError (the UI layer maps that into a redirect to /login).
 */
export function requireAuth(client: PbClient): User {
  const user = getCurrentUser(client);
  if (!user) {
    const err: ApiError = {
      kind: "unauthorized",
      status: 401,
      message: "Your session has expired. Please sign in again.",
      cause: null,
    };
    throw err;
  }
  return user;
}
