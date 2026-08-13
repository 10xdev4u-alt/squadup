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
}

export interface PbClient {
  collection(name: string): PbRecordService;
}
