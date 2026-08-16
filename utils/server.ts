import { createHash, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import {
  CLAUDE_PRESHARED_KEY,
  CRON_PRESHARED_KEY,
  KEYSTROKES_PRESHARED_KEY,
  NYTIMES_PRESHARED_KEY,
} from "@/env/secret";

const presharedKeys = {
  claude: CLAUDE_PRESHARED_KEY,
  cron: CRON_PRESHARED_KEY,
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
