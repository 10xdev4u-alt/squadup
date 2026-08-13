import { vi } from "vitest";
import type { PbAuthStore, PbClient, PbRecordService } from "@/lib/api/types";

/**
 * Shared mock factory for the structural client contract.
 * Overrides can replace any method; the base returns empty shapes so tests
 * only stub what they assert on.
 */
export function makeService(
  overrides: Partial<PbRecordService> = {}
): PbRecordService {
  return {
    getOne: vi.fn(async () => ({})),
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
      items: [],
    })),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    requestOTP: vi.fn(async () => ({ otpId: "otp-stub" })),
    authWithOTP: vi.fn(async () => ({ token: "", record: {} })),
    ...overrides,
  };
}

export function makeAuthStore(
  overrides: Partial<PbAuthStore> = {}
): PbAuthStore {
  return { token: "", record: null, isValid: false, ...overrides };
}

export function makeClient(
  service: PbRecordService,
  authStore: PbAuthStore = makeAuthStore()
): PbClient {
  return { collection: vi.fn(() => service), authStore };
}
