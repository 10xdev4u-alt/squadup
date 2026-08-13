// ============================================================================
// PocketBase client singleton — the ONLY module that imports the PB SDK.
// Components and domain modules never touch `pocketbase` directly.
// URL comes from NEXT_PUBLIC_PB_URL, falling back to the local dev default
// (matches the README env contract; deploy prep I11 wires the real value).
// ============================================================================

import Client from "pocketbase";

export const DEFAULT_PB_URL = "http://127.0.0.1:8090";

let instance: Client | null = null;

export function getClient(): Client {
  if (!instance) {
    instance = new Client(process.env.NEXT_PUBLIC_PB_URL ?? DEFAULT_PB_URL);
  }
  return instance;
}
