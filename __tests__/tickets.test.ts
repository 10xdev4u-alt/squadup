import { describe, expect, it, vi } from "vitest";
import { createTicketsApi } from "@/lib/api/tickets";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeService(overrides: Partial<PbRecordService> = {}): PbRecordService {
  return {
    getOne: vi.fn(async () => ({})),
    getList: vi.fn(async () => ({ page: 1, perPage: 20, totalItems: 0, totalPages: 0, items: [] })),
    create: vi.fn(async () => ({})),
    ...overrides,
  };
}

function makeClient(service: PbRecordService): PbClient {
  return { collection: vi.fn(() => service) };
}

const ticketRecord = {
  id: "tk1",
  team: "t1",
  title: "Need help with PocketBase rules",
  status: "open",
  assignedMentor: null,
  createdAt: "2026-08-13 10:00:00.000Z",
};

describe("tickets api", () => {
  it("creates a ticket sending only team and title", async () => {
    const service = makeService({ create: vi.fn(async () => ticketRecord) });
    const api = createTicketsApi(makeClient(service));

    const ticket = await api.createTicket({ team: "t1", title: "Need help with PocketBase rules" });

    // §8: status/assignedMentor are server-owned.
    expect(service.create).toHaveBeenCalledWith({
      team: "t1",
      title: "Need help with PocketBase rules",
    });
    expect(ticket).toEqual(ticketRecord);
  });

  it("lists a team's tickets paginated with a team filter", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 1,
        perPage: 20,
        totalItems: 1,
        totalPages: 1,
        items: [ticketRecord],
      })),
    });
    const api = createTicketsApi(makeClient(service));

    const result = await api.fetchTickets("t1", 1);

    expect(service.getList).toHaveBeenCalledWith(
      1,
      20,
      expect.objectContaining({ filter: expect.stringContaining("team") })
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ id: "tk1", title: "Need help with PocketBase rules" });
  });
});
