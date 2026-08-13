// ============================================================================
// Onboarding gate — a fresh OTP-verified user has neither name nor collegeId
// (§8 onboarding fills them). True means "redirect to /onboarding".
// ============================================================================

import type { User } from "@/types/squadup";

export function needsOnboarding(user: User): boolean {
  return !user.name.trim() || !user.collegeId.trim();
}
