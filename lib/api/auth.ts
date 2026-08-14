// ============================================================================
// Auth domain module — §7 email-OTP flow. DTO in, DTO out.
// The send-time domain gate lives server-side in pb_hooks (onMailerRecordOTPSend);
// this module is the typed client surface: request a code, then verify it into
// a session. The session itself is owned by the SDK authStore; verifyOtp here
// returns the mapped User so callers never touch raw records.
// ============================================================================

import type { User } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";

export interface OtpSession {
  token: string;
  user: User;
}

export interface OtpRequest {
  otpId: string;
}

/** Map a PocketBase users record into the public User DTO (§8). */
export function toUser(record: Record<string, unknown>): User {
  return {
    id: String(record.id),
    name: String(record.name ?? ""),
    collegeId: String(record.collegeId ?? ""),
    avatar: record.avatar == null ? null : String(record.avatar),
    bio: String(record.bio ?? ""),
    githubUrl: record.githubUrl == null ? null : String(record.githubUrl),
    skills: Array.isArray(record.skills)
      ? (record.skills as User["skills"])
      : [],
    primaryRole: record.primaryRole as User["primaryRole"],
    status: (record.status as User["status"]) ?? "solo",
    lookingFor: String(record.lookingFor ?? ""),
    mentor: record.mentor === true,
    admin: record.admin === true,
  };
}

export function createAuthApi(client: PbClient) {
  const users = () => client.collection("users");

  /** Request a one-time code for a college (or allowlisted) email. */
  async function requestOtp(email: string): Promise<OtpRequest> {
    try {
      const res = await users().requestOTP(email);
      return { otpId: String(res.otpId ?? "") };
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /** Exchange otpId + code for a session, returning the mapped User. */
  async function verifyOtp(otpId: string, code: string): Promise<OtpSession> {
    try {
      const res = await users().authWithOTP(otpId, code);
      return { token: res.token, user: toUser(res.record) };
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { requestOtp, verifyOtp };
}
