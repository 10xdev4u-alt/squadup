import { describe, expect, it } from "vitest";
import { clampPageParams, toPaginated, Paginated } from "@/lib/api/pagination";

describe("clampPageParams", () => {
  it("passes through valid page and perPage", () => {
    expect(clampPageParams(3, 25)).toEqual({ page: 3, perPage: 25 });
  });

  it("clamps perPage below 1 to 1 and above 200 to 200", () => {
    expect(clampPageParams(1, 0)).toEqual({ page: 1, perPage: 1 });
    expect(clampPageParams(1, 999)).toEqual({ page: 1, perPage: 200 });
  });

  it("clamps invalid pages to 1", () => {
    expect(clampPageParams(0, 20)).toEqual({ page: 1, perPage: 20 });
    expect(clampPageParams(-4, 20)).toEqual({ page: 1, perPage: 20 });
  });

  it("defaults perPage to 20 when missing", () => {
    expect(clampPageParams(2)).toEqual({ page: 2, perPage: 20 });
  });
});

describe("toPaginated", () => {
  const listResult = {
    page: 2,
    perPage: 20,
    totalItems: 42,
    totalPages: 3,
    items: [
      { id: "a", name: "A", secret: "x" },
      { id: "b", name: "B", secret: "y" },
    ],
  };

  it("maps raw records through a DTO mapper", () => {
    const out: Paginated<{ id: string; name: string }> = toPaginated(
      listResult,
      (r) => ({ id: String(r.id), name: String(r.name) })
    );
    expect(out.items).toEqual([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ]);
    expect(out.page).toBe(2);
    expect(out.totalItems).toBe(42);
    expect(out.totalPages).toBe(3);
  });
});
