import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import {
  AI_USAGE_PRESHARED_KEY,
  CRON_PRESHARED_KEY,
  DATABASE_PRESHARED_KEY,
  KEYSTROKES_PRESHARED_KEY,
  NYTIMES_PRESHARED_KEY,
} from "@/env/secret";

const presharedKeys = {
  aiUsage: AI_USAGE_PRESHARED_KEY,
  cron: CRON_PRESHARED_KEY,
  database: DATABASE_PRESHARED_KEY,
  keystrokes: KEYSTROKES_PRESHARED_KEY,
  nytimes: NYTIMES_PRESHARED_KEY,
};

// Hashing both sides first keeps the comparison constant-time even when the
// inputs differ in length, which timingSafeEqual itself does not allow
export const safeEqual = (a: string, b: string) => {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
};

// Thrown for a non-2xx upstream response, keeping the status so
// retryUnlessClientError can tell a client error from a transient failure
export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Reads the status from an HttpError, a graphql-request ClientError
// (`response.status`), or a garmin-connect error, which only carries it in its
// message: "ERROR: (429), Too Many Requests, …"
export const getHttpStatus = (error: unknown): number | undefined => {
  if (error instanceof HttpError) return error.status;
  if (!(error instanceof Error)) return undefined;

  const { response } = error as { response?: { status?: unknown } };
  if (typeof response?.status === "number") return response.status;

  const match = error.message.match(/^ERROR: \((\d{3})\)/);
  return match ? Number(match[1]) : undefined;
};

/**
 * `retry` option for backOff that gives up on 4xx responses. A rejected token
 * or a rate limit fails the same way on every attempt, and retrying a 429 only
 * spends more of the quota; the next cron run is minutes away anyway.
 */
export const retryUnlessClientError = (error: unknown) => {
  const status = getHttpStatus(error);
  return status === undefined || status < 400 || status >= 500;
};

/**
 * Validates the Authorization header against a preshared key.
 * Returns a 401 Response if invalid, or null if valid.
 */
export const validatePresharedKey = async (
  key: keyof typeof presharedKeys,
): Promise<Response | null> => {
  const headersList = await headers();
  const authorization = headersList.get("Authorization");

  const presharedKey = presharedKeys[key];

  if (!authorization || !safeEqual(authorization, `Bearer ${presharedKey}`)) {
    return new Response(null, { status: 401 });
  }

  return null;
};
