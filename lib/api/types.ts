// ============================================================================
// Structural client contract — domain modules depend on this minimal shape,
// not on the PocketBase SDK directly. Real client (lib/api/client.ts) and test
// mocks both satisfy it.
// ============================================================================

import type { RawListResult } from "@/lib/api/pagination";

export interface PbRecordService {
  getOne(
    id: string,
    options?: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
  getList(
    page: number,
    perPage: number,
    options?: Record<string, unknown>
  ): Promise<RawListResult>;
  create(
    body: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
  /** §7 email-OTP: request a one-time code (send-time gate lives in pb_hooks). */
  requestOTP(
    email: string,
    options?: Record<string, unknown>
  ): Promise<{ otpId?: string }>;
  /** §7 email-OTP: exchange otpId + code for a session. */
  authWithOTP(
    otpId: string,
    password: string,
    options?: Record<string, unknown>
  ): Promise<{ token: string; record: Record<string, unknown> }>;
}

/** Minimal auth session surface — matches the SDK's BaseAuthStore shape. */
export interface PbAuthStore {
  token: string;
  record: Record<string, unknown> | null;
  isValid: boolean;
}

export interface PbClient {
  collection(name: string): PbRecordService;
  authStore: PbAuthStore;
}
