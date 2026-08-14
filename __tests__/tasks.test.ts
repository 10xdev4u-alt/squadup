import { describe, expect, it, vi } from "vitest";
import { createTasksApi } from "@/lib/api/tasks";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeTasksClient(
  overrides: {
    meId?: string;
    tasks?: Record<string, unknown>[];
  } = {}
): {
  client: PbClient;
  service: PbRecordService;
} {
  const service = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 50,
      totalItems: overrides.tasks?.length ?? 0,
      totalPages: 1,
      items: overrides.tasks ?? [],
    })),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    subscribe: vi.fn(async () => vi.fn(async () => {})),
  });
  const client: PbClient = {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({
      record: { id: overrides.meId ?? "u-me" },
      isValid: true,
    }),
  };
  return { client, service };
}

describe("tasks api — fetchTasks", () => {
  it("returns the team's tasks as DTOs", async () => {
    const { client, service } = makeTasksClient({
      tasks: [
        {
          id: "k1",
          team: "t1",
          title: "Wire the swipe deck",
          description: "",
          status: "idea",
          assignedTo: "",
          dueDate: "",
          priority: "high",
        },
      ],
    });
    const api = createTasksApi(client);

    const tasks = await api.fetchTasks("t1");

    expect(service.getList).toHaveBeenCalledWith(
      1,
      50,
      expect.objectContaining({ filter: expect.stringContaining("t1") })
    );
    expect(tasks).toEqual([
      {
        id: "k1",
        team: "t1",
        title: "Wire the swipe deck",
        description: "",
        status: "idea",
        assignedTo: null,
        dueDate: null,
        priority: "high",
      },
    ]);
  });
});

describe("tasks api — createTask", () => {
  it("sends only client-owned fields; defaults are server-derived", async () => {
    const { client, service } = makeTasksClient();
    const api = createTasksApi(client);

    await api.createTask("t1", {
      title: "Design the logo",
      description: "Figma draft",
      priority: "medium",
    });

    expect(service.create).toHaveBeenCalledWith({
      team: "t1",
      title: "Design the logo",
      description: "Figma draft",
      priority: "medium",
    });
  });
});

describe("tasks api — updateTaskStatus", () => {
  it("moves a card to a new column", async () => {
    const { client, service } = makeTasksClient();
    const api = createTasksApi(client);

    await api.updateTaskStatus("k1", "prototype");

    expect(service.update).toHaveBeenCalledWith("k1", {
      status: "prototype",
    });
  });
});

describe("tasks api — subscribeTasks", () => {
  it("delivers card moves deduped across a reconnect", async () => {
    let handler: ((e: unknown) => void) | undefined;
    const service = makeService({
      subscribe: vi.fn(async (_topic: string, cb: (e: unknown) => void) => {
        handler = cb;
        return vi.fn(async () => {});
      }),
    });
    const client: PbClient = {
      collection: vi.fn(() => service),
      authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
    };
    const api = createTasksApi(client);

    const received: unknown[] = [];
    await api.subscribeTasks("t1", (task) => received.push(task.title));

    const record = {
      id: "k1",
      team: "t1",
      title: "Wire the swipe deck",
      status: "prototype",
      priority: "high",
    };
    // replay: same id delivered twice (e.g. reconnect replay) -> delivered once
    handler?.({ action: "update", record });
    handler?.({ action: "update", record });
    handler?.({ action: "create", record });

    expect(received).toEqual(["Wire the swipe deck"]);
  });
});
