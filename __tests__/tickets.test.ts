import { describe, expect, it, vi } from "vitest";
import { createTicketsApi } from "@/lib/api/tickets";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeClient(
  overrides: {
    tickets?: Record<string, unknown>[];
    messages?: Record<string, unknown>[];
  } = {}
): {
  client: PbClient;
  ticketsService: PbRecordService;
  messagesService: PbRecordService;
} {
  const ticketsService = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 20,
      totalItems: overrides.tickets?.length ?? 0,
      totalPages: 1,
      items: overrides.tickets ?? [],
    })),
    update: vi.fn(async () => ({})),
  });
  const messagesService = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 200,
      totalItems: overrides.messages?.length ?? 0,
      totalPages: 1,
      items: overrides.messages ?? [],
    })),
    create: vi.fn(async () => ({})),
  });
  const client: PbClient = {
    collection: vi.fn((name: string) =>
      name === "ticket_messages" ? messagesService : ticketsService
    ),
    authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
  };
  return { client, ticketsService, messagesService };
}

describe("tickets api — updateTicketStatus", () => {
  it("moves a ticket between statuses (mentor-gated server-side)", async () => {
    const { client, ticketsService } = makeClient();
    const api = createTicketsApi(client);

    await api.updateTicketStatus("t1", "resolved");

    expect(ticketsService.update).toHaveBeenCalledWith("t1", {
      status: "resolved",
    });
  });
});

describe("tickets api — fetchMentorInbox", () => {
  it("lists all tickets for mentors (server rule scopes it)", async () => {
    const { client, ticketsService } = makeClient({
      tickets: [
        {
          id: "tk1",
          team: "t1",
          title: "Help with PPT",
          status: "open",
          assignedMentor: "",
          createdAt: "2026-08-14T08:00:00.000Z",
        },
      ],
    });
    const api = createTicketsApi(client);

    const inbox = await api.fetchMentorInbox();

    expect(ticketsService.getList).toHaveBeenCalledWith(
      1,
      100,
      expect.objectContaining({ sort: "-created" })
    );
    expect(inbox.items[0]).toMatchObject({
      id: "tk1",
      title: "Help with PPT",
      status: "open",
    });
  });
});

describe("tickets api — messages", () => {
  it("creates a message with only the ticket + text (sender is server-derived)", async () => {
    const { client, messagesService } = makeClient();
    const api = createTicketsApi(client);

    await api.createTicketMessage("tk1", "Can you review our deck?");

    expect(messagesService.create).toHaveBeenCalledWith({
      ticket: "tk1",
      message: "Can you review our deck?",
    });
  });

  it("fetches the thread oldest-first", async () => {
    const { client, messagesService } = makeClient({
      messages: [
        {
          id: "m1",
          ticket: "tk1",
          sender: "u-a",
          message: "Hi",
          createdAt: "2026-08-14T08:00:00.000Z",
        },
      ],
    });
    const api = createTicketsApi(client);

    const messages = await api.fetchTicketMessages("tk1");

    expect(messagesService.getList).toHaveBeenCalledWith(
      1,
      200,
      expect.objectContaining({ sort: "created" })
    );
    expect(messages).toHaveLength(1);
  });
});

describe("tickets api — thread data layer", () => {
  it("fetches a single ticket by id", async () => {
    const { client, ticketsService } = makeClient();
    ticketsService.getOne = vi.fn(async () => ({
      id: "tk1",
      team: "t1",
      title: "Help with PPT",
      status: "open",
      assignedMentor: "",
      createdAt: "2026-08-14T08:00:00.000Z",
    }));
    const api = createTicketsApi(client);

    const ticket = await api.fetchTicket("tk1");

    expect(ticketsService.getOne).toHaveBeenCalledWith("tk1");
    expect(ticket).toMatchObject({ id: "tk1", title: "Help with PPT" });
  });

  it("expands sender names on the thread", async () => {
    const { client, messagesService } = makeClient({
      messages: [
        {
          id: "m1",
          ticket: "tk1",
          sender: "u-a",
          message: "Hi",
          createdAt: "2026-08-14T08:00:00.000Z",
          expand: {
            sender: { id: "u-a", name: "Arjun Patel" },
          },
        },
      ],
    });
    const api = createTicketsApi(client);

    const messages = await api.fetchTicketMessages("tk1");

    expect(messagesService.getList).toHaveBeenCalledWith(
      1,
      200,
      expect.objectContaining({ expand: "sender" })
    );
    expect(messages[0]).toMatchObject({
      sender: "u-a",
      senderName: "Arjun Patel",
    });
  });

  it("subscribes to live messages with reconnect dedupe", async () => {
    const { client, messagesService } = makeClient();
    const onMessage = vi.fn();
    const api = createTicketsApi(client);

    await api.subscribeTicketMessages("tk1", onMessage);

    expect(messagesService.subscribe).toHaveBeenCalledWith(
      "*",
      expect.any(Function),
      expect.objectContaining({ filter: expect.stringContaining("tk1") })
    );

    const cb = (messagesService.subscribe as ReturnType<typeof vi.fn>).mock
      .calls[0]?.[1] as (e: {
      action: string;
      record: Record<string, unknown>;
    }) => void;
    const record = {
      id: "m2",
      ticket: "tk1",
      sender: "u-a",
      message: "Replay",
      createdAt: "2026-08-14T08:00:00.000Z",
    };
    // Reconnect replays the same event — dedupe must drop the second.
    cb({ action: "create", record });
    cb({ action: "create", record });

    expect(onMessage).toHaveBeenCalledTimes(1);
  });
});
