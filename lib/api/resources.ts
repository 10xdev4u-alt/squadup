// ============================================================================
// Resources domain module — the team's universal link hub (§4C, §8).
// DTO in, DTO out. type/embeddable are server-derived from the URL (the
// create hook); uploadedBy is server-owned. Members-only by collection rule.
// ============================================================================

import type { Resource } from "@/types/squadup";
import type { PbClient } from "@/lib/api/types";
import {
  clampPageParams,
  toPaginated,
  type Paginated,
} from "@/lib/api/pagination";
import { normalizeError } from "@/lib/api/error";

function toResource(record: Record<string, unknown>): Resource {
  return {
    id: String(record.id),
    team: String(record.team),
    type: record.type as Resource["type"],
    url: String(record.url),
    title: String(record.title),
    uploadedBy: String(record.uploadedBy ?? ""),
    embeddable: Boolean(record.embeddable),
    createdAt: String(record.created ?? ""),
  };
}

/** Fields the client may send — type/embeddable/uploadedBy are server-owned. */
export interface NewResource {
  url: string;
  title: string;
}

const PER_PAGE = 12;

export function createResourcesApi(client: PbClient) {
  const resources = () => client.collection("resources");

  async function fetchResources(
    teamId: string,
    page = 1
  ): Promise<Paginated<Resource>> {
    try {
      const { page: p, perPage } = clampPageParams(page, PER_PAGE);
      const result = await resources().getList(p, perPage, {
        filter: `team = '${teamId}'`,
        sort: "-created",
      });
      return toPaginated(result, toResource);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Admin-scoped: every resource across every team (§4E analytics). Gated by
   * the relaxed list rule — create stays member-scoped.
   */
  async function fetchAllResources(): Promise<Resource[]> {
    try {
      const list = await resources().getList(1, 200, { sort: "-created" });
      return list.items.map((r) => toResource(r as Record<string, unknown>));
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function createResource(
    teamId: string,
    input: NewResource
  ): Promise<Resource> {
    try {
      const record = await resources().create({
        team: teamId,
        url: input.url,
        title: input.title,
      });
      return toResource(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  return { fetchResources, fetchAllResources, createResource };
}
