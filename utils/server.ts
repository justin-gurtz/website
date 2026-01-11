import { headers } from "next/headers";
import { CRON_PRESHARED_KEY, NYTIMES_PRESHARED_KEY } from "@/env/secret";

const presharedKeys = {
  cron: CRON_PRESHARED_KEY,
  nytimes: NYTIMES_PRESHARED_KEY,
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

  if (authorization !== `Bearer ${presharedKey}`) {
    return new Response(null, { status: 401 });
  }

  return null;
};
