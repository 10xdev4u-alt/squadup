// ============================================================================
// PocketBase client singleton — the ONLY module that imports the PB SDK.
// Components and domain modules never touch `pocketbase` directly.
// URL comes from NEXT_PUBLIC_PB_URL, falling back to the local dev default
// (matches the README env contract; deploy prep I11 wires the real value).
//
// The adapter below narrows the SDK surface to the structural contract
// (PbClient/PbRecordService) and normalizes realtime events into
// { action, record } — SDK specifics stay quarantined in this file.
// ============================================================================

import Client, { type RecordService } from "pocketbase";
import type {
  PbClient,
  PbRecordService,
  UnsubscribeFunc,
} from "@/lib/api/types";

export const DEFAULT_PB_URL = "http://127.0.0.1:8090";

let instance: Client | null = null;
let adapter: (PbClient & { baseURL: string }) | null = null;

function toRecordService(service: RecordService): PbRecordService {
  return {
    getOne: (id, options) => service.getOne(id, options),
    getList: (page, perPage, options) =>
      service.getList(page, perPage, options),
    create: (body, options) => service.create(body, options),
    update: (id, body, options) => service.update(id, body, options),
    requestOTP: (email, options) => service.requestOTP(email, options),
    authWithOTP: (otpId, password, options) =>
      service.authWithOTP(otpId, password, options),
    subscribe: (topic, callback, options): Promise<UnsubscribeFunc> =>
      service.subscribe(
        topic,
        (data) => {
          callback({
            action: data.action,
            record: data.record as Record<string, unknown>,
          });
        },
        options
      ),
    unsubscribe: (topic) => service.unsubscribe(topic),
  };
}

/** The singleton adapter — PbClient plus the SDK baseURL passthrough. */
export function getClient(): PbClient & { baseURL: string } {
  if (!instance) {
    instance = new Client(process.env.NEXT_PUBLIC_PB_URL ?? DEFAULT_PB_URL);
    // Two components can fire identical requests concurrently (e.g. the home
    // workspace card and the nav "My Team" link both fetch the user's team).
    // The SDK's default auto-cancellation aborts one of them; disable it so
    // both resolve independently.
    instance.autoCancellation(false);
  }
  if (!adapter) {
    const sdk = instance;
    adapter = {
      collection: (name) => toRecordService(sdk.collection(name)),
      authStore: sdk.authStore,
      baseURL: sdk.baseURL,
    };
  }
  return adapter;
}
