// ============================================================================
// Users domain module — profile editing (§8).
// EditableProfile contract: only name/avatar/bio/githubUrl/skills/primaryRole
// are client-owned; id/collegeId/status are server-owned and never sent.
// ============================================================================

import type { PrimaryRole, Skill, User } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";
import { toUser } from "@/lib/api/auth";

export interface ProfileUpdate {
  name: string;
  bio: string;
  githubUrl: string | null;
  avatar?: File | null;
  skills?: Skill[];
  primaryRole?: PrimaryRole;
}

export function createUsersApi(client: PbClient) {
  const users = () => client.collection("users");

  /** Persist the onboarding/profile edits, returning the updated User DTO. */
  async function updateProfile(
    userId: string,
    profile: ProfileUpdate
  ): Promise<User> {
    try {
      const body: Record<string, unknown> = {
        name: profile.name,
        bio: profile.bio,
        githubUrl: profile.githubUrl,
      };
      if (profile.avatar) {
        body.avatar = profile.avatar;
      }
      if (profile.skills) {
        body.skills = profile.skills;
      }
      if (profile.primaryRole) {
        body.primaryRole = profile.primaryRole;
      }
      const record = await users().update(userId, body);
      return toUser(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { updateProfile };
}
