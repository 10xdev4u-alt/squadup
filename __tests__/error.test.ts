import { describe, expect, it } from "vitest";
import { ClientResponseError } from "pocketbase";
import {
  ApiError,
  getApiErrorMessage,
  normalizeError,
  toMessage,
} from "@/lib/api/error";

function pbError(status: number, extra: Record<string, unknown> = {}): ClientResponseError {
  return new ClientResponseError({
    url: "http://127.0.0.1:8090/api/collections/teams/records",
    status,
    response: { code: status, message: "server said no", data: {} },
    ...extra,
  });
}

describe("normalizeError", () => {
  it("maps a 401 response to unauthorized", () => {
    const err = normalizeError(pbError(401));
    expect(err.kind).toBe("unauthorized");
    expect(err.status).toBe(401);
  });

  it("maps a 403 response to forbidden, distinct from unauthorized", () => {
    const err = normalizeError(pbError(403));
    expect(err.kind).toBe("forbidden");
  });

  it("maps a 404 response to not_found", () => {
    const err = normalizeError(pbError(404));
    expect(err.kind).toBe("not_found");
  });

  it("maps a 400 validation response to validation", () => {
    const err = normalizeError(pbError(400));
    expect(err.kind).toBe("validation");
  });

  it("maps a network failure (status 0) to network", () => {
    const err = normalizeError(
      pbError(0, { originalError: new TypeError("fetch failed") })
    );
    expect(err.kind).toBe("network");
  });

  it("maps an unknown error to server", () => {
    const err = normalizeError(new Error("boom"));
    expect(err.kind).toBe("server");
  });

  it("always returns a structured ApiError", () => {
    const err: ApiError = normalizeError(pbError(500));
    expect(err).toMatchObject({
      kind: "server",
      status: 500,
      message: expect.any(String),
      cause: expect.anything(),
    });
  });
});

describe("toMessage", () => {
  it("gives actionable messages per kind", () => {
    expect(toMessage({ kind: "unauthorized" } as ApiError)).toMatch(/session|sign in/i);
    expect(toMessage({ kind: "network" } as ApiError)).toMatch(/reach|connection/i);
    expect(toMessage({ kind: "forbidden" } as ApiError)).toMatch(/permission/i);
  });
});

describe("getApiErrorMessage", () => {
  it("normalizes a raw ClientResponseError into a message", () => {
    const msg = getApiErrorMessage(pbError(401));
    expect(msg).toMatch(/session|sign in/i);
  });
});
