// ============================================================================
// Pagination — every list call goes through getList with clamped page/perPage.
// No unbounded getFullList anywhere in the data layer.
// ============================================================================

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 200;

/** Normalize page/perPage to sane values before hitting the API. */
export function clampPageParams(
  page?: number,
  perPage?: number
): { page: number; perPage: number } {
  const p = typeof page === "number" && Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const raw = typeof perPage === "number" && Number.isFinite(perPage) ? Math.floor(perPage) : DEFAULT_PER_PAGE;
  const pp = Math.min(MAX_PER_PAGE, Math.max(1, raw));
  return { page: p, perPage: pp };
}

export interface RawListResult {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: unknown[];
}

/** Map a raw PocketBase list result into typed items — DTO at the boundary. */
export function toPaginated<T>(
  result: RawListResult,
  map: (record: Record<string, unknown>) => T
): Paginated<T> {
  return {
    items: (result.items ?? []).map((item) => map(item as Record<string, unknown>)),
    page: result.page,
    perPage: result.perPage,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
  };
}
