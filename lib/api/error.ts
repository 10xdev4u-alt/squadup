// ============================================================================
// Error normalization — single module mapping PocketBase SDK errors to typed
// ApiError values. Components consume `kind` + `message`, never raw statuses.
// 401 vs 403 are kept distinct because the auth flows differ (re-auth vs
// permission screen).
// ============================================================================

export type ApiErrorKind =
  | "network"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "server";

export interface ApiError {
  kind: ApiErrorKind;
  /** HTTP status when the server answered; 0 for network failures. */
  status: number;
  /** Human-readable, UI-ready message. */
  message: string;
  cause: unknown;
}

interface PbErrorLike {
  status?: number;
  response?: { message?: string };
  originalError?: unknown;
}

function isPbErrorLike(err: unknown): err is PbErrorLike {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as PbErrorLike).status === "number"
  );
}

const KIND_BY_STATUS: Record<number, ApiErrorKind> = {
  400: "validation",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  422: "validation",
};

const MESSAGES: Record<ApiErrorKind, string> = {
  network: "Cannot reach the server. Check your connection and try again.",
  unauthorized: "Your session has expired. Please sign in again.",
  forbidden: "You do not have permission to do that.",
  not_found: "That item no longer exists.",
  validation: "Some of the information you entered is invalid. Check and try again.",
  server: "Something went wrong on our end. Please try again.",
};

export function normalizeError(err: unknown): ApiError {
  const cause = err;

  if (!isPbErrorLike(err)) {
    return { kind: "server", status: 0, message: MESSAGES.server, cause };
  }

  const status = err.status ?? 0;

  // status 0 means the request never got a response — fetch failure / abort.
  if (status === 0) {
    return { kind: "network", status: 0, message: MESSAGES.network, cause };
  }

  const kind = KIND_BY_STATUS[status] ?? "server";
  const serverMessage = err.response?.message;
  const message =
    kind === "validation" && serverMessage
      ? serverMessage
      : MESSAGES[kind];

  return { kind, status, message, cause };
}

export function toMessage(err: ApiError): string {
  return err.message || MESSAGES[err.kind];
}

/** One-call convenience: normalize any thrown value into a UI message. */
export function getApiErrorMessage(err: unknown): string {
  return toMessage(normalizeError(err));
}
