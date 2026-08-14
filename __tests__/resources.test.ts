import { describe, expect, it, vi } from "vitest";
import { createResourcesApi } from "@/lib/api/resources";
import { makeAuthStore, makeService } from "@/__tests__/helpers/client";
import type { PbClient, PbRecordService } from "@/lib/api/types";

function makeResourcesClient(
  overrides: {
    resources?: Record<string, unknown>[];
  } = {}
): {
  client: PbClient;
  service: PbRecordService;
} {
  const service = makeService({
    getList: vi.fn(async () => ({
      page: 1,
      perPage: 12,
      totalItems: overrides.resources?.length ?? 0,
      totalPages: Math.max(
        1,
        Math.ceil((overrides.resources?.length ?? 0) / 12)
      ),
      items: overrides.resources ?? [],
    })),
    create: vi.fn(async () => ({})),
  });
  const client: PbClient = {
    collection: vi.fn(() => service),
    authStore: makeAuthStore({ record: { id: "u-me" }, isValid: true }),
  };
  return { client, service };
}

describe("resources api — fetchResources", () => {
  it("returns the team's resources paginated", async () => {
    const { client, service } = makeResourcesClient({
      resources: [
        {
          id: "r1",
          team: "t1",
          type: "figma",
          url: "https://www.figma.com/file/abc/Design",
          title: "Design v1",
          uploadedBy: "u-me",
          embeddable: true,
        },
      ],
    });
    const api = createResourcesApi(client);

    const result = await api.fetchResources("t1", 1);

    expect(service.getList).toHaveBeenCalledWith(
      1,
      12,
      expect.objectContaining({
        filter: expect.stringContaining("t1"),
        sort: "-created",
      })
    );
    expect(result.items).toEqual([
      {
        id: "r1",
        team: "t1",
        type: "figma",
        url: "https://www.figma.com/file/abc/Design",
        title: "Design v1",
        uploadedBy: "u-me",
        embeddable: true,
        createdAt: "",
      },
    ]);
    expect(result.totalPages).toBe(1);
  });
});

describe("resources api — createResource", () => {
  it("sends only team/url/title; type and embeddable are server-derived", async () => {
    const { client, service } = makeResourcesClient();
    const api = createResourcesApi(client);

    await api.createResource("t1", {
      url: "https://www.figma.com/file/abc/Design",
      title: "Design v1",
    });

    expect(service.create).toHaveBeenCalledWith({
      team: "t1",
      url: "https://www.figma.com/file/abc/Design",
      title: "Design v1",
    });
  });
});
