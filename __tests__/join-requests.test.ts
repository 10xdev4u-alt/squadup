import { describe, expect, it, vi } from "vitest";
import { createJoinRequestsApi } from "@/lib/api/join-requests";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeClientWith(
  service: PbRecordService
): PbClient & { collection: ReturnType<typeof vi.fn> } {
  return {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
  };
}

const REQUEST_RECORD = {
  id: "jr1",
  team: "t1",
  applicant: "u-other",
  roleAppliedFor: "Developer",
  message: "I build things.",
  status: "pending",
  createdAt: "2026-08-14 12:00:00.000Z",
};

function makeSubscribeClient() {
  let callback:
    | ((event: { action: string; record: Record<string, unknown> }) => void)
    | null = null;
  const stop = vi.fn(async () => {});
  const service = makeService({
    subscribe: vi.fn(
      async (
        _topic: string,
        cb: (event: {
          action: string;
          record: Record<string, unknown>;
        }) => void,
        _options?: Record<string, unknown>
      ) => {
        callback = cb;
        return stop;
      }
    ),
  });
  return {
    client: makeClientWith(service),
    service,
    stop,
    fire: (record: Record<string, unknown>) =>
      callback?.({ action: "update", record }),
  };
}

describe("join requests api", () => {
  it("requests to join sending only team, role and message", async () => {
    const service = makeService({
      create: vi.fn(async () => REQUEST_RECORD),
    });
    const api = createJoinRequestsApi(makeClientWith(service));

    const request = await api.requestToJoin("t1", {
      roleAppliedFor: "Developer",
      message: "I build things.",
    });

    // §8 pattern: applicant + status are server-derived.
    expect(service.create).toHaveBeenCalledWith({
      team: "t1",
      roleAppliedFor: "Developer",
      message: "I build things.",
    });
    expect(request.status).toBe("pending");
  });

  it("fetches the leader's pending requests for a team", async () => {
    const service = makeService({
      getList: vi.fn(async () => ({
        page: 1,
        perPage: 50,
        totalItems: 1,
        totalPages: 1,
        items: [REQUEST_RECORD],
      })),
    });
    const api = createJoinRequestsApi(makeClientWith(service));

    const requests = await api.fetchRequests({ teamId: "t1" });

    expect(service.getList).toHaveBeenCalledWith(
      1,
      50,
      expect.objectContaining({
        filter: "team = 't1' && status = 'pending'",
      })
    );
    expect(requests[0]?.roleAppliedFor).toBe("Developer");
  });

  it("fetches my own requests when no team is given", async () => {
    const service = makeService();
    const api = createJoinRequestsApi(makeClientWith(service));

    await api.fetchRequests({});

    expect(service.getList).toHaveBeenCalledWith(
      1,
      50,
      expect.objectContaining({
        filter: "applicant = @request.auth.id",
      })
    );
  });

  it("decides a request with the leader's decision", async () => {
    const service = makeService({
      update: vi.fn(async () => ({ ...REQUEST_RECORD, status: "accepted" })),
    });
    const api = createJoinRequestsApi(makeClientWith(service));

    const decided = await api.decideRequest("jr1", "accepted");

    expect(service.update).toHaveBeenCalledWith("jr1", { status: "accepted" });
    expect(decided.status).toBe("accepted");
  });
});

describe("join requests api — subscribeMyRequests", () => {
  it("subscribes to my requests with a filter", async () => {
    const { client, service } = makeSubscribeClient();
    const api = createJoinRequestsApi(client);

    await api.subscribeMyRequests(() => {});

    expect(service.subscribe).toHaveBeenCalledWith(
      "*",
      expect.any(Function),
      expect.objectContaining({ filter: 'applicant = "u-me"' })
    );
  });

  it("delivers decisions and dedupes replays", async () => {
    const { client, fire } = makeSubscribeClient();
    const api = createJoinRequestsApi(client);
    const onDecision = vi.fn();

    await api.subscribeMyRequests(onDecision);
    const decided = { ...REQUEST_RECORD, status: "accepted" };

    fire(decided);
    fire(decided); // reconnect replay — dropped

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(onDecision).toHaveBeenCalledWith(
      expect.objectContaining({ id: "jr1", status: "accepted" })
    );
  });

  it("returns an unsubscribe handle", async () => {
    const { client, stop } = makeSubscribeClient();
    const api = createJoinRequestsApi(client);

    const unsubscribe = await api.subscribeMyRequests(() => {});
    await unsubscribe();

    expect(stop).toHaveBeenCalledOnce();
  });
});
